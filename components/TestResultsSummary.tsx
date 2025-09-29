import React, { useMemo } from 'react';
import { TestResult, EngineId, ENGINES } from '../types';

interface TestResultsSummaryProps {
  results: Record<string, Partial<Record<EngineId, TestResult>>>;
}

const EngineScoreBar: React.FC<{engineId: EngineId, score: number, found: number, total: number}> = ({ engineId, score, found, total }) => {
    const engine = ENGINES[engineId];
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 py-3">
             <div className="w-full sm:w-1/3">
                <p className="font-bold text-slate-800">{engine.name}</p>
                <p className="text-sm text-slate-500">{found} of {total} prompts found</p>
             </div>
             <div className="flex items-center gap-4 w-full sm:w-2/3">
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${score}%` }}></div>
                </div>
                <span className="text-xl font-extrabold text-slate-800 w-16 text-right">{score}%</span>
            </div>
        </div>
    );
};


export const TestResultsSummary: React.FC<TestResultsSummaryProps> = ({ results }) => {
  const scoresByEngine = useMemo(() => {
    const engineStats: Partial<Record<EngineId, { found: number; total: number }>> = {};
    
    Object.values(results).forEach(promptResults => {
        Object.entries(promptResults).forEach(([engineId, result]) => {
            if (!result) return;
            const eid = engineId as EngineId;

            if (!engineStats[eid]) {
                engineStats[eid] = { found: 0, total: 0 };
            }
            if (result.status === 'found' || result.status === 'not-found') {
                engineStats[eid]!.total++;
                if (result.status === 'found') {
                    engineStats[eid]!.found++;
                }
            }
        });
    });

    const sortedEngineIds = Object.keys(ENGINES) as EngineId[];

    return sortedEngineIds
        .filter(engineId => engineStats[engineId] && engineStats[engineId]!.total > 0)
        .map(engineId => {
            const stats = engineStats[engineId]!;
            const score = stats.total > 0 ? Math.round((stats.found / stats.total) * 100) : 0;
            return { engineId, score, ...stats };
        });

  }, [results]);

  if (scoresByEngine.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <h3 className="text-xl font-bold text-slate-800 mb-2">Answerability Scores by Engine</h3>
      <div className="divide-y divide-slate-200">
        {scoresByEngine.map(({ engineId, score, found, total }) => (
            <EngineScoreBar key={engineId} engineId={engineId} score={score} found={found} total={total} />
        ))}
      </div>
    </div>
  );
};
