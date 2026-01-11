/*
 * Copyright (C) 2026 Vishal Jha
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, FileSearch, Loader2 } from 'lucide-react';
import axios from 'axios';

//types
type SelectedFile = {
  name: string,
  id: string,
}

type AuditReport = {
  status: "Compliant" | "Non-Compliant" | "Missing Data", 
  confidence_score: "High" | "Medium" | "Low",
  reasoning: string,
  missing_elements: Array<string>
}

type AuditPanelProps = {
  selectedFile: SelectedFile | undefined,
  auditReport: AuditReport | undefined | null,
  loading: boolean,
  onAudit: (ruleId: string) => void
}

type SubCriterion = {
  mandatory_docs: string[];
  check_for: string[];
  type: string;
}

type CriterionGroup = {
  [key: string]: SubCriterion;
}

type MasterChecklist = {
  [key: string]: CriterionGroup;
}

export default function AuditPanel({ selectedFile, auditReport, loading, onAudit }: AuditPanelProps) {
  const [masterList, setMasterList] = useState<MasterChecklist>({});
  const [selectedCriterion, setSelectedCriterion] = useState("");
  const [selectedSubCriterion, setSelectedSubCriterion] = useState("");

  useEffect(() => {
    axios.get('http://localhost:3000/api/criteria-list')
      .then(res => setMasterList(res.data))
      .catch(err => console.error("Failed to load criteria list.", err));
  }, []);

  const availableSubCriteria = selectedCriterion ? masterList[selectedCriterion] : {};

  const formatLabel = (str: string) => str.replace(/_/g, ' ');

  if (!selectedFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <FileSearch size={48} className="mb-2 opacity-50" />
        <p>Select a file from the left to begin</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* --- Control Card --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 truncate">{selectedFile.name}</h2>
        <div className="flex gap-2 text-sm text-gray-500 mb-6">
          <span className="bg-gray-100 px-2 py-1 rounded">ID: {selectedFile.id}</span>
        </div>

        {/* --- DROPDOWN 1: Main Criterion --- */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            1. Select Criterion category
          </label>
          <select 
            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            value={selectedCriterion}
            onChange={(e) => {
              setSelectedCriterion(e.target.value);
              setSelectedSubCriterion("");
            }}
          >
            <option value="">-- Choose Category --</option>
            {Object.keys(masterList).map((key) => (
              <option key={key} value={key}>
                {formatLabel(key)}
              </option>
            ))}
          </select>
        </div>

        {/* --- DROPDOWN 2: Sub-Criterion (Dependent) --- */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
            2. Select Specific Metric
          </label>
          <select 
            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
            value={selectedSubCriterion}
            onChange={(e) => setSelectedSubCriterion(e.target.value)}
            disabled={!selectedCriterion}
          >
            <option value="">
              {selectedCriterion ? "-- Choose Specific Metric --" : "Select a Category first"}
            </option>
            
            {/* Dynamically map the sub-keys of the selected parent */}
            {Object.keys(availableSubCriteria).map((subKey) => (
              <option key={subKey} value={subKey}>
                {formatLabel(subKey)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onAudit(selectedSubCriterion)}
          disabled={loading || !selectedSubCriterion}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={20}/> Checking Compliance...</>
          ) : (
            "Run Compliance Check"
          )}
        </button>
      </div>

      {/* --- Report Card --- */}
      {auditReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex-1 p-6 rounded-xl shadow-sm border-l-4 bg-white overflow-y-auto ${
            auditReport.status === 'Compliant' ? 'border-green-500' : 'border-red-500'
          }`}
        >
          {/* Status Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</h3>
              <div className="flex items-center gap-2">
                {auditReport.status === 'Compliant' ? (
                  <CheckCircle className="text-green-500" size={24} />
                ) : (
                  <XCircle className="text-red-500" size={24} />
                )}
                <span className={`text-2xl font-bold ${
                  auditReport.status === 'Compliant' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {auditReport.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Confidence</h3>
              <span className="text-indigo-600 font-bold text-xl">{auditReport.confidence_score}</span>
            </div>
          </div>

          {/* Missing Elements & Reasoning */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Missing Elements
              </h4>
              {auditReport.missing_elements?.length > 0 ? (
                <ul className="space-y-2">
                  {auditReport.missing_elements.map((item: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-md border border-red-100 text-sm">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-600 bg-green-50 px-3 py-2 rounded text-sm border border-green-100">
                  No missing elements found.
                </p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">AI Reasoning</h4>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg text-sm leading-relaxed border border-gray-100">
                {auditReport.reasoning}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}