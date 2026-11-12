/*
 * Copyright (C) 2026 Vishal Jha
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import DriveExplorer from './components/DriveExplorer';
import AuditPanel from './components/AuditPanel';

const BACKEND_URL = "http://localhost:3000";

//types
type SelectedFile = { id: string, name: string, mimeType: string }
type AuditReport = {
  status : "Compliant" | "Non-Compliant" | "Missing Data",
  confidence_score : "High" | "Medium" | "Low",
  reasoning : string,
  missing_elements : Array<string>
}

function App() {
  const [fileStructure, setFileStructure] = useState(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile>();
  const [auditReport, setAuditReport] = useState<AuditReport | null>();
  const [loading, setLoading] = useState(false);

  //this useEffect() will redirect the user if OAuth tokens not found.
  useEffect(() => {
    async function loadDrive() {
      try {
        console.log("Attempting to fetch drive files...");
        //cached tokes were making it hard redirecting to the login page. So,the header part will not send any cached tokens.
        const res = await axios.get(`${BACKEND_URL}/scan-drive`, {
           headers: { 'Cache-Control': 'no-cache' } 
        });
        
        setFileStructure(res.data);
      } catch (err: any) { //any so that all type of error are accessable.
        console.error("Failed to load drive:", err);
        
        //check so that only valid errors redirect to login page.
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
           console.log("Redirecting to Auth...");
           window.location.href = `${BACKEND_URL}/auth`;
        }
      }
    }
    loadDrive();
  }, []);

  const handleAudit = async (ruleId: string) => {
    if (!selectedFile || !ruleId) return;
    
    setLoading(true);
    setAuditReport(null);

    try {
      const res = await axios.get(`${BACKEND_URL}/audit-file`, {
        params: {
          id: selectedFile.id,
          name: selectedFile.name,
          mimeType: selectedFile.mimeType,
          ruleId: ruleId 
        }
      });
      setAuditReport(res.data);
    } catch (err) {
      console.error("Audit failed", err);
      alert("Audit failed. Check backend console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-stone-50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-center gap-3">
        <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
        <h1 className="font-serif-display text-2xl text-stone-900 tracking-tight">NAAC Auditor</h1>
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest ml-2">Compliance Engine</span>
      </div>

      <div className="flex flex-1 p-5 gap-5 overflow-hidden">
        {/* Sidebar (Left) */}
        <div className="w-1/3 h-full flex flex-col">
          <DriveExplorer
            data={fileStructure}
            onFileSelect={(file: any) => {
              setSelectedFile(file);
              setAuditReport(null);
            }}
          />
        </div>

        {/* Main Panel (Right) */}
        <div className="w-2/3 h-full">
          <AuditPanel
            selectedFile={selectedFile}
            //@ts-ignore
            auditReport={auditReport}
            loading={loading}
            onAudit={handleAudit}
          />
        </div>
      </div>
    </div>
  );
}

export default App;