import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/server";

const errorPayloadSchema = z.object({
  source: z.enum(["frontend", "api", "admin", "auth"]),
  message: z.string().trim().min(1).max(4000),
  stack: z.string().trim().max(20000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = errorPayloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid error payload." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await logError({
      userId: user?.id ?? null,
      source: parsed.data.source,
      message: parsed.data.message,
      stack: parsed.data.stack,
      metadata: parsed.data.metadata,
      requestHeaders: request.headers,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to write error log." },
      { status: 500 },
    );
  }
}
