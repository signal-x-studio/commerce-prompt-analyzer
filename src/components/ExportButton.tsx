import React from 'react';
import { TestResult, EngineId, CategoryPrompts } from '../types';

interface ExportButtonProps {
  results: CategoryPrompts[];
  testResults: Record<string, Partial<Record<EngineId, TestResult>>>;
  userUrl: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ results, testResults, userUrl }) => {
  const handleExport = () => {
    const rows = [['Category', 'Prompt', 'Engine', 'Status', 'Rank', 'Sentiment', 'Answer Text', 'Top Competitors']];

    results.forEach(category => {
      category.prompts.forEach(prompt => {
        const promptResults = testResults[prompt];
        if (promptResults) {
          Object.entries(promptResults).forEach(([engineId, result]) => {
            const testResult = result as TestResult | undefined;
            if (testResult) {
               const competitors = testResult.sources
                ?.slice(0, 3)
                .map(s => new URL(s.uri).hostname.replace(/^www\./, ''))
                .join(', ') || '';

              rows.push([
                category.subcategory,
                `"${prompt.replace(/"/g, '""')}"`, // Escape quotes
                engineId,
                testResult.status,
                testResult.rank ? testResult.rank.toString() : '',
                testResult.sentiment || '',
                `"${(testResult.answerText || '').replace(/"/g, '""').substring(0, 500)}..."`, // Truncate and escape
                `"${competitors}"`
              ]);
            }
          });
        }
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "prompt_analysis_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  );
};
