"use client";

import React, { useState } from "react";
import { COUNCIL_ENGINES, type CouncilEngineId, type CouncilRanking } from "../../types";

interface JudgeEvaluationPanelProps {
  judgeEngine: CouncilEngineId;
  rankings: CouncilRanking[];
  reasoning?: string;
  showDeAnonymization?: boolean;
}

const CRITERIA = [
  { id: "accuracy", label: "Accuracy", description: "Factual correctness and relevance" },
  { id: "helpfulness", label: "Helpfulness", description: "How well it addresses user intent" },
  { id: "visibility", label: "E-commerce Visibility", description: "Natural domain mentions" },
  { id: "clarity", label: "Clarity", description: "Structure and readability" },
  { id: "completeness", label: "Completeness", description: "Coverage of query aspects" },
];

export const JudgeEvaluationPanel: React.FC<JudgeEvaluationPanelProps> = ({
  judgeEngine,
  rankings,
  reasoning,
  showDeAnonymization = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showIdentities, setShowIdentities] = useState(false);

  const judge = COUNCIL_ENGINES[judgeEngine];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900">Judge Evaluation</h3>
              <p className="text-sm text-amber-700">Evaluated by {judge.name}</p>
            </div>
          </div>

          {showDeAnonymization && (
            <button
              onClick={() => setShowIdentities(!showIdentities)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${showIdentities
                  ? "bg-amber-200 text-amber-800"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }
              `}
            >
              {showIdentities ? "Hide Identities" : "Reveal Identities"}
            </button>
          )}
        </div>
      </div>

      {/* Rankings Summary */}
      <div className="p-6 space-y-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Final Rankings
        </h4>

        <div className="space-y-2">
          {rankings
            .sort((a, b) => a.finalRank - b.finalRank)
            .map((ranking, index) => {
              const engine = COUNCIL_ENGINES[ranking.engineId];
              const isFirst = ranking.finalRank === 1;

              return (
                <div
                  key={ranking.engineId}
                  className={`
                    flex items-center justify-between p-3 rounded-lg
                    ${isFirst ? "bg-yellow-50 border border-yellow-200" : "bg-slate-50"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${isFirst ? "bg-yellow-400 text-yellow-900" : "bg-slate-300 text-slate-700"}
                      `}
                    >
                      {ranking.finalRank}
                    </span>
                    <div>
                      {showIdentities ? (
                        <span className="font-medium text-slate-900">{engine.name}</span>
                      ) : (
                        <span className="font-medium text-slate-900">
                          Response {String.fromCharCode(64 + ranking.finalRank)}
                        </span>
                      )}
                      {showIdentities && (
                        <span className="ml-2 text-xs text-slate-500">({engine.provider})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-slate-600">
                      Avg: <span className="font-medium">{ranking.averageRank.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`
                            h-full rounded-full
                            ${ranking.agreementScore >= 0.7 ? "bg-green-500" : ranking.agreementScore >= 0.4 ? "bg-yellow-500" : "bg-red-500"}
                          `}
                          style={{ width: `${ranking.agreementScore * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8">
                        {Math.round(ranking.agreementScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Evaluation Criteria (collapsed by default) */}
      {reasoning && (
        <div className="border-t border-slate-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-6 py-3 flex items-center justify-between text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm font-medium">Judge's Reasoning</span>
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isExpanded && (
            <div className="px-6 pb-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{reasoning}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evaluation Criteria Legend */}
      <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Evaluation Criteria
        </h5>
        <div className="flex flex-wrap gap-2">
          {CRITERIA.map((criterion) => (
            <span
              key={criterion.id}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600"
              title={criterion.description}
            >
              {criterion.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
