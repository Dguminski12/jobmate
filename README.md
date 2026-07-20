# JobMate

JobMate is a full-stack job-search workspace that combines application tracking with AI-generated interview preparation. It is the most production-oriented project in this portfolio, covering authentication, relational data, document parsing, payments, administration, observability, and automated tests.

## Product features

- Authenticated job application tracker with create, edit, and delete workflows
- AI interview packs generated from a job description, CV, PDF/DOCX, or screenshot context
- Saved pack history and usage tracking
- Stripe Checkout paywall with webhook-driven entitlements
- Protected admin dashboard for users, usage, costs, and billing data
- Privacy, terms, cookie notice, theme switching, and PWA registration

## Engineering highlights

- Server-rendered Next.js application with TypeScript
- Supabase authentication, Postgres data, and row-level security
- Server-side validation with Zod
- OpenAI integration isolated behind a service layer
- PDF and DOCX parsing with explicit upload validation
- Stripe webhook signature verification and service-role writes
- Audit/error observability routes and admin reporting
- Vitest coverage for billing, jobs, interview packs, and observability logic

## Tech stack

Next.js, React, TypeScript, Supabase, PostgreSQL, OpenAI API, Stripe, Zod, Tailwind CSS, and Vitest.

## Run locally

```bash
git clone https://github.com/Dguminski12/jobmate.git
cd jobmate
npm install
```

Create `.env.local` with your own credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Apply the migrations in `supabase/migrations`, configure the matching Supabase redirect URLs, then run:

```bash
npm run dev
```

## Quality checks

```bash
npm run lint
npm test
npm run build
```

Never commit live credentials. The service-role and Stripe keys are server-only.

