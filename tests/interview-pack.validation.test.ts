import { describe, expect, it } from "vitest";
import { generateInterviewPackSchema, regenerateInterviewPackSchema } from "@/lib/interview-packs/validation";

describe("interview pack validation", () => {
  it("rejects text mode when cv text is too short", () => {
    const parsed = generateInterviewPackSchema.safeParse({
      title: "Test Pack",
      cvMode: "text",
      cvText: "too short",
      screenshotNames: ["shot.png"],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const cvTextIssue = parsed.error.issues.find((issue) => issue.path[0] === "cvText");
      expect(cvTextIssue?.message).toContain("80 characters");
    }
  });

  it("rejects file mode without file name and saved cv", () => {
    const parsed = generateInterviewPackSchema.safeParse({
      title: "Test Pack",
      cvMode: "file",
      screenshotNames: ["shot.png"],
      jobDescription: "A".repeat(60),
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fileIssue = parsed.error.issues.find((issue) => issue.path[0] === "cvFileName");
      expect(fileIssue?.message).toContain("Upload a CV file");
    }
  });

  it("accepts valid regenerate payload", () => {
    const parsed = regenerateInterviewPackSchema.safeParse({
      packId: "3b4ef527-2b30-4970-94e3-67f45c8a06b8",
      additionalPrompt: "Focus heavily on stakeholder communication examples.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects regenerate payload when prompt is too short", () => {
    const parsed = regenerateInterviewPackSchema.safeParse({
      packId: "3b4ef527-2b30-4970-94e3-67f45c8a06b8",
      additionalPrompt: "too short",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects more than three screenshots", () => {
    const parsed = generateInterviewPackSchema.safeParse({
      title: "Test Pack",
      cvMode: "text",
      cvText: "A".repeat(100),
      screenshotNames: ["1.png", "2.png", "3.png", "4.png"],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const screenshotIssue = parsed.error.issues.find((issue) => issue.path[0] === "screenshotNames");
      expect(screenshotIssue?.message).toContain("up to 3 screenshots");
    }
  });
});
