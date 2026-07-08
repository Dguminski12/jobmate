const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_JOB_SCREENSHOT_COUNT = 3;
const MAX_JOB_SCREENSHOT_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_JOB_SCREENSHOT_TOTAL_SIZE_BYTES = 8 * 1024 * 1024;
const supportedCvExtensions = [".pdf", ".docx"];
const supportedScreenshotMimeTypes = ["image/png", "image/jpeg", "image/webp"];

async function getPdfParser() {
  const importedModule = await import("pdf-parse");
  const candidate = importedModule as unknown as {
    default?: (buffer: Buffer) => Promise<{ text: string }>;
  };
  return (candidate.default ?? importedModule) as (buffer: Buffer) => Promise<{ text: string }>;
}

async function getDocxParser() {
  const importedModule = await import("mammoth");
  return (importedModule.default ?? importedModule) as {
    extractRawText: (options: { buffer: Buffer }) => Promise<{ value: string }>;
  };
}

function hasSupportedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return supportedCvExtensions.some((extension) => lowerName.endsWith(extension));
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength);
}

export async function extractCvTextFromFile(file: File): Promise<string> {
  if (!file || file.size <= 0) {
    throw new Error("Upload a CV file before generating.");
  }

  if (file.size > MAX_CV_SIZE_BYTES) {
    throw new Error("CV file is too large. Please upload a file under 10MB.");
  }

  if (!hasSupportedExtension(file.name)) {
    throw new Error("Unsupported CV format. Please upload a PDF or DOCX file.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    const pdfParse = await getPdfParser();
    const parsed = await pdfParse(buffer);
    const normalized = parsed.text.replace(/\s{2,}/g, " ").trim();

    if (!normalized) {
      throw new Error("Unable to read text from this PDF. Please paste CV text instead.");
    }

    return truncateText(normalized, 15000);
  }

  const mammoth = await getDocxParser();
  const parsedDocx = await mammoth.extractRawText({ buffer });
  const normalizedDocx = parsedDocx.value.replace(/\s{2,}/g, " ").trim();

  if (!normalizedDocx) {
    throw new Error("Unable to read text from this DOCX. Please paste CV text instead.");
  }

  return truncateText(normalizedDocx, 15000);
}

export async function toImageDataUrls(files: File[]): Promise<string[]> {
  const dataUrls = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || "image/png";
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }),
  );

  return dataUrls;
}

export function validateJobScreenshotFiles(files: File[]) {
  const nonEmptyFiles = files.filter((file) => file.size > 0);

  if (nonEmptyFiles.length > MAX_JOB_SCREENSHOT_COUNT) {
    throw new Error(`Upload up to ${MAX_JOB_SCREENSHOT_COUNT} screenshots per generation.`);
  }

  let totalSize = 0;

  for (const file of nonEmptyFiles) {
    if (!supportedScreenshotMimeTypes.includes(file.type)) {
      throw new Error("Unsupported screenshot format. Use PNG, JPG, or WEBP images.");
    }

    if (file.size > MAX_JOB_SCREENSHOT_SIZE_BYTES) {
      throw new Error("Each screenshot must be under 4MB.");
    }

    totalSize += file.size;
  }

  if (totalSize > MAX_JOB_SCREENSHOT_TOTAL_SIZE_BYTES) {
    throw new Error("Combined screenshot uploads must be under 8MB.");
  }

  return nonEmptyFiles;
}
