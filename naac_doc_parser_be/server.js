/*
 * Copyright (C) 2026 Vishal Jha
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import express from 'express'
import { google } from 'googleapis'
import dotenv from "dotenv"
import { processAndAuditFile } from './geminiService.js'
import cors from "cors"
import masterCheckList from './master-checklist.json' with {type: "json"}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

//setup OAuth2 client to get access token for google drive
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

//route to start loging in
app.get('/auth', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: scopes,
  });
  res.redirect(url);
});

//callback route
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.redirect("http://localhost:5173"); 
    console.log("Got the tokens m8. scanning.");
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

//recursive folder crawler to get all the folders and files inside the folder. Not my creation.
async function listFilesRecursive(auth, folderId = 'root') {
  const drive = google.drive({ version: 'v3', auth });
  let filesList = [];

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, parents)',
      pageSize: 100, 
    });

    const files = res.data.files;
    
    if (files.length) {
      for (const file of files) {
        const fileData = {
          name: file.name,
          id: file.id,
          mimeType: file.mimeType,
          children: [] 
        };

        if (file.mimeType === 'application/vnd.google-apps.folder') {
          //console.log(`Found folder: ${file.name}`);
          fileData.children = await listFilesRecursive(auth, file.id);
        }
        filesList.push(fileData);
      }
    }
    return filesList;

  } catch (error) {
    console.log('API Error: ' + error);
    return [];
  }
}

//scan drive route(UPDATED). Has some problems gemini helped
app.get('/scan-drive', async (req, res) => {
  //killing the cookie, force browser to ask server every time
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  
  //Explicit check, do we have tokens. gemini told me to have this.
  if (!oauth2Client.credentials || Object.keys(oauth2Client.credentials).length === 0) {
    console.log("No credentials found. Sending 401 to trigger login.");
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    console.log("Starting Scan...");
    const fileStructure = await listFilesRecursive(oauth2Client, 'root'); 
    res.json(fileStructure); 
  } catch (error) {
    console.log("21642fff4d614389bb087c84f8d7ae2d2e5906cc-sha1")
    console.error("Scan Error:", error.message);
    //if the token is expired or invalid, Google returns 401 or 403
    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(500).send("Error scanning drive: " + error.message);
  }
});

//func for getting proper dropdown menu curr having some problems.
const FLAT_RULES = {};
Object.keys(masterCheckList).forEach(criterionKey => {
  const subCriteria = masterCheckList[criterionKey];
  Object.keys(subCriteria).forEach(subKey => {
    FLAT_RULES[subKey] = subCriteria[subKey];
  });
});
console.log(`Loaded ${Object.keys(FLAT_RULES).length} sub-criteria rules.`);

//route for fetching all the checklist for the dropdown menu
app.get('/api/criteria-list', (req, res) => {
  try {
    //maping the keys (e.g., "1.1.1") to an array for the frontend
    const list = Object.keys(masterCheckList).map(key => ({
      id: key,
      title: masterCheckList[key].title || "NAAC Criterion"
    }));
    res.json(masterCheckList);
  } catch (error) {
    res.status(500).json({ error: "Could not load criteria list" });
  }
});

//the main audit endpoint (FIXED). again gemini fixed it for me.
app.get('/audit-file', async (req, res) => {
  const { id, name, mimeType, ruleId } = req.query;

  if (!id || !ruleId) {
    return res.status(400).send("Missing file 'id' or 'ruleId'");
  }

  //REMOVED: const mockRules = JSON.stringify(...) -> This broke the code. IMP note
  //FIXED: Access the imported object directly. IMP note
  const specificRule = FLAT_RULES[ruleId];

  //if checklist doesn't exist, provide alternative so it won't crash
  if (!specificRule) {
    console.log(`Rule ${ruleId} not found in master-checklist. Using generic audit.`);
  }
  //fallback
  const finalRule = specificRule || { 
    note: "General Audit", 
    mandatory_docs: ["Standard Documents"],
    check_for: ["Signatures", "Dates"]
  };

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    //pass the specific rule object to Gemini
    const report = await processAndAuditFile(drive, id, name, mimeType, finalRule);
    
    //cleanup JSON markdown if Gemini adds it
    const cleanedReport = report.replace(/```json|```/g, '').trim();
    
    res.setHeader('Content-Type', 'application/json');
    res.send(cleanedReport);

  } catch (error) {
    console.error("Audit Error:", error);
    res.status(500).send({ error: "Audit failed", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`1. Go to http://localhost:${PORT}/auth to login.`);
});