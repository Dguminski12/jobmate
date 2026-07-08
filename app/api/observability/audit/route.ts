import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/observability/server";

const auditPayloadSchema = z.object({
  eventType: z.enum(["user_signed_up"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = auditPayloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid audit payload." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await logAuditEvent({
      userId: user?.id ?? null,
      eventType: parsed.data.eventType,
      metadata: parsed.data.metadata,
      requestHeaders: request.headers,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to write audit log." },
      { status: 500 },
    );
  }
}
