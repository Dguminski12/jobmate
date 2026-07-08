import type {
  InterviewPackGenerationContext,
  InterviewPackRecord,
  InterviewPackRegenerationInstruction,
  InterviewPackUploadedFile,
} from "./types";

type InitialInterviewPackContextInput = {
  title: string;
  cvSource: InterviewPackGenerationContext["resume"]["source"];
  cvFileName?: string;
  cvText?: string;
  jobUrl?: string;
  jobDescription?: string;
  screenshotNames: string[];
  additionalInstructions?: string;
  aiResponse: InterviewPackGenerationContext["generatedOutput"];
};

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildUploadedFiles(input: {
  cvSource: InitialInterviewPackContextInput["cvSource"];
  cvFileName?: string;
  screenshotNames: string[];
}): InterviewPackUploadedFile[] {
  const files: InterviewPackUploadedFile[] = [];

  if (input.cvSource === "file" && input.cvFileName) {
    files.push({
      kind: "cv",
      name: input.cvFileName,
    });
  }

  files.push(
    ...input.screenshotNames.map((name) => ({
      kind: "job_screenshot" as const,
      name,
    })),
  );

  return files;
}

export function createInterviewPackGenerationContext(
  input: InitialInterviewPackContextInput,
): InterviewPackGenerationContext {
  return {
    title: input.title,
    jobDescription: normalizeOptionalText(input.jobDescription),
    jobUrl: normalizeOptionalText(input.jobUrl),
    userProfile: normalizeOptionalText(input.cvText),
    resume: {
      source: input.cvSource,
      fileName: normalizeOptionalText(input.cvFileName),
      text: normalizeOptionalText(input.cvText),
    },
    selectedTone: null,
    outputType: "interview_pack",
    uploadedFiles: buildUploadedFiles(input),
    initialPrompt: normalizeOptionalText(input.additionalInstructions),
    generatedOutput: input.aiResponse,
  };
}

export function deriveInterviewPackGenerationContext(
  pack: Pick<
    InterviewPackRecord,
    | "title"
    | "cv_source"
    | "cv_file_name"
    | "cv_text"
    | "job_url"
    | "job_description"
    | "screenshot_names"
    | "additional_instructions"
    | "ai_response"
    | "generation_context"
  >,
): InterviewPackGenerationContext {
  if (pack.generation_context) {
    return pack.generation_context;
  }

  return {
    title: pack.title,
    jobDescription: normalizeOptionalText(pack.job_description),
    jobUrl: normalizeOptionalText(pack.job_url),
    userProfile: normalizeOptionalText(pack.cv_text),
    resume: {
      source: pack.cv_source,
      fileName: normalizeOptionalText(pack.cv_file_name),
      text: normalizeOptionalText(pack.cv_text),
    },
    selectedTone: null,
    outputType: "interview_pack",
    uploadedFiles: [
      ...(pack.cv_source === "file" && pack.cv_file_name
        ? [{ kind: "cv" as const, name: pack.cv_file_name }]
        : []),
      ...(pack.screenshot_names ?? []).map((name) => ({
        kind: "job_screenshot" as const,
        name,
      })),
    ],
    initialPrompt: normalizeOptionalText(pack.additional_instructions),
    generatedOutput: pack.ai_response,
  };
}

export function appendRegenerationInstruction(
  history: InterviewPackRegenerationInstruction[] | null | undefined,
  instruction: string,
  createdAt = new Date().toISOString(),
): InterviewPackRegenerationInstruction[] {
  const normalizedInstruction = instruction.trim();

  return [
    ...(history ?? []),
    {
      instruction: normalizedInstruction,
      createdAt,
    },
  ];
}
