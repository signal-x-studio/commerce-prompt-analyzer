
import React from 'react';

interface LogOutputProps {
  thinking: string;
  sources: string;
}

export const LogOutput: React.FC<LogOutputProps> = ({ thinking, sources }) => {
  return (
    <details className="group bg-slate-900 text-slate-300 rounded-lg shadow-inner overflow-hidden">
      <summary className="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-slate-800 transition-colors">
        <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="font-mono text-sm font-medium text-slate-200">View Generation Log & Sources</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="p-6 border-t border-slate-700 bg-black/20">
        <div className="space-y-6 font-mono text-sm">
          <div>
            <h4 className="text-cyan-400 font-semibold mb-2">[ Thinking Process ]</h4>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-400">{thinking}</p>
          </div>
          <div>
            <h4 className="text-cyan-400 font-semibold mb-2">[ Data Sources & Insights ]</h4>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-400">{sources}</p>
          </div>
        </div>
      </div>
    </details>
  );
};
