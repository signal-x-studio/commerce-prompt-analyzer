'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Header } from '../components/Header';
import { UrlInputForm } from '../components/UrlInputForm';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { LogOutput } from '../components/LogOutput';
import { TestResultsSummary } from '../components/TestResultsSummary';
import { TestInfo } from '../components/TestInfo';
import { EngineSelector } from '../components/EngineSelector';
import { generatePromptsFromUrl, testPromptAnswerability } from '../services/geminiService';
import { GenerationResult, TestResult, EngineId, ENGINES } from '../types';
import { useCost } from '../context/CostContext';

import { useLocalStorage } from '../hooks/useLocalStorage';

import { ProgressBar } from '../components/ProgressBar';
import { calculateEstimatedCost } from '../utils/costCalculator';

export default function Home() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [url, setUrl] = useLocalStorage<string>('cpa_url', '');
  const [loading, setLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testingPrompts, setTestingPrompts] = useState<Set<string>>(new Set());
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useLocalStorage<GenerationResult | null>('cpa_generationResult', null);
  const [testResults, setTestResults] = useLocalStorage<Record<string, Partial<Record<EngineId, TestResult>>>>('cpa_testResults', {});
  const [selectedEngines, setSelectedEngines] = useState<Set<EngineId>>(new Set(['gemini_grounded']));
  const [useMockData, setUseMockData] = useLocalStorage<boolean>('cpa_useMockData', false);
  const [completedTests, setCompletedTests] = useState<number>(0);
  
  const { trackUsage } = useCost();

  const allPrompts = useMemo(() => {
    return generationResult?.promptsByCategory.flatMap(p => p.prompts) ?? [];
  }, [generationResult]);

  const estimatedCost = useMemo(() => {
    return calculateEstimatedCost(allPrompts.length, selectedEngines.size);
  }, [allPrompts.length, selectedEngines.size]);

  const handleEngineChange = (engineId: EngineId) => {
    setSelectedEngines(prev => {
        const newSet = new Set(prev);
        if (newSet.has(engineId)) {
            if (newSet.size > 1) { // Prevent unselecting the last one
                newSet.delete(engineId);
            }
        } else {
            newSet.add(engineId);
        }
        return newSet;
    });
  };

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim()) {
      setError('Please enter a valid URL.');
      return;
    }
    setError(null);
    setGenerationResult(null);
    setTestResults({});
    setLoading(true);
    
    try {
      setLoadingStep('Analyzing category structure...');
      const generatedResults = await generatePromptsFromUrl(url, (step) => setLoadingStep(step), useMockData, trackUsage);
      setGenerationResult(generatedResults);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [url, useMockData, trackUsage]);

  const handleRunTests = useCallback(async () => {
    if (!generationResult || !url || selectedEngines.size === 0) return;
    
    setIsTesting(true);
    const initialResults: Record<string, Partial<Record<EngineId, TestResult>>> = {};
    allPrompts.forEach(prompt => {
        initialResults[prompt] = {};
        selectedEngines.forEach(engineId => {
            initialResults[prompt][engineId] = { status: 'testing' };
        });
    });
    setTestResults(initialResults);

    try {
        abortControllerRef.current = new AbortController();
        setCompletedTests(0);
        const tasks: Array<() => Promise<void>> = [];

        for (const prompt of allPrompts) {
            for (const engineId of selectedEngines) {
                tasks.push(async () => {
                    if (abortControllerRef.current?.signal.aborted) return;
                    const engine = ENGINES[engineId];
                    const result = await testPromptAnswerability(prompt, url, engine, useMockData, trackUsage);
                    if (abortControllerRef.current?.signal.aborted) return;
                    
                    setCompletedTests(prev => prev + 1);
                    setTestResults(prev => ({
                        ...prev,
                        [prompt]: {
                            ...prev[prompt],
                            [engineId]: result,
                        }
                    }));
                });
            }
        }

        // Simple concurrency limiter (batch size = 1 to avoid rate limits)
        const BATCH_SIZE = 1;
        for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
            if (abortControllerRef.current?.signal.aborted) {
                break;
            }
            const batch = tasks.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(task => task()));
        }

    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred during testing.');
    } finally {
        setIsTesting(false);
        abortControllerRef.current = null;
    }
  }, [generationResult, url, allPrompts, selectedEngines, useMockData, trackUsage]);

  const handleStopTests = useCallback(() => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    // We don't manually set isTesting(false) here because the loop break will trigger the finally block
  }, []);

  const handleRunSingleTest = useCallback(async (prompt: string) => {
    if (!url || selectedEngines.size === 0) return;

    setTestingPrompts(prev => new Set(prev).add(prompt));

    setTestResults(prev => {
        const newResults = { ...prev };
        newResults[prompt] = { ...newResults[prompt] };
        selectedEngines.forEach(engineId => {
            // Only set to testing if not already tested
            if (!newResults[prompt][engineId]) {
                newResults[prompt][engineId] = { status: 'testing' };
            }
        });
        return newResults;
    });

    try {
        for (const engineId of selectedEngines) {
            const engine = ENGINES[engineId];
            const result = await testPromptAnswerability(prompt, url, engine, useMockData, trackUsage);
            setTestResults(prev => ({
                ...prev,
                [prompt]: {
                    ...prev[prompt],
                    [engineId]: result,
                }
            }));
        }
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? `Error testing prompt: ${err.message}` : 'An error occurred during testing.');
    } finally {
        setTestingPrompts(prev => {
            const newSet = new Set(prev);
            newSet.delete(prompt);
            return newSet;
        });
    }
  }, [url, selectedEngines, useMockData, trackUsage]);


  const hasTestResults = Object.keys(testResults).length > 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Header />
        
        <main className="mt-8">
          <div className="flex justify-end mb-4">
             <label className="inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={useMockData}
                    onChange={(e) => setUseMockData(e.target.checked)}
                />
                <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-slate-700">Mock Mode (No Cost)</span>
            </label>
          </div>

          <UrlInputForm
            url={url}
            setUrl={setUrl}
            onSubmit={handleSubmit}
            isLoading={loading || isTesting}
          />
          
          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg shadow-sm" role="alert">
              <p className="font-medium">Oops! Something went wrong.</p>
              <p>{error}</p>
            </div>
          )}
          
          {loading && <LoadingSpinner message={loadingStep} />}
          
          {generationResult && !loading && (
            <div className="mt-12 space-y-8">
               <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <h2 className="text-2xl font-bold text-slate-700 pb-2 border-b-2 border-slate-200 sm:border-b-0">
                  Generated Customer Prompts
                </h2>
                <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                    {isTesting ? (
                        <div className="w-full sm:w-64 flex flex-col gap-2">
                            <ProgressBar current={completedTests} total={allPrompts.length * selectedEngines.size} label="Testing Progress" />
                            <button 
                                onClick={handleStopTests}
                                className="text-xs text-red-600 hover:text-red-800 font-medium self-end hover:underline"
                            >
                                Stop Testing
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={handleRunTests}
                                disabled={isTesting || selectedEngines.size === 0}
                                className="flex items-center justify-center px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-wait transition-all duration-300"
                            >
                            Test All Prompts
                            </button>
                            {estimatedCost > 0 && !useMockData && (
                                <span className="text-xs text-slate-500 font-medium">
                                    Est. Cost: ~${estimatedCost.toFixed(4)}
                                </span>
                            )}
                            {useMockData && (
                                <span className="text-xs text-green-600 font-medium">
                                    Est. Cost: $0.0000 (Mock)
                                </span>
                            )}
                        </>
                    )}
                </div>
               </div>
              
              <EngineSelector 
                selectedEngines={selectedEngines}
                onEngineChange={handleEngineChange}
                disabled={isTesting || loading}
              />
              
              <TestInfo />

              {hasTestResults && <TestResultsSummary results={testResults} />}
              
              <ResultsDisplay 
                results={generationResult.promptsByCategory} 
                testResults={testResults}
                userUrl={url}
                testedEngineIds={Array.from(selectedEngines)}
                onRunSingleTest={handleRunSingleTest}
                testingPrompts={testingPrompts}
                isGlobalTesting={isTesting}
              />
              <LogOutput 
                thinking={generationResult.thinking} 
                sources={generationResult.sources}
              />
            </div>
          )}

          {!loading && !generationResult && !error && (
             <div className="mt-12 text-center text-slate-500 bg-slate-100 p-10 rounded-lg border border-dashed border-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-slate-700">Ready to Generate Prompts</h3>
                <p className="mt-1 text-sm">Enter a URL above to start the analysis.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
