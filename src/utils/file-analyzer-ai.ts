import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

export type DocumentAiResult = {
  documentCategory: string;
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

Automatically detect the document type from the following predefined categories ONLY:
Passport, National ID, Driving License, Voter ID, Birth Certificate, Residence Permit, Work Permit, Student ID, Tax ID, Insurance Card, Vehicle Registration, Visa, Bank Statement, Utility Bill, Employee ID, Health Card, Ration Card, Social Security Card, Immigration Document, Other
If the document does not clearly match any category, return "Other".
Extract all readable and important fields exactly as they appear on the document.
Return every extracted field inside a "fields" object.
Keep field names human-readable and preserve values exactly as they appear on the document.
Include a top-level "documentCategory" string using ONLY one of the predefined categories.
Output MUST be clean JSON ONLY.
Do NOT include comments, markdown, explanation, or extra text.

Return JSON in this shape:
{
"title": "",
"documentCategory": "",
"fields": {
"shortDescription": "",
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

    const parsed = JSON.parse(normalized) as Partial<DocumentAiResult> & {
      documentType?: string;
    };

    return {
      documentCategory: parsed.documentCategory || parsed.documentType || "Other",
      fields: parsed.fields && typeof parsed.fields === "object" ? parsed.fields : {},
    };
  }
}
