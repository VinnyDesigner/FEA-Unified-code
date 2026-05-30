# Database SQL

PostgreSQL DDL for the platform's three databases. **The running application uses three
databases**: a central identity/access database plus one domain database per product.
Identity (who can log in) and access (RBAC grants) are centralized; each product DB holds
only its domain data plus FK-less operational tables (`otps`, `reports`, `audit_logs`).

| File | Target DB (live: `*_dev`) | Contents |
|------|---------------------------|----------|
| [`01_higher_level.sql`](01_higher_level.sql) | `fea_higher_level` | **identity & access**: `users`, `refresh_tokens` + RBAC (`applications`, `roles`, `permissions`, `role_permissions`, `user_application_access`) + baseline RBAC seed |
| [`02_mwq.sql`](02_mwq.sql)  | `fea_mwq`  | MWQ domain tables + operational (`otps`, `reports`, `audit_logs`, FK-less `UserID`) |
| [`03_aqms.sql`](03_aqms.sql) | `fea_aqms` | AQMS domain tables + operational (`otps`, `reports`, `audit_logs`, `aqms_notification_logs`, FK-less `UserID`) |

> `fea_higher_level` is the single source of truth for identity & access; a user is **one**
> row there with per-application grants in `user_application_access` (no per-DB user
> duplication, no ADMIN fan-out). The module `otps`/`reports`/`audit_logs` reference a user by
> a plain integer `"UserID"` with **no cross-database foreign key** — integrity is enforced in
> application code (PostgreSQL cannot enforce FKs across databases).

## Authoritative schema = Prisma

The live schema is owned by **Prisma migrations** under
`server/prisma/{higher-level,mwq,aqms}/schema/`, applied with `npm run prisma:migrate:deploy`.
These `.sql` files are a standalone, human-readable equivalent — **generated from the Prisma
models** (`prisma migrate diff --from-empty`) and kept as a reference. They are **not** the
migration source of truth: do not load them into the databases Prisma manages (Prisma creates
each schema from empty and tracks it in `_prisma_migrations`).

## Running (fresh databases only)

```bash
createdb fea_higher_level && psql -d fea_higher_level -f 01_higher_level.sql
createdb fea_mwq          && psql -d fea_mwq          -f 02_mwq.sql
createdb fea_aqms         && psql -d fea_aqms          -f 03_aqms.sql
```

Each file is wrapped in a transaction and is written for a **fresh** database (plain
`CREATE TABLE`/`CREATE TYPE`, matching the Prisma-generated DDL). `01_higher_level.sql` also
seeds the baseline `applications`/`roles`/`permissions`/`role_permissions` (idempotent via
`ON CONFLICT`); users and `user_application_access` grants come from signup or the identity
ETL (`server/prisma/migrate-to-higher-level.js`), not from this seed.

## Relationship to Prisma

These files keep the exact column names Prisma maps to (`"UserID"`, `"Password"`,
`"CreatedAt"`, …) and do **not** include the `_prisma_migrations` bookkeeping table. Use them
to stand up a database directly with `psql`, or use `prisma migrate deploy` (the normal path).
