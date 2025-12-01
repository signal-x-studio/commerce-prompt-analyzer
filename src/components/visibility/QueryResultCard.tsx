"use client";

import React, { useState } from "react";
import {
  LLM_MODELS,
  type LLMModelId,
  type ModelVisibilityResult,
  type CompetitorMention,
} from "../../types";

interface QueryResultCardProps {
  queryId: string;
  queryText: string;
  modelResults: Record<string, ModelVisibilityResult>;
  citationRate: number;
  modelsFound: number;
  modelsTotal: number;
  brandName?: string;
}

export function QueryResultCard({
  queryId,
  queryText,
  modelResults,
  citationRate,
  modelsFound,
  modelsTotal,
  brandName,
}: QueryResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  // Get all competitors mentioned across all models
  const allCompetitors = Object.values(modelResults)
    .flatMap((r) => r.competitorsMentioned || [])
    .reduce((acc, comp) => {
      const existing = acc.find(
        (c) => c.name.toLowerCase() === comp.name.toLowerCase()
      );
      if (!existing) {
        acc.push(comp);
      }
      return acc;
    }, [] as CompetitorMention[]);

  const getStatusColor = (rate: number) => {
    if (rate >= 50) return "bg-green-100 text-green-700 border-green-200";
    if (rate > 0) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const selectedModelResult = selectedModel
    ? modelResults[selectedModel]
    : null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Collapsed Header */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {queryText}
            </p>
            {allCompetitors.length > 0 && !isExpanded && (
              <p className="text-xs text-slate-500 mt-1">
                Competitors mentioned: {allCompetitors.slice(0, 3).map((c) => c.name).join(", ")}
                {allCompetitors.length > 3 && ` +${allCompetitors.length - 3} more`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                citationRate
              )}`}
            >
              {modelsFound}/{modelsTotal} found
            </span>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
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
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200">
          {/* Model Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
            {Object.entries(modelResults).map(([modelId, result]) => {
              const model = LLM_MODELS[modelId as LLMModelId];
              return (
                <button
                  key={modelId}
                  onClick={() =>
                    setSelectedModel(selectedModel === modelId ? null : modelId)
                  }
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    selectedModel === modelId
                      ? "border-indigo-500 text-indigo-600 bg-white"
                      : "border-transparent text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      result.found ? "bg-green-500" : "bg-red-400"
                    }`}
                  />
                  {model?.name || modelId}
                </button>
              );
            })}
          </div>

          {/* Selected Model Details */}
          {selectedModelResult && (
            <div className="p-4 space-y-4">
              {/* Detection Status */}
              <div className="flex items-center gap-4">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedModelResult.found
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedModelResult.found ? "Brand Found" : "Not Found"}
                </div>
                {selectedModelResult.sentiment && (
                  <div
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedModelResult.sentiment === "positive"
                        ? "bg-green-50 text-green-600"
                        : selectedModelResult.sentiment === "negative"
                        ? "bg-red-50 text-red-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {selectedModelResult.sentiment} sentiment
                  </div>
                )}
                <div className="text-xs text-slate-500">
                  {selectedModelResult.detectionMethod} detection •{" "}
                  {Math.round(selectedModelResult.confidence * 100)}% confidence
                </div>
              </div>

              {/* Detection Details */}
              {selectedModelResult.detectionDetails && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Detection Details
                  </h4>
                  <div className="text-sm text-slate-700">
                    <p>
                      <span className="text-slate-500">Searched for:</span>{" "}
                      {selectedModelResult.detectionDetails.searchedFor
                        .slice(0, 5)
                        .map((term, i) => (
                          <span
                            key={i}
                            className={`inline-block px-2 py-0.5 rounded text-xs mr-1 mb-1 ${
                              term ===
                              selectedModelResult.detectionDetails?.matchedTerm
                                ? "bg-green-200 text-green-800 font-medium"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {term}
                          </span>
                        ))}
                      {selectedModelResult.detectionDetails.searchedFor.length >
                        5 && (
                        <span className="text-xs text-slate-400">
                          +
                          {selectedModelResult.detectionDetails.searchedFor
                            .length - 5}{" "}
                          more
                        </span>
                      )}
                    </p>
                    {selectedModelResult.detectionDetails.matchedTerm && (
                      <p className="mt-1 text-green-700">
                        ✓ Matched: "
                        {selectedModelResult.detectionDetails.matchedTerm}" in{" "}
                        {selectedModelResult.detectionDetails.matchLocation}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Mention Context */}
              {selectedModelResult.mentionContext && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2">
                    Mention Context
                  </h4>
                  <p className="text-sm text-green-800 italic">
                    "...{selectedModelResult.mentionContext}..."
                  </p>
                </div>
              )}

              {/* Competitors Mentioned */}
              {selectedModelResult.competitorsMentioned &&
                selectedModelResult.competitorsMentioned.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
                      Competitors Mentioned ({selectedModelResult.competitorsMentioned.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedModelResult.competitorsMentioned.map(
                        (comp, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                              comp.sentiment === "positive"
                                ? "bg-green-100 text-green-700"
                                : comp.sentiment === "negative"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {comp.name}
                            {comp.url && (
                              <span className="ml-1 text-slate-400">
                                ({comp.url})
                              </span>
                            )}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Sources (for grounded) */}
              {selectedModelResult.sources &&
                selectedModelResult.sources.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">
                      Cited Sources ({selectedModelResult.sources.length})
                    </h4>
                    <ul className="space-y-1">
                      {selectedModelResult.sources.map((source, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-blue-600 font-medium">
                            #{source.rank || i + 1}
                          </span>{" "}
                          <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline"
                          >
                            {source.title || source.uri}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Full Response */}
              {selectedModelResult.responseText && (
                <div>
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Full Response
                  </h4>
                  <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-slate-100 whitespace-pre-wrap font-mono">
                      <HighlightedResponse
                        text={selectedModelResult.responseText}
                        brandTerms={
                          selectedModelResult.detectionDetails?.searchedFor ||
                          []
                        }
                        competitors={
                          selectedModelResult.competitorsMentioned?.map(
                            (c) => c.name
                          ) || []
                        }
                      />
                    </pre>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
                {selectedModelResult.latencyMs && (
                  <span>{selectedModelResult.latencyMs}ms</span>
                )}
                {selectedModelResult.cost && (
                  <span>${selectedModelResult.cost.toFixed(4)}</span>
                )}
                {selectedModelResult.tokenCount && (
                  <span>
                    {selectedModelResult.tokenCount.total} tokens
                  </span>
                )}
              </div>
            </div>
          )}

          {/* No model selected prompt */}
          {!selectedModel && (
            <div className="p-6 text-center text-slate-500">
              <p>Click on a model tab above to see detailed results</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component to highlight brand mentions and competitors
function HighlightedResponse({
  text,
  brandTerms,
  competitors,
}: {
  text: string;
  brandTerms: string[];
  competitors: string[];
}) {
  if (!text) return null;

  // Create regex pattern for all terms
  const allTerms = [...brandTerms, ...competitors].filter(Boolean);
  if (allTerms.length === 0) return <>{text}</>;

  const pattern = new RegExp(
    `(${allTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );

  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        const isBrand = brandTerms.some(
          (t) => t.toLowerCase() === lowerPart
        );
        const isCompetitor = competitors.some(
          (t) => t.toLowerCase() === lowerPart
        );

        if (isBrand) {
          return (
            <span key={i} className="bg-green-500 text-green-100 px-1 rounded">
              {part}
            </span>
          );
        }
        if (isCompetitor) {
          return (
            <span key={i} className="bg-amber-500 text-amber-100 px-1 rounded">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
