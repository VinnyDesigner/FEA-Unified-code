'use strict';

// Baseline RBAC seed for the higher-level DB (idempotent).
// Mirrors the seed block in server/sql/01_higher_level.sql:
// applications, roles, permissions, role_permissions. Does NOT create users or
// user_application_access (those come from the Phase 1 ETL / signup).

const { PrismaClient } = require('../node_modules/.prisma/client-higher-level');

const prisma = new PrismaClient();

const APPLICATIONS = [
  { code: 'MWQ', name: 'Marine Water Quality', description: 'Buoy-based marine water-quality monitoring' },
  { code: 'AQMS', name: 'Air Quality Monitoring System', description: 'Fixed-station air-quality monitoring' },
];

const ROLES = [
  { code: 'ADMIN', name: 'Administrator', description: 'Full access across all applications', isSystem: true },
  { code: 'MWQ_MEMBER', name: 'MWQ Member', description: 'Standard access to the MWQ application', isSystem: true },
  { code: 'AQMS_MEMBER', name: 'AQMS Member', description: 'Standard access to the AQMS application', isSystem: true },
];

const PERMISSIONS = [
  { code: 'data:read', name: 'Read monitoring data', description: 'View stations/buoys, observations, latest readings' },
  { code: 'alarms:read', name: 'Read alarms', description: 'View alarms and violations' },
  { code: 'reports:generate', name: 'Generate reports', description: 'Submit report generation requests' },
  { code: 'reports:download', name: 'Download reports', description: 'Download generated report files' },
  { code: 'users:manage', name: 'Manage users', description: 'Admin CRUD over users and access grants' },
];

const MEMBER_PERMISSIONS = ['data:read', 'alarms:read', 'reports:generate', 'reports:download'];

async function main() {
  for (const app of APPLICATIONS) {
    await prisma.application.upsert({ where: { code: app.code }, update: {}, create: app });
  }
  for (const role of ROLES) {
    await prisma.rbacRole.upsert({ where: { code: role.code }, update: {}, create: role });
  }
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code: perm.code }, update: {}, create: perm });
  }

  const roles = await prisma.rbacRole.findMany();
  const perms = await prisma.permission.findMany();
  const byRole = Object.fromEntries(roles.map((r) => [r.code, r.id]));
  const byPerm = Object.fromEntries(perms.map((p) => [p.code, p.id]));

  // ADMIN → every permission
  for (const p of perms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: byRole.ADMIN, permissionId: p.id } },
      update: {},
      create: { roleId: byRole.ADMIN, permissionId: p.id },
    });
  }

  // Members → read + report permissions (not user management)
  for (const memberRole of ['MWQ_MEMBER', 'AQMS_MEMBER']) {
    for (const code of MEMBER_PERMISSIONS) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: byRole[memberRole], permissionId: byPerm[code] } },
        update: {},
        create: { roleId: byRole[memberRole], permissionId: byPerm[code] },
      });
    }
  }

  const counts = {
    applications: await prisma.application.count(),
    roles: await prisma.rbacRole.count(),
    permissions: await prisma.permission.count(),
    rolePermissions: await prisma.rolePermission.count(),
  };
  console.log('higher-level RBAC seed complete:', counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
