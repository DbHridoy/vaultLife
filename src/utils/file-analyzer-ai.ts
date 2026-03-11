

import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function processDocument(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Local Error: The file at ${filePath} does not exist!`);
        return;
    }
    try {
        console.log(`--- Uploading: ${path.basename(filePath)} ---`);

        // 1. Upload the file to the Gemini Files API
        // The SDK automatically infers the mimeType from the extension (.pdf, .png, .jpg)
        const uploadResult = await ai.files.upload({
            file: filePath,
            config: { displayName: "User Document" }
        });

        console.log("File uploaded successfully. URI:", uploadResult.uri);

        // 2. Send the file URI to the model
        // Using gemini-3-flash-preview for high speed and document reasoning
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
}` },
                        { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } }
                    ]
                }
            ]
        });

        console.log("\n--- Full Response ---");
        console.log(response.text);

        // Optional: Delete the file after use to keep things clean 
        // (Though Google deletes them automatically after 48 hours)
        await ai.files.delete({ name: uploadResult.name! });

    } catch (error: any) {
        console.error("❌ Process Failed:", error.message);
    }
}

// Replace with your actual file path
processDocument("/home/killer/personal/document-scanner/src/test/test1.pdf");