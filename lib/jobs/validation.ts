import { z } from "zod";
import { employmentTypes, jobSortOptions, jobStatuses } from "./types";

function optionalText(maxLength: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).max(maxLength).optional(),
  );
}

export const jobBaseSchema = z.object({
  company: z.string().trim().min(2, "Enter a company name.").max(120),
  jobTitle: z.string().trim().min(2, "Enter a job title.").max(120),
  location: z.string().trim().min(2, "Enter a location.").max(120),
  salary: optionalText(120),
  employmentType: z.enum(employmentTypes, { message: "Choose an employment type." }),
  applicationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid application date."),
  status: z.enum(jobStatuses, { message: "Choose a status." }),
  jobUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url("Enter a valid job URL.").optional(),
  ),
  notes: optionalText(5000),
  nextAction: optionalText(500),
});

export const createJobSchema = jobBaseSchema;

export const updateJobSchema = jobBaseSchema.extend({
  id: z.string().uuid("Missing job id."),
});

export const deleteJobSchema = z.object({
  id: z.string().uuid("Missing job id."),
});

export const dashboardFiltersSchema = z.object({
  search: z.string().trim().optional().default(""),
  status: z.union([z.enum(jobStatuses), z.literal("all")]).default("all"),
  sort: z.enum(jobSortOptions).default("date-desc"),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type DeleteJobInput = z.infer<typeof deleteJobSchema>;
export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;
