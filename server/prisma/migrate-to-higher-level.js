'use strict';

// =====================================================================
// Phase 1 ETL — migrate identity from the module DBs into fea_higher_level
// =====================================================================
//
// Reads `users` from fea_mwq_dev + fea_aqms_dev, dedupes by email (case
// insensitive), and:
//   1. Upserts one HL `users` row per unique email (admin rows collapse).
//   2. Builds `user_application_access` grants:
//        - ADMIN in EITHER source DB  -> ADMIN grant on every application
//          (admin wins), per-app status carried from the source DB where
//          seen, else ACTIVE.
//        - otherwise -> one member grant per source app, role + status as in
//          that source DB.
//   3. Builds a (sourceDb, oldUserId) -> newHlUserId map and remaps the
//      user-referencing module tables to the consolidated HL id:
//        MWQ : reports, otps, audit_logs (audit_logs.userId is nullable)
//        AQMS: reports, otps, audit_logs, aqms_notification_logs
//      aqms_notification_logs.userId is NON-NULL — an unmapped row there is
//      FATAL (abort + rollback). refresh_tokens are intentionally NOT
//      migrated (all sessions invalidated; users re-login once).
//
// The DDL (drop user FKs + rename users/refresh_tokens to *_migrated_backup)
// is performed by the Prisma migration `drop_module_identity_to_hl`, applied
// BEFORE this script runs. This script only touches data, so Prisma's
// migration history stays authoritative and drift-free.
//
// Idempotent: HL writes are upserts; the per-DB remap runs at most once,
// gated on a marker row written into module `audit_logs`
// (action = 'HL_ETL_REMAP_DONE'). Re-running is a safe no-op.
//
// Usage:
//   node prisma/migrate-to-higher-level.js --dry-run   # counts only, no writes
//   node prisma/migrate-to-higher-level.js             # perform the migration
// =====================================================================

const { prismaMwq, prismaAqms, prismaHigherLevel } = require('../src/db/prisma');

const DRY_RUN = process.argv.includes('--dry-run');
const REMAP_MARKER = 'HL_ETL_REMAP_DONE';

// Status precedence for the legacy global User.role/accountStatus columns
// (the per-app status lives in user_application_access).
const STATUS_RANK = { ACTIVE: 0, PENDING: 1, SUSPENDED: 2, REJECTED: 3 };

const log = (...args) => console.log('[etl]', ...args);
const warn = (...args) => console.warn('[etl][warn]', ...args);

// ---------------------------------------------------------------------
// Raw reads (decoupled from the Prisma User model, which is removed in P1)
// ---------------------------------------------------------------------

async function tableExists(client, name) {
  const rows = await client.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
    name
  );
  return rows.length > 0;
}

// Read module users from `users`, or `users_migrated_backup` if the rename
// migration has already run (so the ETL works both before and after it).
async function readModuleUsers(client, dbLabel) {
  let source = 'users';
  if (!(await tableExists(client, 'users'))) {
    if (await tableExists(client, 'users_migrated_backup')) {
      source = 'users_migrated_backup';
    } else {
      throw new Error(`[${dbLabel}] neither "users" nor "users_migrated_backup" exists`);
    }
  }
  const rows = await client.$queryRawUnsafe(
    `SELECT "UserID"        AS id,
            "UserName"      AS "userName",
            email,
            "Password"      AS "passwordHash",
            "FirstName"     AS "firstName",
            "MiddleName"    AS "middleName",
            "LastName"      AS "lastName",
            "PhoneNumber"   AS "phoneNumber",
            "EmiratesId"    AS "emiratesId",
            role,
            "accountStatus" AS "accountStatus",
            "IsActive"      AS "isActive"
       FROM "${source}"`
  );
  log(`read ${rows.length} users from ${dbLabel} ("${source}")`);
  return rows;
}

async function distinctUserIds(client, table, nullable) {
  const rows = await client.$queryRawUnsafe(
    `SELECT DISTINCT "UserID" AS id FROM "${table}"${nullable ? ' WHERE "UserID" IS NOT NULL' : ''}`
  );
  return rows.map((r) => Number(r.id));
}

// ---------------------------------------------------------------------
// Aggregation: union module users by lower(email)
// ---------------------------------------------------------------------

function aggregateByEmail(mwqUsers, aqmsUsers) {
  const byEmail = new Map(); // emailLower -> aggregate

  const ingest = (rows, db) => {
    for (const u of rows) {
      const key = u.email.trim().toLowerCase();
      let agg = byEmail.get(key);
      if (!agg) {
        agg = { emailLower: key, email: u.email, profile: u, sources: [], isAdmin: false };
        byEmail.set(key, agg);
      }
      agg.sources.push({
        db,
        oldId: Number(u.id),
        role: u.role,
        status: u.accountStatus,
        userName: u.userName,
        isActive: u.isActive,
      });
      if (u.role === 'ADMIN') agg.isAdmin = true;
      // Prefer an MWQ source row for the profile; otherwise keep first seen.
      if (db === 'mwq') agg.profile = u;
    }
  };

  ingest(mwqUsers, 'mwq');
  ingest(aqmsUsers, 'aqms');
  return byEmail;
}

// Legacy global role/status for the HL User row (per-app lives in grants).
function legacyRole(agg) {
  if (agg.isAdmin) return 'ADMIN';
  return agg.profile.role; // member role from the preferred source
}
function legacyStatus(agg) {
  return agg.sources
    .map((s) => s.status)
    .reduce((best, s) => (STATUS_RANK[s] < STATUS_RANK[best] ? s : best), 'REJECTED');
}

// ---------------------------------------------------------------------
// HL backfill: users + grants (idempotent upserts)
// ---------------------------------------------------------------------

async function ensureHlUser(agg, takenUserNames) {
  const existing = await prismaHigherLevel.user.findFirst({
    where: { email: { equals: agg.email, mode: 'insensitive' } },
    select: { id: true, userName: true },
  });
  if (existing) {
    takenUserNames.add(existing.userName);
    return existing.id;
  }

  // Resolve a unique userName (single-DB uniqueness in HL now).
  let userName = agg.profile.userName;
  if (takenUserNames.has(userName)) {
    const base = userName;
    let n = 2;
    while (takenUserNames.has(userName)) userName = `${base}_${n++}`;
    warn(`userName collision: "${base}" -> "${userName}" for ${agg.email}`);
  }
  takenUserNames.add(userName);

  const created = await prismaHigherLevel.user.create({
    data: {
      userName,
      email: agg.email,
      passwordHash: agg.profile.passwordHash,
      firstName: agg.profile.firstName,
      middleName: agg.profile.middleName,
      lastName: agg.profile.lastName,
      phoneNumber: agg.profile.phoneNumber,
      emiratesId: agg.profile.emiratesId,
      role: legacyRole(agg),
      accountStatus: legacyStatus(agg),
      isActive: agg.profile.isActive,
    },
    select: { id: true },
  });
  return created.id;
}

async function upsertGrant(userId, applicationId, roleId, status) {
  await prismaHigherLevel.userApplicationAccess.upsert({
    where: { userId_applicationId: { userId, applicationId } },
    update: { roleId, status },
    create: { userId, applicationId, roleId, status },
  });
}

// ---------------------------------------------------------------------
// Per-module remap (atomic CASE update; gated by marker for idempotency)
// ---------------------------------------------------------------------

async function remapModule(client, dbLabel, idMap, tables) {
  // Idempotency gate.
  const done = await client.$queryRawUnsafe(
    `SELECT 1 FROM "audit_logs" WHERE "Action" = $1 LIMIT 1`,
    REMAP_MARKER
  );
  if (done.length > 0) {
    log(`[${dbLabel}] remap already done (marker present) — skipping`);
    return { skipped: true };
  }

  // Orphan verification BEFORE any write.
  for (const t of tables) {
    const ids = await distinctUserIds(client, t.name, t.nullable);
    const orphans = ids.filter((id) => !idMap.has(id));
    if (orphans.length > 0) {
      const msg = `[${dbLabel}] table "${t.name}" has ${orphans.length} unmapped userId(s): ${orphans.join(',')}`;
      if (t.fatal) throw new Error(`FATAL ${msg} (non-nullable, no SetNull escape)`);
      throw new Error(`${msg}`);
    }
  }

  if (DRY_RUN) {
    log(`[${dbLabel}] dry-run: all userIds resolve in [${tables.map((t) => t.name).join(', ')}]`);
    return { skipped: false, dryRun: true };
  }

  // Build CASE pairs from the per-DB old->new map.
  const pairs = [...idMap.entries()];
  const caseExpr = pairs.map(([o, n]) => `WHEN ${o} THEN ${n}`).join(' ');
  const oldIds = pairs.map(([o]) => o).join(',');

  await client.$transaction(async (tx) => {
    for (const t of tables) {
      const updated = await tx.$executeRawUnsafe(
        `UPDATE "${t.name}" SET "UserID" = CASE "UserID" ${caseExpr} ELSE "UserID" END WHERE "UserID" IN (${oldIds})`
      );
      log(`[${dbLabel}] remapped ${updated} row(s) in "${t.name}"`);
    }
    // Idempotency marker (audit_logs.userId is nullable).
    await tx.$executeRawUnsafe(
      `INSERT INTO "audit_logs" ("UserID", "Action", "EntityType", "CreatedAt") VALUES (NULL, $1, 'migration', CURRENT_TIMESTAMP)`,
      REMAP_MARKER
    );
  });
  return { skipped: false };
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

async function main() {
  log(DRY_RUN ? 'DRY RUN — no writes will be made' : 'LIVE RUN');

  // RBAC reference data (seeded in Phase 0).
  const apps = await prismaHigherLevel.application.findMany({ select: { id: true, code: true } });
  const roles = await prismaHigherLevel.rbacRole.findMany({ select: { id: true, code: true } });
  const APP = Object.fromEntries(apps.map((a) => [a.code, a.id]));
  const ROLE = Object.fromEntries(roles.map((r) => [r.code, r.id]));
  for (const code of ['MWQ', 'AQMS']) if (!APP[code]) throw new Error(`HL application "${code}" missing — run seed:hl`);
  for (const code of ['ADMIN', 'MWQ_MEMBER', 'AQMS_MEMBER']) if (!ROLE[code]) throw new Error(`HL role "${code}" missing — run seed:hl`);

  // 1. Read + aggregate.
  const mwqUsers = await readModuleUsers(prismaMwq, 'MWQ');
  const aqmsUsers = await readModuleUsers(prismaAqms, 'AQMS');
  const byEmail = aggregateByEmail(mwqUsers, aqmsUsers);

  const unionByEmail = byEmail.size;
  const adminAggs = [...byEmail.values()].filter((a) => a.isAdmin);
  const adminSourceRows = adminAggs.reduce((n, a) => n + a.sources.length, 0);

  log(`source rows: MWQ=${mwqUsers.length}, AQMS=${aqmsUsers.length}`);
  log(`distinct union-by-email: ${unionByEmail}`);
  log(`admin emails: ${adminAggs.length} (from ${adminSourceRows} source rows) -> collapse to ${adminAggs.length} HL row(s)`);

  // 2. Backfill HL users + grants; build the (db,oldId)->hlId map.
  const mwqMap = new Map(); // oldId -> hlId
  const aqmsMap = new Map();
  const takenUserNames = new Set();
  let createdUsers = 0;
  let reusedUsers = 0;

  for (const agg of byEmail.values()) {
    let hlId;
    if (DRY_RUN) {
      const existing = await prismaHigherLevel.user.findFirst({
        where: { email: { equals: agg.email, mode: 'insensitive' } },
        select: { id: true },
      });
      hlId = existing ? existing.id : `NEW(${agg.email})`;
      existing ? reusedUsers++ : createdUsers++;
    } else {
      const before = await prismaHigherLevel.user.findFirst({
        where: { email: { equals: agg.email, mode: 'insensitive' } },
        select: { id: true },
      });
      hlId = await ensureHlUser(agg, takenUserNames);
      before ? reusedUsers++ : createdUsers++;
    }

    // Map every source (db,oldId) to this HL id. In dry-run hlId is a string
    // sentinel — we still record the key so the orphan check can validate
    // coverage; the CASE remap (numeric only) never runs in dry-run.
    for (const s of agg.sources) {
      (s.db === 'mwq' ? mwqMap : aqmsMap).set(s.oldId, hlId);
    }

    if (DRY_RUN || typeof hlId !== 'number') continue;

    // Grants.
    if (agg.isAdmin) {
      for (const code of ['MWQ', 'AQMS']) {
        const src = agg.sources.find((s) => (code === 'MWQ' ? s.db === 'mwq' : s.db === 'aqms'));
        const status = src ? src.status : 'ACTIVE';
        await upsertGrant(hlId, APP[code], ROLE.ADMIN, status);
      }
    } else {
      for (const s of agg.sources) {
        const code = s.db === 'mwq' ? 'MWQ' : 'AQMS';
        const roleId = ROLE[s.role] || ROLE[code === 'MWQ' ? 'MWQ_MEMBER' : 'AQMS_MEMBER'];
        await upsertGrant(hlId, APP[code], roleId, s.status);
      }
    }
  }

  log(`HL users: created=${createdUsers}, reused(existing email)=${reusedUsers}`);

  // 3. Remap module FKs.
  const mwqRemap = await remapModule(prismaMwq, 'MWQ', mwqMap, [
    { name: 'reports', nullable: false, fatal: true },
    { name: 'otps', nullable: false, fatal: true },
    { name: 'audit_logs', nullable: true, fatal: false },
  ]);
  const aqmsRemap = await remapModule(prismaAqms, 'AQMS', aqmsMap, [
    { name: 'reports', nullable: false, fatal: true },
    { name: 'otps', nullable: false, fatal: true },
    { name: 'audit_logs', nullable: true, fatal: false },
    { name: 'aqms_notification_logs', nullable: false, fatal: true },
  ]);

  // 4. Summary + assertions.
  log('================ SUMMARY ================');
  log(`union-by-email (distinct module users): ${unionByEmail}`);
  log(`admin emails collapsed: ${adminSourceRows} source rows -> ${adminAggs.length} HL user(s)`);
  log(`MWQ id map entries: ${mwqMap.size}; AQMS id map entries: ${aqmsMap.size}`);
  log(`remap MWQ:`, JSON.stringify(mwqRemap), '| remap AQMS:', JSON.stringify(aqmsRemap));

  if (!DRY_RUN) {
    // AC2 assertions against HL.
    const moduleEmails = new Set([...byEmail.values()].map((a) => a.emailLower));
    const hlUsers = await prismaHigherLevel.user.findMany({ select: { id: true, email: true } });
    const hlModuleUsers = hlUsers.filter((u) => moduleEmails.has(u.email.toLowerCase()));
    if (hlModuleUsers.length !== unionByEmail) {
      throw new Error(`ASSERT FAIL: HL has ${hlModuleUsers.length} module-derived users, expected ${unionByEmail}`);
    }
    // Admin collapsed to one HL row with a grant on every app.
    for (const a of adminAggs) {
      const u = hlUsers.find((x) => x.email.toLowerCase() === a.emailLower);
      const grants = await prismaHigherLevel.userApplicationAccess.count({ where: { userId: u.id } });
      if (grants < apps.length) {
        throw new Error(`ASSERT FAIL: admin ${a.email} has ${grants} grants, expected ${apps.length}`);
      }
    }
    log('assertions PASS: union-by-email count + admin multi-app grants');
  }

  log('ETL complete.');
}

main()
  .catch((err) => {
    console.error('[etl][ERROR]', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([
      prismaMwq.$disconnect(),
      prismaAqms.$disconnect(),
      prismaHigherLevel.$disconnect(),
    ]);
  });
