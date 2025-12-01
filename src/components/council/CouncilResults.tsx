"use client";

import React, { useState } from "react";
import { COUNCIL_ENGINES, type CouncilEngineId, type CouncilEngineResponse, type CouncilRanking } from "../../types";

interface CouncilResultsProps {
  rankings?: CouncilRanking[];
  winner?: CouncilEngineId;
  synthesizedContent?: string;
  engineResponses: Partial<Record<CouncilEngineId, CouncilEngineResponse>>;
  totalCost: number;
}

export const CouncilResults: React.FC<CouncilResultsProps> = ({
  rankings,
  winner,
  synthesizedContent,
  engineResponses,
  totalCost,
}) => {
  const [expandedResponse, setExpandedResponse] = useState<CouncilEngineId | null>(null);

  return (
    <div className="space-y-6">
      {/* Winner Announcement */}
      {winner && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-yellow-900">Council Winner</h3>
              <p className="text-2xl font-extrabold text-yellow-800">
                {COUNCIL_ENGINES[winner].name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      {rankings && rankings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Rankings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Agreement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rankings
                  .sort((a, b) => a.finalRank - b.finalRank)
                  .map((ranking) => {
                    const engine = COUNCIL_ENGINES[ranking.engineId];
                    const isWinner = ranking.finalRank === 1;

                    return (
                      <tr
                        key={ranking.engineId}
                        className={isWinner ? "bg-yellow-50" : ""}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`
                              inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                              ${isWinner ? "bg-yellow-400 text-yellow-900" : "bg-slate-200 text-slate-600"}
                            `}
                          >
                            {ranking.finalRank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{engine.name}</div>
                          <div className="text-sm text-slate-500">{engine.provider}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-slate-900 font-medium">
                            {ranking.averageRank.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full max-w-[100px]">
                              <div
                                className={`
                                  h-full rounded-full
                                  ${ranking.agreementScore >= 0.7 ? "bg-green-500" : ranking.agreementScore >= 0.4 ? "bg-yellow-500" : "bg-red-500"}
                                `}
                                style={{ width: `${ranking.agreementScore * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-600">
                              {Math.round(ranking.agreementScore * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setExpandedResponse(
                                expandedResponse === ranking.engineId ? null : ranking.engineId
                              )
                            }
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            {expandedResponse === ranking.engineId ? "Hide" : "View"} Response
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expanded Response */}
      {expandedResponse && engineResponses[expandedResponse] && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {COUNCIL_ENGINES[expandedResponse].name} Response
            </h3>
            <button
              onClick={() => setExpandedResponse(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="prose prose-slate max-w-none">
            <p className="whitespace-pre-wrap text-slate-700">
              {engineResponses[expandedResponse]?.content}
            </p>
          </div>
        </div>
      )}

      {/* Synthesized Response */}
      {synthesizedContent && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-900">Synthesized Response</h3>
              <p className="text-sm text-indigo-700">Optimal answer combining the best elements</p>
            </div>
          </div>
          <div className="prose prose-indigo max-w-none">
            <p className="whitespace-pre-wrap text-indigo-900">{synthesizedContent}</p>
          </div>
        </div>
      )}

      {/* Cost Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Total Session Cost</span>
          <span className="text-lg font-bold text-slate-900">${totalCost.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};
