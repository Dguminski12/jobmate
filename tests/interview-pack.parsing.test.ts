import { describe, expect, it } from "vitest";
import { validateJobScreenshotFiles } from "@/lib/interview-packs/parsing";

function createImageFile(name: string, sizeInBytes: number, type = "image/png") {
  return new File([new Uint8Array(sizeInBytes)], name, { type });
}

describe("interview pack parsing", () => {
  it("rejects screenshots above the per-file size limit", () => {
    const oversizedFile = createImageFile("oversized.png", 4 * 1024 * 1024 + 1);

    expect(() => validateJobScreenshotFiles([oversizedFile])).toThrow("Each screenshot must be under 4MB.");
  });

  it("rejects unsupported screenshot mime types", () => {
    const invalidFile = createImageFile("shot.gif", 1024, "image/gif");

    expect(() => validateJobScreenshotFiles([invalidFile])).toThrow(
      "Unsupported screenshot format. Use PNG, JPG, or WEBP images.",
    );
  });
});
