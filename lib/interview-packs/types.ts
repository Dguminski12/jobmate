export type InterviewPackStatus = "ready" | "error";

export type CVSource = "file" | "text";

export type ATSKeywordAnalysis = {
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
};

export type STARAnswerExample = {
  prompt: string;
  situation: string;
  task: string;
  action: string;
  result: string;
};

export type InterviewPackContent = {
  coverLetter: string;
  cvOptimisationSuggestions: string[];
  atsKeywordAnalysis: ATSKeywordAnalysis;
  companyResearch: string;
  roleSummary: string;
  likelyInterviewQuestions: string[];
  starAnswerExamples: STARAnswerExample[];
  technicalTopicsToRevise: string[];
  salaryInsights: string;
  questionsToAskInterviewer: string[];
  interviewChecklist: string[];
  promptDrivenExtras: string[];
};

export type InterviewPackUploadedFile = {
  kind: "cv" | "job_screenshot";
  name: string;
};

export type InterviewPackRegenerationInstruction = {
  instruction: string;
  createdAt: string;
};

export type InterviewPackGenerationContext = {
  title: string;
  jobDescription: string | null;
  jobUrl: string | null;
  userProfile: string | null;
  resume: {
    source: CVSource;
    fileName: string | null;
    text: string | null;
  };
  selectedTone: string | null;
  outputType: string;
  uploadedFiles: InterviewPackUploadedFile[];
  initialPrompt: string | null;
  generatedOutput: InterviewPackContent;
};

export type InterviewPackRecord = {
  id: string;
  user_id: string;
  title: string;
  status: InterviewPackStatus;
  cv_source: CVSource;
  cv_file_name: string | null;
  cv_text: string | null;
  job_url: string | null;
  job_description: string | null;
  screenshot_names: string[];
  additional_instructions: string | null;
  generation_context: InterviewPackGenerationContext | null;
  regeneration_history: InterviewPackRegenerationInstruction[];
  ai_response: InterviewPackContent;
  created_at: string;
  updated_at: string;
};

export type CreateInterviewPackInput = {
  title: string;
  cvSource: CVSource;
  cvFileName?: string;
  cvText?: string;
  jobUrl?: string;
  jobDescription?: string;
  screenshotNames: string[];
  additionalInstructions?: string;
  generationContext: InterviewPackGenerationContext;
  regenerationHistory: InterviewPackRegenerationInstruction[];
  aiResponse: InterviewPackContent;
};

export type GenerateInterviewPackActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<"title" | "cvText" | "cvFile" | "jobDetails", string>>;
  pack?: InterviewPackRecord;
};

export type AddPackToTrackerActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type RegenerateInterviewPackActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<"additionalPrompt", string>>;
  pack?: InterviewPackRecord;
};

export type DeleteInterviewPackActionState = {
  status: "idle" | "success" | "error";
  message: string;
  deletedPackId?: string;
};
