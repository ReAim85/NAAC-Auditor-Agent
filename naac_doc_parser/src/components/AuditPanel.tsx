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
      <div className="h-full flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
        <FileSearch size={48} className="mb-3 text-stone-300" />
        <p className="text-sm font-medium">Select a document to begin audit</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-5">
      {/* --- Control Card --- */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Selected Document</h3>
        </div>
        <h2 className="font-serif-display text-2xl text-stone-900 mb-1 truncate ml-4">{selectedFile.name}</h2>
        <div className="flex gap-2 text-xs text-stone-400 mb-6 ml-4">
          <span className="bg-stone-100 px-2 py-0.5 rounded font-mono">{selectedFile.id}</span>
        </div>

        {/* --- DROPDOWN 1: Main Criterion --- */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
            1. Criterion Category
          </label>
          <select
            className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 text-stone-800 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
            value={selectedCriterion}
            onChange={(e) => {
              setSelectedCriterion(e.target.value);
              setSelectedSubCriterion("");
            }}
          >
            <option value="">Choose category...</option>
            {Object.keys(masterList).map((key) => (
              <option key={key} value={key}>
                {formatLabel(key)}
              </option>
            ))}
          </select>
        </div>

        {/* --- DROPDOWN 2: Sub-Criterion (Dependent) --- */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
            2. Specific Metric
          </label>
          <select
            className="w-full p-3 border border-stone-200 rounded-xl bg-stone-50 text-stone-800 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none disabled:bg-stone-100 disabled:text-stone-300 transition-all"
            value={selectedSubCriterion}
            onChange={(e) => setSelectedSubCriterion(e.target.value)}
            disabled={!selectedCriterion}
          >
            <option value="">
              {selectedCriterion ? "Choose metric..." : "Select a category first"}
            </option>
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
          className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 tracking-wide"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={18}/> <span>Analysing compliance...</span></>
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
          className="flex-1 p-6 rounded-2xl border border-stone-200 bg-white overflow-y-auto"
        >
          {/* Status Header */}
          <div className="flex justify-between items-start mb-6 pb-5 border-b border-stone-100">
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Status</h3>
              <div className="flex items-center gap-2.5">
                {auditReport.status === 'Compliant' ? (
                  <CheckCircle className="text-emerald-500" size={22} />
                ) : (
                  <XCircle className="text-red-500" size={22} />
                )}
                <span className={`font-serif-display text-2xl ${
                  auditReport.status === 'Compliant' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {auditReport.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Confidence</h3>
              <span className={`font-bold text-lg px-3 py-1 rounded-lg ${
                auditReport.confidence_score === 'High' ? 'text-emerald-700 bg-emerald-50' :
                auditReport.confidence_score === 'Medium' ? 'text-amber-700 bg-amber-50' :
                'text-red-700 bg-red-50'
              }`}>{auditReport.confidence_score}</span>
            </div>
          </div>

          {/* Missing Elements & Reasoning */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                Missing Elements
              </h4>
              {auditReport.missing_elements?.length > 0 ? (
                <ul className="space-y-2">
                  {auditReport.missing_elements.map((item: string, i: number) => (
                    <li key={i} className="flex items-center gap-2.5 bg-red-50/60 text-red-800 px-4 py-2.5 rounded-xl border border-red-100 text-sm">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-emerald-700 bg-emerald-50/60 px-4 py-2.5 rounded-xl text-sm border border-emerald-100 font-medium">
                  No missing elements found.
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">AI Reasoning</h4>
              <p className="text-stone-600 bg-stone-50 p-5 rounded-xl text-sm leading-relaxed border border-stone-100">
                {auditReport.reasoning}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}