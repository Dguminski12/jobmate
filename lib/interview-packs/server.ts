import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateInterviewPackInput, InterviewPackContent, InterviewPackRecord } from "./types";

export async function getInterviewPacksForUser(userId: string): Promise<InterviewPackRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_packs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as InterviewPackRecord[];
}

export async function getInterviewPackForUserById(packId: string, userId: string): Promise<InterviewPackRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("interview_packs")
    .select("*")
    .eq("id", packId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as InterviewPackRecord | null) ?? null;
}

export async function createInterviewPackForUser(input: CreateInterviewPackInput, userId: string): Promise<InterviewPackRecord> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("interview_packs")
    .insert({
      user_id: userId,
      title: input.title,
      status: "ready",
      cv_source: input.cvSource,
      cv_file_name: input.cvFileName ?? null,
      cv_text: input.cvText ?? null,
      job_url: input.jobUrl ?? null,
      job_description: input.jobDescription ?? null,
      screenshot_names: input.screenshotNames,
      additional_instructions: input.additionalInstructions ?? null,
      generation_context: input.generationContext,
      regeneration_history: input.regenerationHistory,
      ai_response: input.aiResponse,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InterviewPackRecord;
}

export async function updateInterviewPackForUser(
  packId: string,
  userId: string,
  input: {
    additionalInstructions?: string;
    generationContext?: InterviewPackRecord["generation_context"];
    regenerationHistory?: InterviewPackRecord["regeneration_history"];
    aiResponse: InterviewPackContent;
  },
): Promise<InterviewPackRecord> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("interview_packs")
    .update({
      additional_instructions: input.additionalInstructions ?? null,
      generation_context: input.generationContext ?? undefined,
      regeneration_history: input.regenerationHistory ?? undefined,
      ai_response: input.aiResponse,
      status: "ready",
    })
    .eq("id", packId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InterviewPackRecord;
}

export async function deleteInterviewPackForUser(packId: string, userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("interview_packs").delete().eq("id", packId).eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
