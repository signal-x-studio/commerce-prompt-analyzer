"use client";

import React from "react";
import type { BatchCouncilSummary, CouncilEngineId } from "../../types";

interface BatchVisibilitySummaryProps {
  summary: BatchCouncilSummary;
}

const ENGINE_NAMES: Record<CouncilEngineId, string> = {
  gemini: "Gemini 2.0",
  gpt4o: "GPT-4o",
  claude: "Claude 3.5",
  llama: "Llama 3.1",
};

export const BatchVisibilitySummary: React.FC<BatchVisibilitySummaryProps> = ({
  summary,
}) => {
  const {
    totalPrompts,
    averageVisibilityScore,
    citationRateByEngine,
    sentimentDistribution,
    topPerformingPrompts,
    problemPrompts,
    totalCost,
  } = summary;

  const totalSentiment =
    sentimentDistribution.positive +
    sentimentDistribution.neutral +
    sentimentDistribution.negative;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          Council Mode Summary
        </h3>
        <span className="text-sm text-slate-500">
          {totalPrompts} prompts tested | ${totalCost.toFixed(4)}
        </span>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <div
            className={`text-3xl font-bold ${
              averageVisibilityScore >= 70
                ? "text-green-600"
                : averageVisibilityScore >= 40
                ? "text-yellow-600"
                : "text-red-600"
            }`}
          >
            {Math.round(averageVisibilityScore)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Avg. Visibility Score</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-indigo-600">
            {totalPrompts}
          </div>
          <p className="text-xs text-slate-500 mt-1">Prompts Tested</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {topPerformingPrompts.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">High Visibility</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600">
            {problemPrompts.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Need Attention</p>
        </div>
      </div>

      {/* Citation Rate by Engine */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Citation Rate by AI Model
        </h4>
        <div className="space-y-2">
          {Object.entries(citationRateByEngine).map(([engineId, rate]) => (
            <div key={engineId} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-24">
                {ENGINE_NAMES[engineId as CouncilEngineId]}
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rate >= 70
                      ? "bg-green-500"
                      : rate >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 w-12">
                {Math.round(rate)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          Overall Sentiment Distribution
        </h4>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex h-6 rounded-lg overflow-hidden">
            {sentimentDistribution.positive > 0 && (
              <div
                className="bg-green-500 flex items-center justify-center"
                style={{
                  width: `${(sentimentDistribution.positive / totalSentiment) * 100}%`,
                }}
              >
                <span className="text-xs text-white font-medium">
                  {Math.round(
                    (sentimentDistribution.positive / totalSentiment) * 100
                  )}
                  %
                </span>
              </div>
            )}
            {sentimentDistribution.neutral > 0 && (
              <div
                className="bg-slate-400 flex items-center justify-center"
                style={{
                  width: `${(sentimentDistribution.neutral / totalSentiment) * 100}%`,
                }}
              >
                <span className="text-xs text-white font-medium">
                  {Math.round(
                    (sentimentDistribution.neutral / totalSentiment) * 100
                  )}
                  %
                </span>
              </div>
            )}
            {sentimentDistribution.negative > 0 && (
              <div
                className="bg-red-500 flex items-center justify-center"
                style={{
                  width: `${(sentimentDistribution.negative / totalSentiment) * 100}%`,
                }}
              >
                <span className="text-xs text-white font-medium">
                  {Math.round(
                    (sentimentDistribution.negative / totalSentiment) * 100
                  )}
                  %
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Positive ({sentimentDistribution.positive})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Neutral ({sentimentDistribution.neutral})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Negative ({sentimentDistribution.negative})
          </span>
        </div>
      </div>

      {/* Top Performing Prompts */}
      {topPerformingPrompts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">
            Top Performing Prompts
          </h4>
          <ul className="space-y-1">
            {topPerformingPrompts.slice(0, 5).map((prompt, index) => (
              <li
                key={index}
                className="text-sm text-slate-600 flex items-start gap-2"
              >
                <span className="text-green-500 mt-0.5">+</span>
                <span className="line-clamp-1">{prompt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Problem Prompts */}
      {problemPrompts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">
            Prompts Needing Attention
          </h4>
          <ul className="space-y-1">
            {problemPrompts.slice(0, 5).map((prompt, index) => (
              <li
                key={index}
                className="text-sm text-slate-600 flex items-start gap-2"
              >
                <span className="text-red-500 mt-0.5">!</span>
                <span className="line-clamp-1">{prompt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
