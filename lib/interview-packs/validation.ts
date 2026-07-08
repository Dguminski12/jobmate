import { z } from "zod";

const uploadModeSchema = z.enum(["file", "text"]);

export const generateInterviewPackSchema = z
  .object({
    title: z.string().trim().min(3, "Enter a pack title.").max(120),
    cvMode: uploadModeSchema,
    cvText: z.string().trim().max(15000).optional(),
    cvFileName: z.string().trim().max(200).optional(),
    savedCvText: z.string().trim().max(15000).optional(),
    savedCvFileName: z.string().trim().max(200).optional(),
    jobUrl: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().url("Enter a valid job URL.").optional(),
    ),
    jobDescription: z.string().trim().max(20000).optional(),
    screenshotNames: z.array(z.string().trim().min(1)).max(3, "Upload up to 3 screenshots."),
    additionalInstructions: z.string().trim().max(8000).optional(),
  })
  .superRefine((input, context) => {
    const hasSavedCv = Boolean(input.savedCvText && input.savedCvText.trim().length >= 80);

    if (input.cvMode === "text" && (!input.cvText || input.cvText.trim().length < 80)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvText"],
        message: "Paste at least 80 characters of CV content.",
      });
    }

    if (input.cvMode === "file" && !input.cvFileName && !hasSavedCv) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvFileName"],
        message: "Upload a CV file (.pdf or .docx) or restore a saved CV.",
      });
    }

    const hasJobDescription = Boolean(input.jobDescription && input.jobDescription.trim().length > 40);
    const hasScreenshots = input.screenshotNames.length > 0;

    if (!hasJobDescription && !hasScreenshots) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobDescription"],
        message: "Provide either a job description or at least one screenshot.",
      });
    }

    if (hasJobDescription && hasScreenshots) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobDescription"],
        message: "Use either a job description or screenshots, not both.",
      });
    }
  });

export const regenerateInterviewPackSchema = z.object({
  packId: z.string().uuid("Missing interview pack id."),
  additionalPrompt: z.string().trim().min(10, "Add at least 10 characters of guidance.").max(4000),
});

export const deleteInterviewPackSchema = z.object({
  packId: z.string().uuid("Missing interview pack id."),
});

export type GenerateInterviewPackInput = z.infer<typeof generateInterviewPackSchema>;
export type RegenerateInterviewPackInput = z.infer<typeof regenerateInterviewPackSchema>;
