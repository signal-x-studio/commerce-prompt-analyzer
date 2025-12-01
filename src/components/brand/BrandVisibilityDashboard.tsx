"use client";

import React from "react";
import type { BrandVisibilityResult, CouncilEngineId } from "../../types";

interface BrandVisibilityDashboardProps {
  result: BrandVisibilityResult;
}

const CONSENSUS_COLORS = {
  strong: { bg: "bg-green-100", text: "text-green-700", label: "Strong Agreement" },
  moderate: { bg: "bg-blue-100", text: "text-blue-700", label: "Moderate Agreement" },
  weak: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Weak Agreement" },
  none: { bg: "bg-red-100", text: "text-red-700", label: "No Agreement" },
};

const ENGINE_NAMES: Record<CouncilEngineId, string> = {
  gemini: "Gemini 2.0",
  gpt4o: "GPT-4o",
  claude: "Claude 3.5",
  llama: "Llama 3.1",
};

export const BrandVisibilityDashboard: React.FC<BrandVisibilityDashboardProps> = ({
  result,
}) => {
  const { score, mentions, recommendations, query, brandUrl, totalCost } = result;
  const consensus = CONSENSUS_COLORS[score.consensusLevel];

  // Calculate citation stats
  const citedEngines = mentions.filter((m) => m.found);
  const positiveCount = mentions.filter((m) => m.sentiment === "positive").length;
  const negativeCount = mentions.filter((m) => m.sentiment === "negative").length;
  const neutralCount = mentions.filter((m) => m.sentiment === "neutral").length;

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Visibility Score
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Overall Score */}
          <div className="text-center">
            <div
              className={`
                inline-flex items-center justify-center w-24 h-24 rounded-full
                ${
                  score.overall >= 70
                    ? "bg-green-100"
                    : score.overall >= 40
                    ? "bg-yellow-100"
                    : "bg-red-100"
                }
              `}
            >
              <span
                className={`
                  text-3xl font-bold
                  ${
                    score.overall >= 70
                      ? "text-green-700"
                      : score.overall >= 40
                      ? "text-yellow-700"
                      : "text-red-700"
                  }
                `}
              >
                {score.overall}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-600">Overall Score</p>
          </div>

          {/* Citation Rate */}
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600">
              {Math.round(score.citationRate)}%
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {citedEngines.length}/{mentions.length} Models Cited
            </p>
            <p className="text-xs text-slate-400">Citation Rate</p>
          </div>

          {/* Sentiment */}
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-1">
              <span className="text-green-600 font-semibold">{positiveCount}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-500 font-semibold">{neutralCount}</span>
              <span className="text-slate-400">/</span>
              <span className="text-red-600 font-semibold">{negativeCount}</span>
            </div>
            <div className="flex justify-center gap-1">
              <div
                className="h-2 bg-green-500 rounded-l"
                style={{
                  width: `${(positiveCount / mentions.length) * 60}px`,
                }}
              />
              <div
                className="h-2 bg-slate-400"
                style={{
                  width: `${(neutralCount / mentions.length) * 60}px`,
                }}
              />
              <div
                className="h-2 bg-red-500 rounded-r"
                style={{
                  width: `${(negativeCount / mentions.length) * 60}px`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Positive / Neutral / Negative
            </p>
          </div>

          {/* Consensus */}
          <div className="text-center">
            <div
              className={`inline-block px-4 py-2 rounded-lg ${consensus.bg} ${consensus.text}`}
            >
              <span className="font-semibold">{consensus.label}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">AI Model Consensus</p>
          </div>
        </div>

        {/* Average Rank */}
        {score.averageRank !== null && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Average Recommendation Position:{" "}
              <span className="font-bold text-indigo-600">
                #{score.averageRank.toFixed(1)}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Model Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Citation Breakdown by Model
        </h3>

        <div className="space-y-3">
          {mentions.map((mention) => (
            <div
              key={mention.engineId}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    mention.found ? "bg-green-500" : "bg-red-400"
                  }`}
                />
                <span className="font-medium text-slate-700">
                  {ENGINE_NAMES[mention.engineId]}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    mention.found
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {mention.found ? "Cited" : "Not Cited"}
                </span>

                <span
                  className={`px-2 py-1 rounded text-xs capitalize ${
                    mention.sentiment === "positive"
                      ? "bg-green-100 text-green-700"
                      : mention.sentiment === "negative"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {mention.sentiment}
                </span>

                {mention.rank && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                    #{mention.rank}
                  </span>
                )}

                <span className="text-xs text-slate-500">
                  {Math.round(mention.confidence * 100)}% conf.
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Recommendations
          </h3>

          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-slate-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Query Details */}
      <div className="bg-slate-100 rounded-xl p-4 text-sm text-slate-600">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="font-medium">Query:</span>{" "}
            <span className="italic">&quot;{query}&quot;</span>
          </div>
          <div>
            <span className="font-medium">Brand URL:</span> {brandUrl}
          </div>
          <div>
            <span className="font-medium">Cost:</span> ${totalCost.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
};
