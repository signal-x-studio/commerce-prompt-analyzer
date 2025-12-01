"use client";

import React from "react";
import { COUNCIL_ENGINES, type CouncilEngineId, type CouncilRanking } from "../../types";

interface AggregateRankingChartProps {
  rankings: CouncilRanking[];
  winner?: CouncilEngineId;
}

const ENGINE_COLORS: Record<CouncilEngineId, string> = {
  gemini: "bg-blue-500",
  gpt4o: "bg-green-500",
  claude: "bg-orange-500",
  llama: "bg-purple-500",
};

export const AggregateRankingChart: React.FC<AggregateRankingChartProps> = ({
  rankings,
  winner,
}) => {
  // Sort by final rank (ascending = best first)
  const sortedRankings = [...rankings].sort((a, b) => a.finalRank - b.finalRank);

  // Calculate the max rank for scaling
  const maxRank = Math.max(...rankings.map((r) => r.averageRank), 4);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Performance Ranking</h3>
        <span className="text-sm text-slate-500">Lower is better</span>
      </div>

      {/* Bar Chart */}
      <div className="space-y-4">
        {sortedRankings.map((ranking) => {
          const engine = COUNCIL_ENGINES[ranking.engineId];
          const barWidth = (ranking.averageRank / maxRank) * 100;
          const isWinner = ranking.engineId === winner;

          return (
            <div key={ranking.engineId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`
                      w-6 h-6 rounded flex items-center justify-center text-xs font-bold
                      ${isWinner ? "bg-yellow-400 text-yellow-900" : "bg-slate-200 text-slate-600"}
                    `}
                  >
                    {ranking.finalRank}
                  </span>
                  <span className="font-medium text-slate-900">{engine.name}</span>
                  {isWinner && (
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </div>
                <span className="text-slate-600 font-mono">
                  {ranking.averageRank.toFixed(2)}
                </span>
              </div>

              {/* Bar */}
              <div className="h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                <div
                  className={`
                    h-full rounded-lg transition-all duration-500 ease-out
                    ${ENGINE_COLORS[ranking.engineId]}
                    ${isWinner ? "ring-2 ring-yellow-400 ring-offset-1" : ""}
                  `}
                  style={{ width: `${barWidth}%` }}
                />

                {/* Agreement indicator */}
                <div
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"
                >
                  <span className="text-xs text-slate-500">Agreement:</span>
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`
                        h-full rounded-full
                        ${ranking.agreementScore >= 0.7 ? "bg-green-400" : ranking.agreementScore >= 0.4 ? "bg-yellow-400" : "bg-red-400"}
                      `}
                      style={{ width: `${ranking.agreementScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap justify-center gap-4">
          {sortedRankings.map((ranking) => {
            const engine = COUNCIL_ENGINES[ranking.engineId];
            return (
              <div key={ranking.engineId} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${ENGINE_COLORS[ranking.engineId]}`} />
                <span className="text-xs text-slate-600">{engine.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendation */}
      {winner && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Recommendation:</strong> Focus optimization efforts on{" "}
            <span className="font-semibold">{COUNCIL_ENGINES[winner].name}</span> as it
            consistently provides the highest quality responses for your content.
          </p>
        </div>
      )}
    </div>
  );
};
