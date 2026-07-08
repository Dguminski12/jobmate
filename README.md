This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Add these values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
# Optional, defaults to gpt-4.1-mini
OPENAI_MODEL=gpt-4.1-mini
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
# Optional in local dev, defaults to http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`OPENAI_API_KEY` is required for Interview Pack generation.

## Deployment Variables

For production, do not commit secrets into the repository. Add the same variables in your hosting provider's environment settings instead:

- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: required for Stripe webhook writes into Supabase
- `OPENAI_API_KEY`: optional, enables live Interview Pack generation
- `OPENAI_MODEL`: optional, defaults to `gpt-4.1-mini`
- `STRIPE_SECRET_KEY`: required for checkout session creation
- `STRIPE_WEBHOOK_SECRET`: required for verifying Stripe webhook callbacks
- `NEXT_PUBLIC_APP_URL`: recommended for absolute checkout return URLs

On Vercel, set them in your project settings under Environment Variables, then redeploy.

If you're using Supabase auth, also add your deployed site URL to the allowed redirect and site URL settings in the Supabase dashboard.

## Paywall Setup

- Run the billing migration in [supabase/migrations/20260705_create_user_entitlements.sql](supabase/migrations/20260705_create_user_entitlements.sql).
- The paywall currently allows 999 free generations per user for testing, and regenerations count toward the same limit.
- After the free limit is reached, users can buy 31 days of unlimited access for GBP 9.99 through Stripe Checkout.
- Configure a Stripe webhook endpoint pointing to `/api/stripe/webhook`.
- In local development, run Stripe CLI forwarding so webhook events reach your app:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

- Copy the signing secret from Stripe CLI or the Stripe dashboard into `STRIPE_WEBHOOK_SECRET`.

## Interview Pack Generation

- CV file parsing is implemented for PDF and DOCX uploads.
- Screenshot uploads are passed to the AI request for OCR-style context extraction.
- Generation is isolated behind one service so model/provider swaps are straightforward.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Quick checklist

1. Push your code to GitHub.
2. Import the repo into Vercel.
3. Set the environment variables listed above in Vercel.
4. Add your production domain to Supabase auth settings.
5. Redeploy and share the URL with testers.
