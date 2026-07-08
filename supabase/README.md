# Supabase Setup

1. Create a Supabase project.
2. Put your project URL and anon key in [`.env.local`](../.env.local).
3. Run the SQL in [schema.sql](schema.sql) in the Supabase SQL editor.
4. Run the job migration in [migrations/202607040001_create_jobs.sql](migrations/202607040001_create_jobs.sql).
5. Run the interview packs migration in [migrations/202607050001_create_interview_packs.sql](migrations/202607050001_create_interview_packs.sql).
6. Make sure email auth is enabled in the Supabase dashboard.

## Migrating to Supabase CLI cleanly

This repo originally used manual SQL pushes, so the database schema may already contain older migrations even if the
Supabase migration history table does not. The migration filenames have been normalized to unique CLI-safe versions:

- `202607040001_create_jobs.sql`
- `202607050001_create_interview_packs.sql`
- `202607050002_create_user_entitlements.sql`
- `202607050003_drop_entitlement_rpcs.sql`
- `202607050004_fix_user_entitlements_insert_policy.sql`
- `202607060001_atomic_billing_grant.sql`
- `202607080001_add_interview_pack_regeneration_context.sql`
- `202607080002_add_generation_abuse_protection.sql`
- `202607080003_add_generation_daily_caps_and_audit.sql`
- `202607080004_add_admin_release_hardening.sql`

If you have already applied everything manually up to `202607080003_add_generation_daily_caps_and_audit.sql`, repair the
remote migration history first, then let the CLI push only the latest pending migration.

1. Link the project if needed:

```bash
supabase link --project-ref dilrqxllpuxxjoixfalh
```

2. Mark the already-applied migrations as applied in the remote migration history:

```bash
supabase migration repair --status applied 202607040001
supabase migration repair --status applied 202607050001
supabase migration repair --status applied 202607050002
supabase migration repair --status applied 202607050003
supabase migration repair --status applied 202607050004
supabase migration repair --status applied 202607060001
supabase migration repair --status applied 202607080001
supabase migration repair --status applied 202607080002
supabase migration repair --status applied 202607080003
```

3. Confirm the latest migration is still pending locally:

```bash
supabase migration list
```

4. Push the remaining migration:

```bash
supabase db push
```

If you have also already applied `202607080004_add_admin_release_hardening.sql` manually, repair that version as
`applied` too instead of pushing it again.

Recommended safety steps before the first CLI push:

- Take a database backup or snapshot first.
- Run the repair commands only for migrations you know are already present in the live database.
- Keep the newest unapplied migration as the only version left for `supabase db push`.

What this schema does:

- Creates a `profiles` table linked to `auth.users`.
- Creates a `jobs` table for authenticated users with row-level security.
- Auto-creates a profile row when a user signs up.
- Restricts profile access so users can only read and update their own row.
- Creates an `interview_packs` table for generated AI interview outputs with row-level security.
- Keeps `updated_at` current whenever a profile changes.
- Keeps `updated_at` current whenever a job changes.
