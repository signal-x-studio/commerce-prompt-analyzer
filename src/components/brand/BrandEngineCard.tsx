"use client";

import React, { useMemo, useState } from "react";
import {
  COUNCIL_ENGINES,
  type CouncilEngineId,
  type CouncilEngineResponse,
} from "../../types";
import { extractBrandMention } from "../../lib/council/brand-visibility";

interface BrandEngineCardProps {
  engineId: CouncilEngineId;
  status: "pending" | "loading" | "complete" | "error";
  response?: Partial<CouncilEngineResponse>;
  brandUrl: string;
  brandName?: string;
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

const SENTIMENT_STYLES = {
  positive: {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  negative: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  neutral: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

export const BrandEngineCard: React.FC<BrandEngineCardProps> = ({
  engineId,
  status,
  response,
  brandUrl,
  brandName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const engine = COUNCIL_ENGINES[engineId];
  const colors = ENGINE_COLORS[engineId];

  // Calculate brand mention data when response is complete
  const brandMention = useMemo(() => {
    if (status !== "complete" || !response?.content) return null;
    return extractBrandMention(engineId, response.content, brandUrl, brandName);
  }, [status, response?.content, engineId, brandUrl, brandName]);

  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-300
        ${brandMention?.found ? `${colors.accent} ring-2 ring-green-400` : "border-slate-200"}
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
          {status === "complete" && brandMention && (
            <div className="flex items-center gap-2">
              {brandMention.found ? (
                <span className="px-2 py-1 bg-green-400 text-green-900 rounded-full text-xs font-bold">
                  CITED
                </span>
              ) : (
                <span className="px-2 py-1 bg-red-400 text-red-900 rounded-full text-xs font-bold">
                  NOT CITED
                </span>
              )}
            </div>
          )}
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
            Querying AI model...
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
            Failed to query model
          </div>
        )}

        {status === "complete" && response && brandMention && (
          <div className="space-y-3">
            {/* Sentiment & Confidence */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  SENTIMENT_STYLES[brandMention.sentiment].bg
                }`}
              >
                <svg
                  className={`w-4 h-4 ${SENTIMENT_STYLES[brandMention.sentiment].text}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={SENTIMENT_STYLES[brandMention.sentiment].icon}
                  />
                </svg>
                <span
                  className={`text-xs font-medium capitalize ${
                    SENTIMENT_STYLES[brandMention.sentiment].text
                  }`}
                >
                  {brandMention.sentiment}
                </span>
              </div>

              {brandMention.rank && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                  Rank #{brandMention.rank}
                </span>
              )}

              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                {Math.round(brandMention.confidence * 100)}% confidence
              </span>
            </div>

            {/* Mention Context */}
            {brandMention.found && brandMention.mentionContext && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Mention context:</p>
                <p className="text-sm text-slate-700 italic">
                  &quot;...{brandMention.mentionContext}...&quot;
                </p>
              </div>
            )}

            {/* Full Response (Expandable) */}
            <div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-1"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {isExpanded ? "Hide full response" : "Show full response"}
              </button>
              <div
                className={`bg-slate-50 rounded-lg border border-slate-100 overflow-hidden transition-all duration-300 ${
                  isExpanded ? "max-h-96 overflow-y-auto" : "max-h-20"
                }`}
              >
                <p className={`text-sm text-slate-600 p-3 whitespace-pre-wrap ${!isExpanded ? "line-clamp-3" : ""}`}>
                  {response.content}
                </p>
              </div>
            </div>

            {/* Metadata */}
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
