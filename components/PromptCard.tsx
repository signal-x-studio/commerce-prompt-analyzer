import React, { useState } from 'react';
import { TestResult, EngineId, ENGINES } from '../types';
import { SourceList } from './SourceList';

interface PromptCardProps {
  prompt: string;
  promptTestResults?: Partial<Record<EngineId, TestResult>>;
  userUrl: string;
  testedEngineIds: EngineId[];
  onRunSingleTest: (prompt: string) => void;
  isTestingThisCard: boolean;
  isGlobalTesting: boolean;
}

const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
        case 'testing':
            return (
                <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            );
        case 'found':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            );
        case 'not-found':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            );
        case 'error':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        default:
            return <div className="h-4 w-4" />; // Placeholder for untested
    }
};

const EngineResultRow: React.FC<{engineId: EngineId; result?: TestResult; userUrl: string}> = ({ engineId, result, userUrl }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const engine = ENGINES[engineId];
    const status = result?.status || 'untested';
    
    if (status === 'untested') return null;

    const hasSources = result?.sources && result.sources.length > 0;
    const isClickable = hasSources && (status === 'found' || status === 'not-found');

    return (
        <div className="text-sm">
            <button
                className={`flex items-center w-full p-2 text-left rounded transition-colors ${isClickable ? 'hover:bg-slate-200/50' : 'cursor-default'}`}
                onClick={() => isClickable && setIsExpanded(!isExpanded)}
                disabled={!isClickable}
            >
                <div className="mr-2 flex-shrink-0">{getStatusIcon(status)}</div>
                <span className="flex-grow font-medium text-slate-700">{engine.name}</span>
                {isClickable && <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
            </button>
            {isExpanded && result?.sources && (
                <div className="pl-8 pr-2 pt-1 pb-2">
                    <SourceList sources={result.sources} userUrl={userUrl} />
                </div>
            )}
        </div>
    );
};


export const PromptCard: React.FC<PromptCardProps> = ({ prompt, promptTestResults, userUrl, testedEngineIds, onRunSingleTest, isTestingThisCard, isGlobalTesting }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasResults = promptTestResults && Object.keys(promptTestResults).length > 0;

  return (
    <div className="group relative flex flex-col bg-slate-50 border border-slate-200 rounded-lg hover:shadow-md hover:border-indigo-300 transition-all duration-300">
      <div className="p-4 flex items-start flex-grow">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="text-sm text-slate-700 flex-grow">{prompt}</p>
      </div>

      <button 
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/50 text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-indigo-100 hover:text-indigo-600 transition-all"
        aria-label="Copy prompt"
        >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      
       <div className="border-t border-slate-200 mt-2 p-2">
            {hasResults ? (
                 <div className="space-y-1">
                    {testedEngineIds.map(engineId => (
                        <EngineResultRow
                            key={engineId}
                            engineId={engineId}
                            result={promptTestResults?.[engineId]}
                            userUrl={userUrl}
                        />
                    ))}
                 </div>
            ) : (
                <button
                    onClick={() => onRunSingleTest(prompt)}
                    disabled={isTestingThisCard || isGlobalTesting}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm bg-indigo-100 text-indigo-700 font-semibold rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-wait transition-colors duration-200"
                >
                    {isTestingThisCard ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Testing...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.274 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            Test Prompt
                        </>
                    )}
                </button>
            )}
       </div>
    </div>
  );
};