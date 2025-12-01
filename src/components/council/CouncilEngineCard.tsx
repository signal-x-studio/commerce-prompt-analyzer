"use client";

import React from "react";
import { COUNCIL_ENGINES, type CouncilEngineId, type CouncilEngineResponse } from "../../types";

interface CouncilEngineCardProps {
  engineId: CouncilEngineId;
  status: "pending" | "loading" | "complete" | "error";
  response?: Partial<CouncilEngineResponse>;
  rank?: number;
  isWinner?: boolean;
}

const ENGINE_COLORS: Record<CouncilEngineId, { gradient: string; accent: string }> = {
  gemini: {
    gradient: "from-blue-500 to-blue-600",
    accent: "border-blue-400",
  },
  gpt4o: {
    gradient: "from-green-500 to-green-600",
    accent: "border-green-400",
  },
  claude: {
    gradient: "from-orange-500 to-orange-600",
    accent: "border-orange-400",
  },
  llama: {
    gradient: "from-purple-500 to-purple-600",
    accent: "border-purple-400",
  },
};

const RANK_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "1st", color: "bg-yellow-400 text-yellow-900" },
  2: { label: "2nd", color: "bg-slate-300 text-slate-700" },
  3: { label: "3rd", color: "bg-orange-300 text-orange-800" },
  4: { label: "4th", color: "bg-slate-200 text-slate-600" },
};

export const CouncilEngineCard: React.FC<CouncilEngineCardProps> = ({
  engineId,
  status,
  response,
  rank,
  isWinner,
}) => {
  const engine = COUNCIL_ENGINES[engineId];
  const colors = ENGINE_COLORS[engineId];

  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-300
        ${isWinner ? `${colors.accent} ring-2 ring-yellow-400` : "border-slate-200"}
        ${status === "loading" ? "animate-pulse" : ""}
      `}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} px-4 py-3 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">{engine.name}</h4>
            <p className="text-xs opacity-80">{engine.provider}</p>
          </div>
          <div className="flex items-center gap-2">
            {rank && (
              <span
                className={`
                  px-2 py-1 rounded-full text-xs font-bold
                  ${RANK_LABELS[rank]?.color || "bg-slate-200 text-slate-600"}
                `}
              >
                {RANK_LABELS[rank]?.label || `#${rank}`}
              </span>
            )}
            {isWinner && (
              <svg className="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {status === "pending" && (
          <div className="text-slate-400 text-sm italic">Waiting to start...</div>
        )}

        {status === "loading" && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating response...
          </div>
        )}

        {status === "error" && (
          <div className="text-red-600 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Failed to generate response
          </div>
        )}

        {status === "complete" && response && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700 line-clamp-4">
              {response.content}
            </p>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {response.tokenCount && (
                <span className="px-2 py-1 bg-slate-100 rounded">
                  {response.tokenCount.total} tokens
                </span>
              )}
              {response.latencyMs && (
                <span className="px-2 py-1 bg-slate-100 rounded">
                  {(response.latencyMs / 1000).toFixed(1)}s
                </span>
              )}
              {response.cost !== undefined && (
                <span className="px-2 py-1 bg-slate-100 rounded">
                  ${response.cost.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
