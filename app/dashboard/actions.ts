"use server";

import { revalidatePath } from "next/cache";
import { createJobForUser, deleteJobForUser, getAuthedClient, updateJobForUser } from "@/lib/jobs/server";
import { createJobSchema, deleteJobSchema, updateJobSchema } from "@/lib/jobs/validation";
import type { JobActionState, JobDeleteActionState } from "@/lib/jobs/types";
import { createInterviewPackForUser } from "@/lib/interview-packs/server";
import { generateInterviewPack } from "@/lib/interview-packs/service";
import { generateInterviewPackSchema } from "@/lib/interview-packs/validation";
import type { GenerateInterviewPackActionState } from "@/lib/interview-packs/types";
import { extractCvTextFromFile, toImageDataUrls } from "@/lib/interview-packs/parsing";

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

function returnGenerateError(
  message: string,
  fieldErrors?: GenerateInterviewPackActionState["fieldErrors"],
): GenerateInterviewPackActionState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

function normalizeTextInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeScreenshotNames(formData: FormData) {
  return formData
    .getAll("jobScreenshots")
    .map((entry) => (entry instanceof File ? entry.name : ""))
    .filter((name) => name.length > 0);
}

function getScreenshotFiles(formData: FormData) {
  return formData
    .getAll("jobScreenshots")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
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

export async function generateInterviewPackAction(
  _previousState: GenerateInterviewPackActionState,
  formData: FormData,
): Promise<GenerateInterviewPackActionState> {
  const cvMode = normalizeTextInput(formData.get("cvMode"));
  const cvFile = formData.get("cvFile");
  const screenshotFiles = getScreenshotFiles(formData);

  const parsed = generateInterviewPackSchema.safeParse({
    title: normalizeTextInput(formData.get("title")),
    cvMode,
    cvText: normalizeTextInput(formData.get("cvText")),
    cvFileName: cvFile instanceof File && cvFile.size > 0 ? cvFile.name : "",
    jobUrl: normalizeTextInput(formData.get("jobUrl")),
    jobDescription: normalizeTextInput(formData.get("jobDescription")),
    screenshotNames: normalizeScreenshotNames(formData),
    additionalInstructions: normalizeTextInput(formData.get("additionalInstructions")),
  });

  if (!parsed.success) {
    const mappedErrors: NonNullable<GenerateInterviewPackActionState["fieldErrors"]> = {};

    for (const issue of parsed.error.issues) {
      const path = issue.path[0];

      if (path === "title") {
        mappedErrors.title = issue.message;
      }

      if (path === "cvText") {
        mappedErrors.cvText = issue.message;
      }

      if (path === "cvFileName") {
        mappedErrors.cvFile = issue.message;
      }

      if (path === "jobDescription") {
        mappedErrors.jobDetails = issue.message;
      }
    }

    return returnGenerateError("Fix the highlighted fields to continue.", mappedErrors);
  }

  const { user } = await getAuthedClient();

  try {
    let resolvedCvText = parsed.data.cvText ?? "";

    if (parsed.data.cvMode === "file") {
      if (!(cvFile instanceof File) || cvFile.size <= 0) {
        return returnGenerateError("Upload a CV file before generating.", {
          cvFile: "Upload a CV file before generating.",
        });
      }

      resolvedCvText = await extractCvTextFromFile(cvFile);
    }

    const screenshotDataUrls = await toImageDataUrls(screenshotFiles);

    const aiResponse = await generateInterviewPack({
      input: {
        ...parsed.data,
        cvText: resolvedCvText,
      },
      cvText: resolvedCvText,
      screenshotDataUrls,
    });

    const pack = await createInterviewPackForUser(
      {
        title: parsed.data.title,
        cvSource: parsed.data.cvMode,
        cvFileName: parsed.data.cvFileName,
        cvText: resolvedCvText,
        jobUrl: parsed.data.jobUrl,
        jobDescription: parsed.data.jobDescription,
        screenshotNames: parsed.data.screenshotNames,
        additionalInstructions: parsed.data.additionalInstructions,
        aiResponse,
      },
      user.id,
    );

    revalidatePath("/dashboard");

    return {
      status: "success",
      message: "Interview Pack generated and saved.",
      pack,
    };
  } catch (error) {
    return returnGenerateError(error instanceof Error ? error.message : "Unable to generate interview pack.");
  }
}