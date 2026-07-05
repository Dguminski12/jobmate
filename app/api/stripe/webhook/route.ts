import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { grantPaidAccess } from "@/lib/billing/admin";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!userId) {
        return NextResponse.json({ error: "Missing user id metadata." }, { status: 400 });
      }

      if (session.payment_status === "paid") {
        await grantPaidAccess({
          userId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
          amountPence: session.amount_total ?? 0,
          currency: session.currency ?? "gbp",
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process Stripe webhook.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}