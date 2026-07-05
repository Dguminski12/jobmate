"use server";

import { revalidatePath } from "next/cache";
import { createJobForUser, deleteJobForUser, getAuthedClient, updateJobForUser } from "@/lib/jobs/server";
import { createJobSchema, deleteJobSchema, updateJobSchema } from "@/lib/jobs/validation";
import type { JobActionState, JobDeleteActionState } from "@/lib/jobs/types";

function collectFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function mapFieldErrors(error: { issues: Array<{ path: Array<string | number>; message: string }> }) {
  const fieldErrors: NonNullable<JobActionState["fieldErrors"]> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string") {
      fieldErrors[field as keyof NonNullable<JobActionState["fieldErrors"]>] = issue.message;
    }
  }

  return fieldErrors;
}

function returnFormError(message: string, fieldErrors?: JobActionState["fieldErrors"]): JobActionState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

export async function createJobAction(
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const parsed = createJobSchema.safeParse(collectFormData(formData));

  if (!parsed.success) {
    return returnFormError("Fix the highlighted fields.", mapFieldErrors(parsed.error));
  }

  const { user } = await getAuthedClient();

  try {
    await createJobForUser(parsed.data, user.id);
    revalidatePath("/dashboard");
    return { status: "success", message: "Job created successfully." };
  } catch (error) {
    return returnFormError(error instanceof Error ? error.message : "Unable to create the job.");
  }
}

export async function updateJobAction(
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const parsed = updateJobSchema.safeParse(collectFormData(formData));

  if (!parsed.success) {
    return returnFormError("Fix the highlighted fields.", mapFieldErrors(parsed.error));
  }

  const { user } = await getAuthedClient();

  try {
    await updateJobForUser(parsed.data, user.id);
    revalidatePath("/dashboard");
    return { status: "success", message: "Job updated successfully." };
  } catch (error) {
    return returnFormError(error instanceof Error ? error.message : "Unable to update the job.");
  }
}

export async function deleteJobAction(
  _previousState: JobDeleteActionState,
  formData: FormData,
): Promise<JobDeleteActionState> {
  const parsed = deleteJobSchema.safeParse(collectFormData(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Missing job details.",
    };
  }

  const { user } = await getAuthedClient();

  try {
    await deleteJobForUser(parsed.data, user.id);
    revalidatePath("/dashboard");
    return { status: "success", message: "Job deleted successfully." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to delete the job.",
    };
  }
}