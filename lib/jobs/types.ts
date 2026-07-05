export const jobStatuses = [
  "Wishlist",
  "Applied",
  "Interview",
  "Assessment",
  "Offer",
  "Rejected",
  "Accepted",
] as const;

export type JobStatus = (typeof jobStatuses)[number];

export const employmentTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
] as const;

export type EmploymentType = (typeof employmentTypes)[number];

export const jobSortOptions = ["date-desc", "date-asc", "company-asc", "company-desc"] as const;

export type JobSortOption = (typeof jobSortOptions)[number];

export type JobRecord = {
  id: string;
  user_id: string;
  company: string;
  job_title: string;
  location: string;
  salary: string | null;
  employment_type: EmploymentType;
  application_date: string;
  status: JobStatus;
  job_url: string | null;
  notes: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
};

export type JobFormValues = {
  company: string;
  jobTitle: string;
  location: string;
  salary?: string;
  employmentType: EmploymentType;
  applicationDate: string;
  status: JobStatus;
  jobUrl?: string;
  notes?: string;
  nextAction?: string;
};

export type JobFormField = keyof JobFormValues;

export type JobActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<JobFormField, string>>;
};

export type JobDeleteActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type DashboardFilters = {
  search: string;
  status: JobStatus | "all";
  sort: JobSortOption;
};
