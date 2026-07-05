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

function firstSentence(text?: string) {
  if (!text) {
    return "";
  }

  const sentence = text.split(/\.|\n/)[0]?.trim() ?? "";
  return sentence.slice(0, 180);
}

function inferRole(input: GenerateInterviewPackInput) {
  const fromDescription = firstSentence(input.jobDescription);
  if (fromDescription) {
    return fromDescription;
  }

  if (input.jobUrl) {
    try {
      const host = new URL(input.jobUrl).hostname.replace("www.", "");
      return `the role posted on ${host}`;
    } catch {
      return "the target role";
    }
  }

  return "the target role";
}

function inferCompany(input: GenerateInterviewPackInput) {
  if (!input.jobUrl) {
    return "the company";
  }

  try {
    return new URL(input.jobUrl).hostname.replace("www.", "");
  } catch {
    return "the company";
  }
}

function buildMockInterviewPack(input: GenerateInterviewPackInput, cvText: string): InterviewPackContent {
  const role = inferRole(input);
  const company = inferCompany(input);
  const cvSummary = firstSentence(cvText) || "your professional background";
  const promptHint = input.additionalInstructions?.trim();

  return {
    coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for ${role}. My experience in ${cvSummary} positions me to add immediate value at ${company}. I have a track record of delivering measurable outcomes, collaborating across teams, and improving execution quality under pressure.\n\nIn previous roles, I have translated business goals into practical plans, communicated clearly with stakeholders, and consistently delivered against ambitious timelines. I am particularly interested in this opportunity because it aligns with my strengths in ownership, structured problem-solving, and continuous improvement.\n\nI would welcome the opportunity to discuss how I can contribute to ${company}.\n\nKind regards,\nCandidate`,
    cvOptimisationSuggestions: [
      "Lead with a 3-4 line value summary aligned to the target job outcomes.",
      "Quantify impact in each role using metrics (%, $, time saved, throughput).",
      "Move the most relevant skills and tools to the top third of the CV.",
      "Tighten bullet points to an Action -> Impact format.",
    ],
    atsKeywordAnalysis: {
      summary: "Your CV appears strong on delivery and collaboration language. Add more role-specific keywords from the job advert for better ATS match.",
      matchedKeywords: ["stakeholder management", "delivery", "cross-functional", "process improvement"],
      missingKeywords: ["roadmap", "KPI ownership", "risk management", "data-driven decisions"],
    },
    companyResearch: `Research ${company} across recent funding or growth announcements, product launches, and hiring signals. Focus on how this role connects to business priorities over the next 6-12 months.`,
    roleSummary: "This role emphasizes ownership, communication, and execution. Success likely depends on translating goals into deliverables, managing uncertainty, and showing measurable impact quickly.",
    likelyInterviewQuestions: [
      "Tell us about yourself and why this role now.",
      "Describe a project where you improved a process or outcome.",
      "How do you prioritize competing deadlines with limited resources?",
      "How have you handled stakeholder disagreement?",
      "What does success look like for you in the first 90 days?",
    ],
    starAnswerExamples: [
      {
        prompt: "Describe a time you improved performance in a process.",
        situation: "A key workflow had delays and frequent handoff confusion.",
        task: "Improve speed and clarity without increasing team workload.",
        action: "Mapped bottlenecks, introduced clear ownership and lightweight weekly checkpoints.",
        result: "Reduced turnaround time by 28% and improved on-time delivery consistency.",
      },
      {
        prompt: "Tell us about a difficult stakeholder conversation.",
        situation: "Two teams disagreed on scope and release timing.",
        task: "Align both groups and preserve delivery dates.",
        action: "Facilitated a decision workshop, reframed scope by user impact, and documented trade-offs.",
        result: "Reached agreement in one session and launched on schedule.",
      },
    ],
    technicalTopicsToRevise: [
      "Role-specific tooling and workflows",
      "Core domain concepts used in the advert",
      "Metrics design and reporting basics",
      "Scenario-based problem decomposition",
    ],
    salaryInsights: "Use current market bands, location adjustments, and role level signals to define a target range, a stretch range, and a walk-away threshold.",
    questionsToAskInterviewer: [
      "What outcomes define success in the first 6 months?",
      "Where does this role remove the most friction today?",
      "How does the team balance speed and quality in delivery decisions?",
      "What are the biggest risks this role is expected to help mitigate?",
    ],
    interviewChecklist: [
      "Tailor CV headline and top bullets to role outcomes.",
      "Prepare 3 STAR stories covering impact, conflict, and leadership.",
      "Draft a concise role-specific introduction (60-90 seconds).",
      "Prepare thoughtful interviewer questions linked to business priorities.",
      "Rehearse compensation expectations with a clear rationale.",
    ],
    promptDrivenExtras: promptHint
      ? [
          `Extra guidance requested: ${promptHint}`,
          "Generation can be tuned later for tone, brevity, technical depth, and regional style.",
        ]
      : [],
  };
}

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
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

  if (!client) {
    return buildMockInterviewPack(request.input, request.cvText);
  }

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
  try {
    return await generateInterviewPackWithOpenAi(request);
  } catch {
    return buildMockInterviewPack(request.input, request.cvText);
  }
}
