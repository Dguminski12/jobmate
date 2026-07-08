import OpenAI from "openai";
import { z } from "zod";
import type {
  InterviewPackContent,
  InterviewPackGenerationResult,
  InterviewPackGenerationContext,
  InterviewPackRegenerationInstruction,
} from "./types";
import { estimateUsageCostGbp } from "./usage";
import type { GenerateInterviewPackInput } from "./validation";

type GenerateInterviewPackRequest = {
  input: GenerateInterviewPackInput;
  cvText: string;
  screenshotDataUrls: string[];
};

type RegenerateInterviewPackRequest = {
  context: InterviewPackGenerationContext;
  previousOutput: InterviewPackContent;
  regenerationHistory: InterviewPackRegenerationInstruction[];
  latestInstruction: string;
};

const interviewPackContentSchema = z.object({
  coverLetter: z.string().min(20),
  cvOptimisationSuggestions: z.array(z.string()).min(3),
  atsKeywordAnalysis: z.object({
    summary: z.string().min(10),
    matchedKeywords: z.array(z.string()),
    missingKeywords: z.array(z.string()),
  }),
  companyResearch: z.string().min(10),
  roleSummary: z.string().min(10),
  likelyInterviewQuestions: z.array(z.string()).min(4),
  starAnswerExamples: z.array(
    z.object({
      prompt: z.string(),
      situation: z.string(),
      task: z.string(),
      action: z.string(),
      result: z.string(),
    }),
  ),
  technicalTopicsToRevise: z.array(z.string()).min(3),
  salaryInsights: z.string().min(10),
  questionsToAskInterviewer: z.array(z.string()).min(4),
  interviewChecklist: z.array(z.string()).min(5),
  promptDrivenExtras: z.array(z.string()),
});

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to your environment before generating interview packs.");
  }

  return new OpenAI({ apiKey });
}

function buildUserPrompt(input: GenerateInterviewPackInput, cvText: string) {
  return [
    "Create an interview pack using the JSON shape exactly as requested.",
    "",
    `Pack title: ${input.title}`,
    `Job URL: ${input.jobUrl ?? "Not provided"}`,
    `Additional instructions: ${input.additionalInstructions ?? "None"}`,
    "",
    "Job description:",
    input.jobDescription?.trim() ? input.jobDescription : "Not provided",
    "",
    "CV text:",
    cvText,
  ].join("\n");
}

function buildInitialSystemPrompt() {
  return [
    "You are an expert interview coach and career strategist.",
    "Return valid JSON only with this exact shape:",
    "{",
    '  "coverLetter": string,',
    '  "cvOptimisationSuggestions": string[],',
    '  "atsKeywordAnalysis": { "summary": string, "matchedKeywords": string[], "missingKeywords": string[] },',
    '  "companyResearch": string,',
    '  "roleSummary": string,',
    '  "likelyInterviewQuestions": string[],',
    '  "starAnswerExamples": [{ "prompt": string, "situation": string, "task": string, "action": string, "result": string }],',
    '  "technicalTopicsToRevise": string[],',
    '  "salaryInsights": string,',
    '  "questionsToAskInterviewer": string[],',
    '  "interviewChecklist": string[],',
    '  "promptDrivenExtras": string[]',
    "}",
    "Use practical, specific, concise language with UK spelling.",
  ].join("\n");
}

function buildRegenerationSystemPrompt() {
  return [
    "You are an expert interview coach and career strategist.",
    "You are editing an existing document. Preserve all existing improvements unless the latest instruction explicitly asks to remove or replace something.",
    "If the latest instruction conflicts with an earlier instruction, apply the newest instruction only to the conflicting part and keep everything else intact.",
    "Return valid JSON only with this exact shape:",
    "{",
    '  "coverLetter": string,',
    '  "cvOptimisationSuggestions": string[],',
    '  "atsKeywordAnalysis": { "summary": string, "matchedKeywords": string[], "missingKeywords": string[] },',
    '  "companyResearch": string,',
    '  "roleSummary": string,',
    '  "likelyInterviewQuestions": string[],',
    '  "starAnswerExamples": [{ "prompt": string, "situation": string, "task": string, "action": string, "result": string }],',
    '  "technicalTopicsToRevise": string[],',
    '  "salaryInsights": string,',
    '  "questionsToAskInterviewer": string[],',
    '  "interviewChecklist": string[],',
    '  "promptDrivenExtras": string[]',
    "}",
    "Use practical, specific, concise language with UK spelling.",
  ].join("\n");
}

function buildRegenerationUserPrompt(request: RegenerateInterviewPackRequest) {
  const historyText =
    request.regenerationHistory.length > 0
      ? request.regenerationHistory
          .map(
            (entry, index) =>
              `${index + 1}. ${entry.instruction} (added ${entry.createdAt})`,
          )
          .join("\n")
      : "None";

  return [
    "Edit the existing interview pack using the original source context and the full cumulative instruction history.",
    "",
    "Original generation context:",
    JSON.stringify(request.context, null, 2),
    "",
    "Previous generated output:",
    JSON.stringify(request.previousOutput, null, 2),
    "",
    "Entire regeneration instruction history:",
    historyText,
    "",
    `Latest instruction: ${request.latestInstruction}`,
  ].join("\n");
}

function buildUsageResult(
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined,
) {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;

  return {
    modelName: model,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostGbp: estimateUsageCostGbp(model, {
      promptTokens,
      completionTokens,
      totalTokens,
    }),
  };
}

async function generateInterviewPackWithOpenAi(request: GenerateInterviewPackRequest): Promise<InterviewPackGenerationResult> {
  const client = getOpenAiClient();

  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const contentParts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "low" | "high" | "auto" } }
  > = [{ type: "text", text: buildUserPrompt(request.input, request.cvText) }];

  for (const dataUrl of request.screenshotDataUrls) {
    contentParts.push({
      type: "image_url",
      image_url: {
        url: dataUrl,
        detail: "high",
      },
    });
  }

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildInitialSystemPrompt(),
      },
      {
        role: "user",
        content: contentParts,
      },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content;

  if (!rawContent) {
    throw new Error("AI generation returned an empty response.");
  }

  const parsedJson = JSON.parse(rawContent);
  return {
    content: interviewPackContentSchema.parse(parsedJson),
    usage: buildUsageResult(model, completion.usage),
  };
}

async function regenerateInterviewPackWithOpenAi(
  request: RegenerateInterviewPackRequest,
): Promise<InterviewPackGenerationResult> {
  const client = getOpenAiClient();
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildRegenerationSystemPrompt(),
      },
      {
        role: "user",
        content: buildRegenerationUserPrompt(request),
      },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content;

  if (!rawContent) {
    throw new Error("AI regeneration returned an empty response.");
  }

  const parsedJson = JSON.parse(rawContent);
  return {
    content: interviewPackContentSchema.parse(parsedJson),
    usage: buildUsageResult(model, completion.usage),
  };
}

export async function generateInterviewPack(request: GenerateInterviewPackRequest): Promise<InterviewPackGenerationResult> {
  return generateInterviewPackWithOpenAi(request);
}

export async function regenerateInterviewPack(
  request: RegenerateInterviewPackRequest,
): Promise<InterviewPackGenerationResult> {
  return regenerateInterviewPackWithOpenAi(request);
}
