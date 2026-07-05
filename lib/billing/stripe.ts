import Stripe from "stripe";
import { PAID_ACCESS_DAYS, PAYWALL_CURRENCY, PAYWALL_PRICE_PENCE } from "./types";

export function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY. Add it to your environment before enabling checkout.");
  }

  return new Stripe(stripeSecretKey);
}

export function getStripeWebhookSecret() {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeWebhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET. Add it to your environment before enabling billing webhooks.");
  }

  return stripeWebhookSecret;
}

export function getAppUrl() {
  const explicitAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicitAppUrl) {
    return explicitAppUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function getPaywallPriceData() {
  return {
    currency: PAYWALL_CURRENCY,
    unit_amount: PAYWALL_PRICE_PENCE,
    product_data: {
      name: "JobMate 31-Day Unlimited Access",
      description: `${PAID_ACCESS_DAYS} days of unlimited interview pack generations and regenerations.`,
    },
  } satisfies Stripe.Checkout.SessionCreateParams.LineItem.PriceData;
}