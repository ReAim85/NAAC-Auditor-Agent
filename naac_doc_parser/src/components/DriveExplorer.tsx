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
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react';

//recursive function to render the folder structure tree
const FileNode = ({ node, onSelect }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.children && node.children.length > 0;

  return (
    <div className="pl-4">
      <div 
        className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-100 rounded px-2 text-gray-700 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          if (isFolder) setIsOpen(!isOpen);
          else onSelect(node);
        }}
      >
        {isFolder && (
          <span className="text-gray-400">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {isFolder ? <Folder size={16} className="text-blue-500" /> : <FileText size={16} className="text-gray-500" />}
        <span className="text-sm truncate font-medium">{node.name}</span>
      </div>

      <AnimatePresence>
        {isOpen && isFolder && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-l border-gray-200 ml-2"
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
  if (!data) return <div className="p-4 text-gray-400">Loading Drive...</div>;

  return (
    <div className="w-full bg-white shadow-sm rounded-xl p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-6 h-6" alt="Drive" />
        NAAC Drive
      </h2>
      {data.map((node: any) => (
        <FileNode key={node.id} node={node} onSelect={onFileSelect} />
      ))}
    </div>
  );
}