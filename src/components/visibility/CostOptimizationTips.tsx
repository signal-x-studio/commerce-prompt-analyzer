"use client";

import React from "react";
import { LLM_MODELS, type LLMModelId } from "../../types";

interface CostOptimizationTipsProps {
  selectedModels: LLMModelId[];
  queryCount: number;
  estimatedCost: number;
  onApplySuggestion?: (suggestion: string) => void;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  savingsPercent?: number;
  action?: string;
}

export function CostOptimizationTips({
  selectedModels,
  queryCount,
  estimatedCost,
  onApplySuggestion,
}: CostOptimizationTipsProps) {
  const suggestions: Suggestion[] = [];

  // Analyze current configuration and generate suggestions

  // 1. Check for premium models that could be replaced with budget alternatives
  const premiumModels = selectedModels.filter(
    (id) => LLM_MODELS[id]?.costTier === "premium"
  );
  const budgetModels = selectedModels.filter(
    (id) => LLM_MODELS[id]?.costTier === "budget"
  );

  if (premiumModels.length > 1) {
    suggestions.push({
      id: "reduce-premium",
      title: "Reduce premium models",
      description: `You have ${premiumModels.length} premium models selected. Consider the "Quick Check" preset with just 2 budget-friendly models.`,
      impact: "high",
      savingsPercent: 40,
      action: "use-budget-preset",
    });
  }

  // 2. Check if using all models when testing one query would be faster with budget first
  if (queryCount === 1 && selectedModels.length >= 4) {
    suggestions.push({
      id: "smart-single-query",
      title: "Smart single-query testing",
      description:
        "For single query tests, start with 2-3 budget models. Only add premium models if you need higher accuracy.",
      impact: "medium",
      savingsPercent: 50,
    });
  }

  // 3. Check for large test matrices
  const totalTests = queryCount * selectedModels.length;
  if (totalTests > 20) {
    suggestions.push({
      id: "reduce-matrix",
      title: "Large test matrix detected",
      description: `${totalTests} tests is a lot! Consider using "All queries × One model" to verify your queries work, then expand to more models.`,
      impact: "high",
      savingsPercent: Math.round((1 - 1 / selectedModels.length) * 100),
      action: "single-model-mode",
    });
  }

  // 4. Search vs Chat balance
  const searchModels = selectedModels.filter(
    (id) => LLM_MODELS[id]?.platformType === "search"
  );
  const chatModels = selectedModels.filter(
    (id) => LLM_MODELS[id]?.platformType === "chat"
  );

  if (searchModels.length === 0 && chatModels.length > 0) {
    suggestions.push({
      id: "add-search",
      title: "Add a search platform",
      description:
        "You're only testing chat platforms. Search platforms (like Perplexity, Gemini with grounding) show actual citation behavior with sources.",
      impact: "low",
    });
  }

  // 5. Cost-effective model recommendations
  if (budgetModels.length === 0 && selectedModels.length > 0) {
    suggestions.push({
      id: "add-budget",
      title: "Switch to budget models",
      description:
        'Use the "Quick Check" preset (GPT-4o Mini + Gemini Flash) for 10-20x lower cost with similar accuracy.',
      impact: "high",
      savingsPercent: 60,
      action: "use-budget-preset",
    });
  }

  // 6. Estimated cost warning
  if (estimatedCost > 0.10) {
    suggestions.push({
      id: "high-cost",
      title: "Consider mock mode first",
      description:
        "Use Mock Mode to verify your test setup works correctly before running real API calls. This costs nothing and helps catch issues early.",
      impact: "medium",
    });
  }

  if (suggestions.length === 0) {
    return null;
  }

  const impactColors = {
    high: "border-green-200 bg-green-50",
    medium: "border-blue-200 bg-blue-50",
    low: "border-slate-200 bg-slate-50",
  };

  const impactBadgeColors = {
    high: "bg-green-100 text-green-700",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <svg
          className="w-4 h-4 text-indigo-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span className="font-medium">Cost Optimization Suggestions</span>
      </div>

      <div className="space-y-2">
        {suggestions.slice(0, 3).map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-3 rounded-lg border ${impactColors[suggestion.impact]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-slate-800">
                    {suggestion.title}
                  </h4>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      impactBadgeColors[suggestion.impact]
                    }`}
                  >
                    {suggestion.impact} impact
                  </span>
                  {suggestion.savingsPercent && (
                    <span className="text-xs text-green-600 font-medium">
                      ~{suggestion.savingsPercent}% savings
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{suggestion.description}</p>
              </div>
              {suggestion.action && onApplySuggestion && (
                <button
                  onClick={() => onApplySuggestion(suggestion.action!)}
                  className="text-xs px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 whitespace-nowrap"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 3 && (
        <p className="text-xs text-slate-500">
          +{suggestions.length - 3} more suggestions available
        </p>
      )}
    </div>
  );
}
