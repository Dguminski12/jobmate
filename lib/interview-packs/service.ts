import type { InterviewPackContent } from "./types";
import type { GenerateInterviewPackInput } from "./validation";

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

export async function generateInterviewPackMock(input: GenerateInterviewPackInput): Promise<InterviewPackContent> {
  const role = inferRole(input);
  const company = inferCompany(input);
  const cvSummary = firstSentence(input.cvText) || "your professional background";
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
    roleSummary: `This role emphasizes ownership, communication, and execution. Success likely depends on translating goals into deliverables, managing uncertainty, and showing measurable impact quickly.`,
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