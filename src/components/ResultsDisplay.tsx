import React, { useState } from 'react';
import { PromptCard } from './PromptCard';
import { CompetitorLeaderboard } from './CompetitorLeaderboard';
import { ExportButton } from './ExportButton';
import { ResultDetailsModal } from './ResultDetailsModal';
import { CategoryPrompts, TestResult, EngineId } from '../types';

interface ResultsDisplayProps {
  results: CategoryPrompts[];
  testResults: Record<string, Partial<Record<EngineId, TestResult>>>;
  userUrl: string;
  testedEngineIds: EngineId[];
  onRunSingleTest: (prompt: string) => void;
  testingPrompts: Set<string>;
  isGlobalTesting: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, testResults, userUrl, testedEngineIds, onRunSingleTest, testingPrompts, isGlobalTesting }) => {
  const [selectedResult, setSelectedResult] = useState<{prompt: string, engineId: EngineId, result: TestResult} | null>(null);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Analysis Results</h2>
        <ExportButton results={results} testResults={testResults} userUrl={userUrl} />
      </div>

      <CompetitorLeaderboard testResults={testResults} userUrl={userUrl} />

      {results.map((categoryResult) => (
        <section key={categoryResult.subcategory}>
          <h3 className="text-xl font-bold text-indigo-700 bg-indigo-100/70 inline-block px-4 py-2 rounded-t-lg">
            {categoryResult.subcategory}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-6 rounded-b-lg rounded-r-lg border border-slate-200 shadow-sm">
            {categoryResult.prompts.map((prompt, index) => (
              <PromptCard 
                key={index} 
                prompt={prompt} 
                promptTestResults={testResults[prompt] || {}}
                userUrl={userUrl}
                testedEngineIds={testedEngineIds}
                onRunSingleTest={onRunSingleTest}
                isTestingThisCard={testingPrompts.has(prompt)}
                isGlobalTesting={isGlobalTesting}
                onViewDetails={(engineId, result) => setSelectedResult({ prompt, engineId, result })}
              />
            ))}
          </div>
        </section>
      ))}

      {selectedResult && (
        <ResultDetailsModal
            isOpen={!!selectedResult}
            onClose={() => setSelectedResult(null)}
            prompt={selectedResult.prompt}
            engineId={selectedResult.engineId}
            result={selectedResult.result}
            userUrl={userUrl}
        />
      )}
    </div>
  );
};