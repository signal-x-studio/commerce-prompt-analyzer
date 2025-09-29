import React from 'react';
import { PromptCard } from './PromptCard';
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
  return (
    <div className="space-y-10">
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
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};