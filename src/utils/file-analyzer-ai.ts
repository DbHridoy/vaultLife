import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

export type DocumentAiResult = {
  documentType: string;
  fields: Record<string, unknown>;
};

export class FileAnalyzerAI {
  private getClient() {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required to analyze documents");
    }

    return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async analyzeDocument(filePath: string): Promise<DocumentAiResult> {
    const ai = this.getClient();
    const uploadResult = await ai.files.upload({
      file: filePath,
      config: { displayName: "Uploaded Document" },
    });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an OCR data extractor.

Your responsibilities:
1. Automatically detect the document type (passport, ID card, license, etc.).
2. Extract all readable and important fields exactly as they appear on the document.
3. Return every extracted field inside a "fields" object.
4. Keep field names human-readable and preserve values exactly as they appear on the document.
5. Include a top-level "documentType" string.
6. Output MUST be clean JSON ONLY.
7. Do NOT include comments, markdown, explanation, or extra text.

Return JSON in this shape:
{
  "documentType": "passport",
  "fields": {
    "documentNumber": "",
    "surname": "",
    "givenNames": ""
  }
}`,
              },
              {
                fileData: {
                  fileUri: uploadResult.uri,
                  mimeType: uploadResult.mimeType,
                },
              },
            ],
          },
        ],
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error("AI returned an empty response");
      }

      return this.parseAiResponse(rawText);
    } finally {
      if (uploadResult.name) {
        await ai.files.delete({ name: uploadResult.name });
      }
    }
  }

  private parseAiResponse(rawText: string): DocumentAiResult {
    const normalized = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(normalized) as Partial<DocumentAiResult>;

    return {
      documentType: parsed.documentType || "unknown",
      fields: parsed.fields && typeof parsed.fields === "object" ? parsed.fields : {},
    };
  }
}
