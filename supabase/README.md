# Supabase Setup

1. Create a Supabase project.
2. Put your project URL and anon key in [`.env.local`](../.env.local).
3. Run the SQL in [schema.sql](schema.sql) in the Supabase SQL editor.
4. Run the job migration in [migrations/20260704_create_jobs.sql](migrations/20260704_create_jobs.sql).
5. Make sure email auth is enabled in the Supabase dashboard.

What this schema does:

- Creates a `profiles` table linked to `auth.users`.
- Creates a `jobs` table for authenticated users with row-level security.
- Auto-creates a profile row when a user signs up.
- Restricts profile access so users can only read and update their own row.
- Keeps `updated_at` current whenever a profile changes.
- Keeps `updated_at` current whenever a job changes.