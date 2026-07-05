import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateInterviewPackInput, InterviewPackRecord } from "./types";

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
      ai_response: input.aiResponse,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InterviewPackRecord;
}