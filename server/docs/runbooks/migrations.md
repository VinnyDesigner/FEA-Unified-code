# Migrations Runbook

## 1. Local development

**Prerequisites:**
- Postgres 14+ with pg_partman extension installed.
  - Ubuntu: `sudo apt install postgresql-16-partman`
  - Docker: use `postgres:16` image with partman, or a dedicated image like `ghcr.io/pksilen/postgresql-partman`.
- Node 20+

**Initial setup:**
```bash
cd server
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET
npx prisma migrate dev
npx prisma db seed
```

## 2. Production migrations

- Use `npx prisma migrate deploy` (NOT `migrate dev`).
- `DATABASE_URL` must be the **direct** connection string (not pgbouncer — Prisma migrate requires advisory locks).
- Run migrations **before** deploying new server code. The server reads the new schema on boot.
- On Render: add `npx prisma migrate deploy` as a pre-start command in the deploy hook.
- Capture and store migration logs for audit.

## 3. CRITICAL: Never run `prisma db pull` against this database

The pg_partman partitioning structure is invisible to Prisma introspection. Running `db pull` will regenerate non-partitioned table definitions, silently breaking the storage layout and overwriting your schema files.

If you need to introspect the live schema, query Postgres system catalogs directly or use pgAdmin. Never use `prisma db pull`.

## 4. Adding new tables

- **Time-series tables** (high-volume observations): add to the partition list in the raw SQL appendix of the init migration AND write a follow-up migration that converts the table to partitioned form (see T10 for the pattern).
- **Slowly-changing dimensions** (stations, parameters, users): regular `prisma migrate dev` is fine.

For indexes on partitioned tables, use `CREATE INDEX CONCURRENTLY` in a separate follow-up migration to avoid blocking writers:
```sql
-- In a follow-up migration (not the same as the table creation):
CREATE INDEX CONCURRENTLY idx_aqms_aq_station_recorded
  ON "AqmsAirQualityReading" ("stationId", "recordedAt" DESC);
```

## 5. pg_partman maintenance

pg_partman requires periodic `partman.run_maintenance()` calls to pre-create future partitions. If your Postgres provider does not support pg_cron:

1. Use the maintenance script: `server/scripts/partman-maintenance.js`
2. Schedule it as a Render Cron Job (every 6 hours):
   ```bash
   node scripts/partman-maintenance.js
   ```
   The script runs: `SELECT partman.run_maintenance(p_analyze => true);`

Check that partitions are being created:
```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename LIKE '"AqmsAirQualityReading"%'
ORDER BY tablename;
```

## 6. Render-specific notes

Verify pg_partman is available on your Render Postgres tier:
```sql
SELECT * FROM pg_available_extensions WHERE name = 'pg_partman';
```

- **Render free tier:** pg_partman is NOT available. Use paid tier or self-host.
- **Fallback (no pg_partman):** Use native `PARTITION BY RANGE` manually, and run `server/scripts/create-next-partition.js` monthly via Render Cron to pre-create the next month's partition.

## 7. Rolling back

Prisma migrations are **forward-only** by default. To revert a change:

1. Write a NEW migration that undoes the structural change.
2. Never manually edit migration files that have already been applied. Treat them as immutable history.
3. If a migration is stuck (e.g. failed mid-way), use `npx prisma migrate resolve --applied <migration_name>` or `--rolled-back <migration_name>` after fixing the underlying issue.

## 8. Partitioned-table caveats for new code

- `prisma.<table>.create()` will fail if the partition for that timestamp does not exist. Ensure `pg_partman` `p_premake => 4` (4 weeks ahead) is sufficient, and that maintenance runs regularly.
- `SELECT count(*) FROM "AqmsAirQualityReading"` is slower than on a non-partitioned table — Postgres must aggregate across all child partitions. Always add a date-range filter to enable partition pruning:
  ```sql
  WHERE "recordedAt" >= '2026-05-01' AND "recordedAt" < '2026-06-01'
  ```
- Prisma `$queryRaw` is preferred for hot-path queries on partitioned tables to ensure explicit partition pruning via date bounds.

## 9. Seed in production

`npx prisma db seed` (which runs `seed.js`) is **dev-only** — it inserts mock observation rows.

In production, run only reference data:
```bash
node scripts/seed-prod.js
```

This script creates only canonical reference data (admin user, station/buoy definitions). Never insert mock sensor readings in production.
