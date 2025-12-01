"use client";

import React, { useState } from "react";
import { COUNCIL_ENGINES, type CouncilEngineId, type CouncilEngineResponse } from "../../types";

interface EngineComparisonTabsProps {
  engineResponses: Partial<Record<CouncilEngineId, CouncilEngineResponse>>;
  rankings?: Array<{ engineId: CouncilEngineId; finalRank: number }>;
  winner?: CouncilEngineId;
}

const ENGINE_TAB_COLORS: Record<CouncilEngineId, { active: string; inactive: string }> = {
  gemini: {
    active: "bg-blue-500 text-white",
    inactive: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  gpt4o: {
    active: "bg-green-500 text-white",
    inactive: "bg-green-50 text-green-700 hover:bg-green-100",
  },
  claude: {
    active: "bg-orange-500 text-white",
    inactive: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
  llama: {
    active: "bg-purple-500 text-white",
    inactive: "bg-purple-50 text-purple-700 hover:bg-purple-100",
  },
};

export const EngineComparisonTabs: React.FC<EngineComparisonTabsProps> = ({
  engineResponses,
  rankings,
  winner,
}) => {
  const engines = Object.keys(engineResponses) as CouncilEngineId[];
  const [activeTab, setActiveTab] = useState<CouncilEngineId | null>(
    winner || engines[0] || null
  );

  if (engines.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-500 text-center">No engine responses available</p>
      </div>
    );
  }

  const activeResponse = activeTab ? engineResponses[activeTab] : null;
  const activeEngine = activeTab ? COUNCIL_ENGINES[activeTab] : null;
  const activeRank = rankings?.find((r) => r.engineId === activeTab)?.finalRank;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {engines.map((engineId) => {
          const engine = COUNCIL_ENGINES[engineId];
          const isActive = activeTab === engineId;
          const isWinner = winner === engineId;
          const rank = rankings?.find((r) => r.engineId === engineId)?.finalRank;
          const colors = ENGINE_TAB_COLORS[engineId];

          return (
            <button
              key={engineId}
              onClick={() => setActiveTab(engineId)}
              className={`
                relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                whitespace-nowrap flex-shrink-0
                ${isActive ? colors.active : colors.inactive}
              `}
            >
              {isWinner && (
                <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              <span>{engine.name}</span>
              {rank && (
                <span
                  className={`
                    px-1.5 py-0.5 text-xs rounded font-bold
                    ${isActive ? "bg-white/20" : "bg-slate-200"}
                  `}
                >
                  #{rank}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeResponse && activeEngine && (
        <div className="p-6">
          {/* Response Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-slate-800">{activeEngine.name}</h4>
              <span className="text-sm text-slate-500">({activeEngine.provider})</span>
              {activeRank === 1 && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                  Winner
                </span>
              )}
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {activeResponse.tokenCount && (
                <span>
                  <span className="font-medium text-slate-700">
                    {activeResponse.tokenCount.total}
                  </span>{" "}
                  tokens
                </span>
              )}
              {activeResponse.latencyMs && (
                <span>
                  <span className="font-medium text-slate-700">
                    {(activeResponse.latencyMs / 1000).toFixed(1)}s
                  </span>{" "}
                  latency
                </span>
              )}
              {activeResponse.cost !== undefined && (
                <span>
                  <span className="font-medium text-slate-700">
                    ${activeResponse.cost.toFixed(4)}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Response Content */}
          <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {activeResponse.content}
            </p>
          </div>

          {/* Sentiment & Visibility */}
          {(activeResponse.sentiment || activeResponse.found !== undefined) && (
            <div className="mt-4 flex items-center gap-4">
              {activeResponse.found !== undefined && (
                <div
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                    ${activeResponse.found
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-600"
                    }
                  `}
                >
                  {activeResponse.found ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Domain Found
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Not Mentioned
                    </>
                  )}
                </div>
              )}

              {activeResponse.sentiment && (
                <div
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium
                    ${activeResponse.sentiment === "positive"
                      ? "bg-green-100 text-green-800"
                      : activeResponse.sentiment === "negative"
                        ? "bg-red-100 text-red-800"
                        : "bg-slate-100 text-slate-600"
                    }
                  `}
                >
                  {activeResponse.sentiment.charAt(0).toUpperCase() +
                    activeResponse.sentiment.slice(1)}{" "}
                  Sentiment
                </div>
              )}

              {activeResponse.rank && (
                <div className="px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  Position #{activeResponse.rank}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
