"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getGenerationReservationBlockedMessage } from "@/lib/billing/logic";
import {
  getBillingAccessSummary,
  releaseGenerationReservation,
  reserveGenerationAccess,
} from "@/lib/billing/server";
import { getAppUrl, getPaywallPriceData, getStripeClient } from "@/lib/billing/stripe";
import type { BillingCheckoutActionState } from "@/lib/billing/types";
import { createJobForUser, deleteJobForUser, getAuthedClient, updateJobForUser } from "@/lib/jobs/server";
import { createJobSchema, deleteJobSchema, updateJobSchema } from "@/lib/jobs/validation";
import type { JobActionState, JobDeleteActionState } from "@/lib/jobs/types";
import { logAuditEvent, logError } from "@/lib/observability/server";
import {
  createInterviewPackForUser,
  deleteInterviewPackForUser,
  getInterviewPackForUserById,
  updateInterviewPackForUser,
} from "@/lib/interview-packs/server";
import {
  appendRegenerationInstruction,
  createInterviewPackGenerationContext,
  deriveInterviewPackGenerationContext,
} from "@/lib/interview-packs/context";
import { generateInterviewPack, regenerateInterviewPack } from "@/lib/interview-packs/service";
import {
  deleteInterviewPackSchema,
  generateInterviewPackSchema,
  regenerateInterviewPackSchema,
} from "@/lib/interview-packs/validation";
import type {
  AddPackToTrackerActionState,
  DeleteInterviewPackActionState,
  GenerateInterviewPackActionState,
  InterviewPackGenerationResult,
  RegenerateInterviewPackActionState,
} from "@/lib/interview-packs/types";
import { extractCvTextFromFile, toImageDataUrls, validateJobScreenshotFiles } from "@/lib/interview-packs/parsing";

function collectFormData(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function mapFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
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

function returnBillingCheckoutError(message: string): BillingCheckoutActionState {
  return {
    status: "error",
    message,
  };
}

async function consumeGenerationCreditAfterSuccess(userId: string, usage?: InterviewPackGenerationResult["usage"]) {
  try {
    await releaseGenerationReservation(userId, false, true, undefined, usage);
  } catch (error) {
    console.error("[billing] Failed to release generation reservation after successful pack save", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function refundGenerationCreditAfterFailure(userId: string, errorMessage?: string) {
  try {
    await releaseGenerationReservation(userId, true, false, errorMessage);
  } catch (error) {
    console.error("[billing] Failed to refund generation reservation after pack failure", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function resolveRequestAppUrl() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (host) {
    const protocol = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return getAppUrl();
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

function isUploadRelatedMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("upload") ||
    normalized.includes("screenshot") ||
    normalized.includes("pdf") ||
    normalized.includes("docx") ||
    normalized.includes("cv file")
  );
}

export async function createJobAction(
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const parsed = createJobSchema.safeParse(collectFormData(formData));

  if (!parsed.success) {
    await logError({
      source: "validation",
      message: "Create job validation failed.",
      metadata: {
        action: "create_job",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return returnFormError("Fix the highlighted fields.", mapFieldErrors(parsed.error));
  }

  const { user } = await getAuthedClient();

  try {
    await createJobForUser(parsed.data, user.id);
    revalidatePath("/dashboard/tracker");
    return { status: "success", message: "Job created successfully." };
  } catch (error) {
    await logError({
      userId: user.id,
      source: "api",
      message: error instanceof Error ? error.message : "Unable to create the job.",
      stack: error instanceof Error ? error.stack : null,
      metadata: {
        action: "create_job",
      },
    });
    return returnFormError(error instanceof Error ? error.message : "Unable to create the job.");
  }
}

export async function updateJobAction(
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const parsed = updateJobSchema.safeParse(collectFormData(formData));

  if (!parsed.success) {
    await logError({
      source: "validation",
      message: "Update job validation failed.",
      metadata: {
        action: "update_job",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return returnFormError("Fix the highlighted fields.", mapFieldErrors(parsed.error));
  }

  const { user } = await getAuthedClient();

  try {
    await updateJobForUser(parsed.data, user.id);
    revalidatePath("/dashboard/tracker");
    return { status: "success", message: "Job updated successfully." };
  } catch (error) {
    await logError({
      userId: user.id,
      source: "api",
      message: error instanceof Error ? error.message : "Unable to update the job.",
      stack: error instanceof Error ? error.stack : null,
      metadata: {
        action: "update_job",
      },
    });
    return returnFormError(error instanceof Error ? error.message : "Unable to update the job.");
  }
}

export async function deleteJobAction(
  _previousState: JobDeleteActionState,
  formData: FormData,
): Promise<JobDeleteActionState> {
  const parsed = deleteJobSchema.safeParse(collectFormData(formData));

  if (!parsed.success) {
    await logError({
      source: "validation",
      message: "Delete job validation failed.",
      metadata: {
        action: "delete_job",
      },
    });
    return {
      status: "error",
      message: "Missing job details.",
    };
  }

  const { user } = await getAuthedClient();

  try {
    await deleteJobForUser(parsed.data, user.id);
    revalidatePath("/dashboard/tracker");
    return { status: "success", message: "Job deleted successfully." };
  } catch (error) {
    await logError({
      userId: user.id,
      source: "api",
      message: error instanceof Error ? error.message : "Unable to delete the job.",
      stack: error instanceof Error ? error.stack : null,
      metadata: {
        action: "delete_job",
      },
    });
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
    savedCvText: normalizeTextInput(formData.get("savedCvText")),
    savedCvFileName: normalizeTextInput(formData.get("savedCvFileName")),
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

    await logError({
      source: "validation",
      message: "Interview pack generation validation failed.",
      metadata: {
        action: "generate_interview_pack",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });

    return returnGenerateError("Fix the highlighted fields to continue.", mappedErrors);
  }

  const { user } = await getAuthedClient();
  let hasActiveReservation = false;
  let validatedScreenshotFiles: File[] = [];

  try {
    let resolvedCvText = parsed.data.cvText ?? "";
    let resolvedCvFileName = parsed.data.cvFileName ?? parsed.data.savedCvFileName ?? "";

    if (parsed.data.cvMode === "file") {
      if (cvFile instanceof File && cvFile.size > 0) {
        resolvedCvText = await extractCvTextFromFile(cvFile);
        resolvedCvFileName = cvFile.name;
      } else if (parsed.data.savedCvText) {
        resolvedCvText = parsed.data.savedCvText;
      } else {
        return returnGenerateError("Upload a CV file before generating.", {
          cvFile: "Upload a CV file before generating.",
        });
      }
    }

    validatedScreenshotFiles = validateJobScreenshotFiles(screenshotFiles);
    const generationReservation = await reserveGenerationAccess(user.id, "generate");

    if (!generationReservation.allowed) {
      if (generationReservation.reason === "daily_limit_reached") {
        await logAuditEvent({
          userId: user.id,
          eventType: "daily_cap_reached",
          metadata: {
            action: "generate",
            retryAfterSeconds: generationReservation.retryAfterSeconds,
          },
          requestHeaders: await headers(),
        });
      }

      return returnGenerateError(
        getGenerationReservationBlockedMessage(
          generationReservation.reason,
          generationReservation.retryAfterSeconds,
        ),
      );
    }

    hasActiveReservation = true;
    await logAuditEvent({
      userId: user.id,
      eventType: "ai_generation_started",
      metadata: {
        title: parsed.data.title,
        screenshotCount: validatedScreenshotFiles.length,
        hasJobDescription: Boolean(parsed.data.jobDescription),
      },
      requestHeaders: await headers(),
    });

    const screenshotDataUrls = await toImageDataUrls(validatedScreenshotFiles);

    const aiResult = await generateInterviewPack({
      input: {
        ...parsed.data,
        cvText: resolvedCvText,
      },
      cvText: resolvedCvText,
      screenshotDataUrls,
    });

    const createPackInput = {
      title: parsed.data.title,
      cvSource: parsed.data.cvMode,
      cvFileName: resolvedCvFileName,
      cvText: resolvedCvText,
      jobUrl: parsed.data.jobUrl,
      jobDescription: parsed.data.jobDescription,
      screenshotNames: parsed.data.screenshotNames,
      additionalInstructions: parsed.data.additionalInstructions,
      regenerationHistory: [],
      aiResponse: aiResult.content,
    };

    const pack = await createInterviewPackForUser(
      {
        ...createPackInput,
        generationContext: createInterviewPackGenerationContext(createPackInput),
      },
      user.id,
    );

    await consumeGenerationCreditAfterSuccess(user.id, aiResult.usage);
    await logAuditEvent({
      userId: user.id,
      eventType: "ai_generation_completed",
      metadata: {
        packId: pack.id,
        title: pack.title,
        modelName: aiResult.usage.modelName,
        promptTokens: aiResult.usage.promptTokens,
        completionTokens: aiResult.usage.completionTokens,
        totalTokens: aiResult.usage.totalTokens,
        estimatedCostGbp: aiResult.usage.estimatedCostGbp,
      },
      requestHeaders: await headers(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/packs");

    return {
      status: "success",
      message: "Interview Pack generated and saved.",
      pack,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate interview pack.";

    if (isUploadRelatedMessage(message)) {
      await logAuditEvent({
        userId: user.id,
        eventType: "upload_failed",
        metadata: {
          action: "generate",
          message,
        },
        requestHeaders: await headers(),
      });
      await logError({
        userId: user.id,
        source: "upload",
        message,
        stack: error instanceof Error ? error.stack : null,
        metadata: {
          action: "generate_interview_pack",
        },
        requestHeaders: await headers(),
      });
    } else {
      await logAuditEvent({
        userId: user.id,
        eventType: "ai_generation_failed",
        metadata: {
          title: parsed.data.title,
          message,
        },
        requestHeaders: await headers(),
      });
      await logError({
        userId: user.id,
        source: "ai_generation",
        message,
        stack: error instanceof Error ? error.stack : null,
        metadata: {
          action: "generate_interview_pack",
          title: parsed.data.title,
        },
        requestHeaders: await headers(),
      });
    }

    if (hasActiveReservation) {
      await refundGenerationCreditAfterFailure(user.id, message);
      hasActiveReservation = false;
    }

    return returnGenerateError(message);
  }
}

function returnAddPackError(message: string): AddPackToTrackerActionState {
  return {
    status: "error",
    message,
  };
}

function returnDeletePackError(message: string): DeleteInterviewPackActionState {
  return {
    status: "error",
    message,
  };
}

function returnRegeneratePackError(
  message: string,
  fieldErrors?: RegenerateInterviewPackActionState["fieldErrors"],
): RegenerateInterviewPackActionState {
  return {
    status: "error",
    message,
    fieldErrors,
  };
}

export async function deleteInterviewPackAction(
  _previousState: DeleteInterviewPackActionState,
  formData: FormData,
): Promise<DeleteInterviewPackActionState> {
  const parsed = deleteInterviewPackSchema.safeParse({
    packId: normalizeTextInput(formData.get("packId")),
  });

  if (!parsed.success) {
    return returnDeletePackError("Missing interview pack details.");
  }

  const { user } = await getAuthedClient();

  try {
    await deleteInterviewPackForUser(parsed.data.packId, user.id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/packs");

    return {
      status: "success",
      message: "Interview Pack deleted.",
      deletedPackId: parsed.data.packId,
    };
  } catch (error) {
    return returnDeletePackError(error instanceof Error ? error.message : "Unable to delete this interview pack.");
  }
}

export async function regenerateInterviewPackAction(
  _previousState: RegenerateInterviewPackActionState,
  formData: FormData,
): Promise<RegenerateInterviewPackActionState> {
  const parsed = regenerateInterviewPackSchema.safeParse({
    packId: normalizeTextInput(formData.get("packId")),
    additionalPrompt: normalizeTextInput(formData.get("additionalPrompt")),
  });

  if (!parsed.success) {
    const additionalPromptError = parsed.error.issues.find((issue) => issue.path[0] === "additionalPrompt")?.message;
    await logError({
      source: "validation",
      message: "Interview pack regeneration validation failed.",
      metadata: {
        action: "regenerate_interview_pack",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return returnRegeneratePackError("Add guidance before regenerating this pack.", {
      additionalPrompt: additionalPromptError,
    });
  }

  const { user } = await getAuthedClient();
  let hasActiveReservation = false;

  try {
    const existingPack = await getInterviewPackForUserById(parsed.data.packId, user.id);

    if (!existingPack) {
      return returnRegeneratePackError("Interview pack not found.");
    }

    const resolvedCvText = existingPack.cv_text?.trim() ?? "";

    if (!resolvedCvText) {
      return returnRegeneratePackError("This pack has no saved CV text. Create a new pack from your CV first.");
    }

    const generationReservation = await reserveGenerationAccess(user.id, "regenerate");

    if (!generationReservation.allowed) {
      if (generationReservation.reason === "daily_limit_reached") {
        await logAuditEvent({
          userId: user.id,
          eventType: "daily_cap_reached",
          metadata: {
            action: "regenerate",
            retryAfterSeconds: generationReservation.retryAfterSeconds,
          },
          requestHeaders: await headers(),
        });
      }

      return returnRegeneratePackError(
        getGenerationReservationBlockedMessage(
          generationReservation.reason,
          generationReservation.retryAfterSeconds,
        ),
      );
    }

    hasActiveReservation = true;
    await logAuditEvent({
      userId: user.id,
      eventType: "regeneration_started",
      metadata: {
        packId: existingPack.id,
        title: existingPack.title,
      },
      requestHeaders: await headers(),
    });

    const generationContext = deriveInterviewPackGenerationContext(existingPack);
    const regenerationHistory = appendRegenerationInstruction(
      existingPack.regeneration_history,
      parsed.data.additionalPrompt,
    );

    const aiResult = await regenerateInterviewPack({
      context: generationContext,
      previousOutput: existingPack.ai_response,
      regenerationHistory,
      latestInstruction: parsed.data.additionalPrompt,
    });

    const updatedPack = await updateInterviewPackForUser(existingPack.id, user.id, {
      additionalInstructions: parsed.data.additionalPrompt,
      generationContext,
      regenerationHistory,
      aiResponse: aiResult.content,
    });

    await consumeGenerationCreditAfterSuccess(user.id, aiResult.usage);
    await logAuditEvent({
      userId: user.id,
      eventType: "regeneration_completed",
      metadata: {
        packId: updatedPack.id,
        title: updatedPack.title,
        modelName: aiResult.usage.modelName,
        promptTokens: aiResult.usage.promptTokens,
        completionTokens: aiResult.usage.completionTokens,
        totalTokens: aiResult.usage.totalTokens,
        estimatedCostGbp: aiResult.usage.estimatedCostGbp,
      },
      requestHeaders: await headers(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/packs");

    return {
      status: "success",
      message: "Interview Pack regenerated with your new prompt.",
      pack: updatedPack,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to regenerate this interview pack.";
    await logError({
      userId: user.id,
      source: "regeneration",
      message,
      stack: error instanceof Error ? error.stack : null,
      metadata: {
        action: "regenerate_interview_pack",
        packId: parsed.data.packId,
      },
      requestHeaders: await headers(),
    });

    if (hasActiveReservation) {
      await logAuditEvent({
        userId: user.id,
        eventType: "ai_generation_failed",
        metadata: {
          action: "regenerate",
          packId: parsed.data.packId,
          message,
        },
        requestHeaders: await headers(),
      });
      await refundGenerationCreditAfterFailure(user.id, message);
      hasActiveReservation = false;
    }

    return returnRegeneratePackError(message);
  }
}

export async function createBillingCheckoutAction(
  _previousState: BillingCheckoutActionState,
): Promise<BillingCheckoutActionState> {
  void _previousState;
  const { user } = await getAuthedClient();

  try {
    const billingAccess = await getBillingAccessSummary(user.id);

    if (billingAccess.hasActiveAccess) {
      return returnBillingCheckoutError("Unlimited access is already active on your account.");
    }

    const stripe = getStripeClient();
    const appUrl = await resolveRequestAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/dashboard/packs?billing=success`,
      cancel_url: `${appUrl}/dashboard/packs?billing=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: getPaywallPriceData(),
        },
      ],
      metadata: {
        userId: user.id,
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
        },
      },
      allow_promotion_codes: false,
    });

    if (!session.url) {
      return returnBillingCheckoutError("Stripe checkout did not return a payment URL.");
    }

    redirect(session.url);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    await logError({
      userId: user.id,
      source: "api",
      message: error instanceof Error ? error.message : "Unable to start checkout.",
      stack: error instanceof Error ? error.stack : null,
      metadata: {
        action: "create_billing_checkout",
      },
      requestHeaders: await headers(),
    });

    return returnBillingCheckoutError(error instanceof Error ? error.message : "Unable to start checkout.");
  }
}

function buildCompanyNameFromUrl(url?: string | null) {
  if (!url) {
    return "Unknown Company";
  }

  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const firstSegment = hostname.split(".")[0] ?? "Unknown Company";
    return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
  } catch {
    return "Unknown Company";
  }
}

function buildJobTitleFromPack(packTitle: string) {
  const [jobTitle] = packTitle.split(/\s(?:\||-|\u2013)\s/, 1);
  return jobTitle?.trim() || packTitle.trim();
}

function normalizeOptionalUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  try {
    new URL(url);
    return url;
  } catch {
    return "";
  }
}

export async function addInterviewPackToTrackerAction(
  _previousState: AddPackToTrackerActionState,
  formData: FormData,
): Promise<AddPackToTrackerActionState> {
  const packId = normalizeTextInput(formData.get("packId"));

  if (!packId) {
    return returnAddPackError("Missing interview pack id.");
  }

  const { user } = await getAuthedClient();

  try {
    const pack = await getInterviewPackForUserById(packId, user.id);

    if (!pack) {
      return returnAddPackError("Interview pack not found.");
    }

    const content = pack.ai_response;
    const notesParts = [
      `Generated from Interview Pack: ${pack.title}`,
      content?.roleSummary ? `Role summary: ${content.roleSummary}` : "",
      content?.companyResearch ? `Company research: ${content.companyResearch}` : "",
    ].filter((value) => value.length > 0);

    const followUp = content?.interviewChecklist?.[0] ?? "Review interview pack and tailor prep plan.";

    await createJobForUser(
      {
        company: buildCompanyNameFromUrl(pack.job_url),
        jobTitle: buildJobTitleFromPack(pack.title),
        location: "Not specified",
        salary: "",
        employmentType: "Full-time",
        applicationDate: new Date().toISOString().slice(0, 10),
        status: "Wishlist",
        jobUrl: normalizeOptionalUrl(pack.job_url),
        notes: notesParts.join("\n\n"),
        nextAction: followUp,
      },
      user.id,
    );

    revalidatePath("/dashboard/tracker");

    return {
      status: "success",
      message: "Interview Pack added to your Job Tracker.",
    };
  } catch (error) {
    return returnAddPackError(error instanceof Error ? error.message : "Unable to add this pack to tracker.");
  }
}
