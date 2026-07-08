import { describe, expect, it } from "vitest";
import { FREE_GENERATION_LIMIT } from "@/lib/billing/types";
import {
  getGenerationReservationBlockedMessage,
  getPaywallBlockedMessage,
  hasGenerationAccess,
  toBillingAccessSummary,
} from "@/lib/billing/logic";

describe("billing logic", () => {
  it("computes remaining free generations from the configured limit", () => {
    const summary = toBillingAccessSummary({
      free_generations_used: 12,
      paid_access_until: null,
    });

    expect(summary.freeGenerationsRemaining).toBe(FREE_GENERATION_LIMIT - 12);
    expect(summary.freeGenerationsUsed).toBe(12);
    expect(summary.hasActiveAccess).toBe(false);
  });

  it("reports active access when paid access is in the future", () => {
    const futureDate = new Date(Date.now() + 60_000).toISOString();
    const summary = toBillingAccessSummary({
      free_generations_used: FREE_GENERATION_LIMIT,
      paid_access_until: futureDate,
    });

    expect(summary.hasActiveAccess).toBe(true);
    expect(hasGenerationAccess(summary)).toBe(true);
  });

  it("blocks generation when no free generations remain and paid access is inactive", () => {
    const pastDate = new Date(Date.now() - 60_000).toISOString();
    const summary = toBillingAccessSummary({
      free_generations_used: FREE_GENERATION_LIMIT,
      paid_access_until: pastDate,
    });

    expect(summary.hasActiveAccess).toBe(false);
    expect(summary.freeGenerationsRemaining).toBe(0);
    expect(hasGenerationAccess(summary)).toBe(false);
  });

  it("builds paywall message from the shared free-limit constant", () => {
    const message = getPaywallBlockedMessage();

    expect(message).toContain(String(FREE_GENERATION_LIMIT));
    expect(message).toContain("31 days");
  });

  it("builds a cooldown message with retry timing", () => {
    expect(getGenerationReservationBlockedMessage("cooldown_active", 9)).toContain("9 seconds");
  });

  it("builds an in-progress message with retry timing", () => {
    expect(getGenerationReservationBlockedMessage("generation_in_progress", 45)).toContain("45 seconds");
  });

  it("builds a daily limit message with retry timing", () => {
    expect(getGenerationReservationBlockedMessage("daily_limit_reached", 60)).toContain("1 minute");
  });
});
