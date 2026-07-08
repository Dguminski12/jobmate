import { describe, expect, it } from "vitest";
import {
  appendRegenerationInstruction,
  createInterviewPackGenerationContext,
  deriveInterviewPackGenerationContext,
} from "@/lib/interview-packs/context";
import type { InterviewPackRecord } from "@/lib/interview-packs/types";

describe("interview pack context", () => {
  it("builds original generation context from the initial pack input", () => {
    const context = createInterviewPackGenerationContext({
      title: "Maintenance Engineer Interview Pack",
      cvSource: "file",
      cvFileName: "cv.pdf",
      cvText: "Experienced maintenance engineer with welding and preventative maintenance experience.",
      jobUrl: "https://example.com/jobs/maintenance-engineer",
      jobDescription: "Maintain equipment and support preventative maintenance schedules.",
      screenshotNames: ["job-posting-1.png"],
      additionalInstructions: "Keep the tone professional.",
      aiResponse: {
        coverLetter: "Example cover letter output",
        cvOptimisationSuggestions: ["One", "Two", "Three"],
        atsKeywordAnalysis: {
          summary: "Summary",
          matchedKeywords: ["maintenance"],
          missingKeywords: ["safety"],
        },
        companyResearch: "Research",
        roleSummary: "Role summary",
        likelyInterviewQuestions: ["Q1", "Q2", "Q3", "Q4"],
        starAnswerExamples: [],
        technicalTopicsToRevise: ["Topic 1", "Topic 2", "Topic 3"],
        salaryInsights: "Salary",
        questionsToAskInterviewer: ["A", "B", "C", "D"],
        interviewChecklist: ["1", "2", "3", "4", "5"],
        promptDrivenExtras: [],
      },
    });

    expect(context.outputType).toBe("interview_pack");
    expect(context.initialPrompt).toBe("Keep the tone professional.");
    expect(context.uploadedFiles).toEqual([
      { kind: "cv", name: "cv.pdf" },
      { kind: "job_screenshot", name: "job-posting-1.png" },
    ]);
  });

  it("derives fallback context for older packs without a saved generation context", () => {
    const pack = {
      id: "1",
      user_id: "2",
      title: "Existing Pack",
      status: "ready",
      cv_source: "text",
      cv_file_name: null,
      cv_text: "Saved CV text",
      job_url: "https://example.com/job",
      job_description: "Saved description",
      screenshot_names: ["shot.png"],
      additional_instructions: "Original prompt",
      generation_context: null,
      regeneration_history: [],
      ai_response: {
        coverLetter: "Saved output",
        cvOptimisationSuggestions: ["One", "Two", "Three"],
        atsKeywordAnalysis: {
          summary: "Summary",
          matchedKeywords: [],
          missingKeywords: [],
        },
        companyResearch: "Research",
        roleSummary: "Role summary",
        likelyInterviewQuestions: ["Q1", "Q2", "Q3", "Q4"],
        starAnswerExamples: [],
        technicalTopicsToRevise: ["Topic 1", "Topic 2", "Topic 3"],
        salaryInsights: "Salary",
        questionsToAskInterviewer: ["A", "B", "C", "D"],
        interviewChecklist: ["1", "2", "3", "4", "5"],
        promptDrivenExtras: [],
      },
      created_at: "",
      updated_at: "",
    } satisfies InterviewPackRecord;

    const context = deriveInterviewPackGenerationContext(pack);

    expect(context.title).toBe("Existing Pack");
    expect(context.initialPrompt).toBe("Original prompt");
    expect(context.generatedOutput.coverLetter).toBe("Saved output");
  });

  it("appends each regeneration instruction without replacing older ones", () => {
    const history = appendRegenerationInstruction(
      appendRegenerationInstruction([], "Mention welding experience at Dennisons.", "2026-07-08T10:00:00.000Z"),
      "Emphasise preventative maintenance at Flexible Medical Packaging.",
      "2026-07-08T10:05:00.000Z",
    );

    const nextHistory = appendRegenerationInstruction(
      history,
      "Reduce to one page.",
      "2026-07-08T10:10:00.000Z",
    );

    expect(nextHistory.map((entry) => entry.instruction)).toEqual([
      "Mention welding experience at Dennisons.",
      "Emphasise preventative maintenance at Flexible Medical Packaging.",
      "Reduce to one page.",
    ]);
  });
});
