/*
 * Copyright (C) 2026 Vishal Jha
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FileText, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';

//recursive function to render the folder structure tree
const FileNode = ({ node, onSelect }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.children && node.children.length > 0;

  return (
    <div className="pl-3">
      <div
        className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-amber-50 rounded-lg px-2.5 text-stone-700 transition-all group"
        onClick={(e) => {
          e.stopPropagation();
          if (isFolder) setIsOpen(!isOpen);
          else onSelect(node);
        }}
      >
        {isFolder && (
          <span className="text-stone-400 group-hover:text-amber-500 transition-colors">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {isFolder ? <Folder size={16} className="text-amber-500" /> : <FileText size={16} className="text-stone-400 group-hover:text-stone-600" />}
        <span className="text-sm truncate font-medium">{node.name}</span>
      </div>

      <AnimatePresence>
        {isOpen && isFolder && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-l border-stone-200 ml-3"
          >
            {node.children.map((child : any) => (
              <FileNode key={child.id} node={child} onSelect={onSelect} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function DriveExplorer({ data, onFileSelect }: any) {
  if (!data) return (
    <div className="h-full flex items-center justify-center text-stone-400">
      <Loader2 className="animate-spin mr-2" size={18} />
      Loading Drive...
    </div>
  );

  return (
    <div className="w-full bg-white border border-stone-200 rounded-2xl p-5 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-stone-100">
        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-5 h-5" alt="Drive" />
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Document Explorer</h2>
      </div>
      {data.map((node: any) => (
        <FileNode key={node.id} node={node} onSelect={onFileSelect} />
      ))}
    </div>
  );
}