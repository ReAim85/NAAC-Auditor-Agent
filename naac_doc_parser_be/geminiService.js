/*
 * Copyright (C) 2026 Vishal Jha
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { GoogleAIFileManager } from '@google/generative-ai/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from "fs"
import path from 'path'
import { fileURLToPath } from 'url';
import dotenv from "dotenv"

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//ensure a temp folder exists for saving files until uploaded
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

/**
 * orchestrator: downloads from drive, uploads to gemini, runs audit, cleans up.
 */
export async function processAndAuditFile(driveService, fileId, fileName, mimeType, auditRules) {
  let tempFilePath = null;
  let geminiFile = null;

  try {
    console.log(`Starting Audit for: ${fileName}`);

    //download file from drive to local temp folder
    tempFilePath = path.join(tempDir, fileName);
    const dest = fs.createWriteStream(tempFilePath);
    
    const driveRes = await driveService.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    await new Promise((resolve, reject) => {
      driveRes.data.pipe(dest).on('finish', resolve).on('error', reject);
    });

    //upload to gemini file manager
    console.log(`Uploading to Gemini Vision...`);
    const uploadRes = await fileManager.uploadFile(tempFilePath, {
      mimeType: mimeType,
      displayName: fileName,
    });
    geminiFile = uploadRes.file;
    console.log(`File active at: ${geminiFile.uri}`);

    //wait for file to be processed (important for large PDFs). gemini recommends.
    //the "audit", sending the file and rules to gemini
    console.log(`Asking Gemini to verify rules...`);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });    
    const prompt = `
      You are a strict NAAC Accreditation Auditor. 
      I have uploaded a document titled "${fileName}".
      
      Your task is to verify if this document meets the following specific requirements:
      ${JSON.stringify(auditRules, null, 2)}
      
      INSTRUCTIONS:
      1. Check if the document matches the "mandatory_docs" description.
      2. Visually scan for stamps, seals, and signatures if required.
      3. Verify dates match the assessment period (last 5 years).
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "status": "Compliant" | "Non-Compliant" | "Missing Data",
        "missing_elements": ["List specific missing items"],
        "confidence_score": "High" | "Medium" | "Low",
        "reasoning": "Brief explanation of your finding."
      }
    `;

    const result = await model.generateContent([
      { fileData: { mimeType: uploadRes.file.mimeType, fileUri: uploadRes.file.uri } },
      { text: prompt },
    ]);

    const auditResult = result.response.text();

    return auditResult;

  } catch (error) {
    console.error("Audit Failed:", error);
    return JSON.stringify({ error: error.message });
  } finally {
    //cleanup (IMP!) saves storage
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); //delete local temp to save storage
    if (geminiFile) await fileManager.deleteFile(geminiFile.name); //delete from gemini cloud to save cloud storage
    console.log(`Cleanup done.`);
  }
}