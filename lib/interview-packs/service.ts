import OpenAI from "openai";
import { z } from "zod";
import type { InterviewPackContent } from "./types";
import type { GenerateInterviewPackInput } from "./validation";

type GenerateInterviewPackRequest = {
  input: GenerateInterviewPackInput;
  cvText: string;
  screenshotDataUrls: string[];
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

function buildSystemPrompt() {
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

async function generateInterviewPackWithOpenAi(request: GenerateInterviewPackRequest): Promise<InterviewPackContent> {
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
        content: buildSystemPrompt(),
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
  return interviewPackContentSchema.parse(parsedJson);
}

export async function generateInterviewPack(request: GenerateInterviewPackRequest): Promise<InterviewPackContent> {
  return generateInterviewPackWithOpenAi(request);
}
