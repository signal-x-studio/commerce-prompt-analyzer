"use client";

import React from "react";
import type { VisibilityQuery, FunnelStage, UserIntent, ContentType } from "../../types";

interface CoverageAnalysisPanelProps {
  queries: VisibilityQuery[];
  citationRateByQuery?: Record<string, number>;
}

// Labels for display
const FUNNEL_LABELS: Record<FunnelStage, string> = {
  awareness: "Awareness",
  consideration: "Consideration",
  evaluation: "Evaluation",
  purchase: "Purchase",
  "post-purchase": "Post-Purchase",
};

const INTENT_LABELS: Record<UserIntent, string> = {
  learn: "Learn",
  compare: "Compare",
  buy: "Buy",
  explore: "Explore",
  solve: "Solve",
  evaluate: "Evaluate",
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  "how-to": "How-To",
  product: "Product",
  news: "News",
  informational: "Informational",
  comparison: "Comparison",
  review: "Review",
  listicle: "Listicle",
};

export function CoverageAnalysisPanel({
  queries,
  citationRateByQuery = {},
}: CoverageAnalysisPanelProps) {
  // Only show if queries have classification data
  const classifiedQueries = queries.filter((q) => q.funnelStage || q.intent);
  if (classifiedQueries.length === 0) {
    return null;
  }

  // Calculate coverage by funnel stage
  const funnelCoverage = calculateCoverage(
    queries,
    "funnelStage",
    FUNNEL_LABELS,
    citationRateByQuery
  );

  // Calculate coverage by intent
  const intentCoverage = calculateCoverage(
    queries,
    "intent",
    INTENT_LABELS,
    citationRateByQuery
  );

  // Calculate coverage by content type
  const contentTypeCoverage = calculateCoverage(
    queries,
    "contentType",
    CONTENT_TYPE_LABELS,
    citationRateByQuery
  );

  // Find gaps (categories with 0 queries or low citation rates)
  const gaps: { type: string; value: string; recommendation: string }[] = [];

  for (const [stage, data] of Object.entries(funnelCoverage)) {
    if (data.count === 0) {
      gaps.push({
        type: "Funnel Stage",
        value: FUNNEL_LABELS[stage as FunnelStage] || stage,
        recommendation: getGapRecommendation("funnel", stage),
      });
    } else if (data.citationRate < 20 && data.count > 0) {
      gaps.push({
        type: "Funnel Stage",
        value: `${FUNNEL_LABELS[stage as FunnelStage]} (low visibility)`,
        recommendation: `Improve content for ${FUNNEL_LABELS[stage as FunnelStage].toLowerCase()} stage queries`,
      });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Coverage Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Funnel Stage Coverage */}
        <CoverageChart
          title="By Funnel Stage"
          data={funnelCoverage}
          labels={FUNNEL_LABELS}
          color="blue"
        />

        {/* Intent Coverage */}
        <CoverageChart
          title="By User Intent"
          data={intentCoverage}
          labels={INTENT_LABELS}
          color="green"
        />

        {/* Content Type Coverage */}
        <CoverageChart
          title="By Content Type"
          data={contentTypeCoverage}
          labels={CONTENT_TYPE_LABELS}
          color="purple"
        />
      </div>

      {/* Coverage Gaps */}
      {gaps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Coverage Gaps Detected
          </h4>
          <ul className="space-y-2">
            {gaps.slice(0, 5).map((gap, i) => (
              <li key={i} className="text-sm text-amber-700">
                <span className="font-medium">{gap.type}:</span> {gap.value}
                <p className="text-xs text-amber-600 mt-0.5">
                  → {gap.recommendation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Match Score Distribution (if available) */}
      {queries.some((q) => q.matchScore !== undefined) && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">
            Content Match Scores
          </h4>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>
                High ({queries.filter((q) => (q.matchScore || 0) >= 0.6).length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
              <span>
                Medium (
                {
                  queries.filter(
                    (q) => (q.matchScore || 0) >= 0.3 && (q.matchScore || 0) < 0.6
                  ).length
                }
                )
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-400 rounded-full"></span>
              <span>
                Low ({queries.filter((q) => (q.matchScore || 0) < 0.3).length})
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Low match scores indicate queries that your content may not adequately address.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

interface CoverageChartProps {
  title: string;
  data: Record<string, { count: number; citationRate: number }>;
  labels: Record<string, string>;
  color: "blue" | "green" | "purple";
}

function CoverageChart({ title, data, labels, color }: CoverageChartProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
  };

  const entries = Object.entries(data).filter(([key]) => key in labels);
  const maxCount = Math.max(...entries.map(([, d]) => d.count), 1);

  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
        {title}
      </h4>
      <div className="space-y-2">
        {entries.map(([key, { count, citationRate }]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-20 text-xs text-slate-600 truncate">
              {labels[key] || key}
            </div>
            <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${colorClasses[color]} transition-all`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <div className="w-8 text-xs text-slate-500 text-right">{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function calculateCoverage<T extends string>(
  queries: VisibilityQuery[],
  field: "funnelStage" | "intent" | "contentType",
  labels: Record<T, string>,
  citationRates: Record<string, number>
): Record<T, { count: number; citationRate: number }> {
  const result: Record<string, { count: number; citationRate: number }> = {};

  // Initialize all categories
  for (const key of Object.keys(labels)) {
    result[key] = { count: 0, citationRate: 0 };
  }

  // Count queries per category
  for (const query of queries) {
    const value = query[field];
    if (value && value in result) {
      result[value].count++;
      // Add citation rate if available
      const rate = citationRates[query.id];
      if (rate !== undefined) {
        result[value].citationRate =
          (result[value].citationRate * (result[value].count - 1) + rate) /
          result[value].count;
      }
    }
  }

  return result as Record<T, { count: number; citationRate: number }>;
}

function getGapRecommendation(type: string, value: string): string {
  const recommendations: Record<string, Record<string, string>> = {
    funnel: {
      awareness: "Add educational content to attract users discovering your category",
      consideration: "Create comparison guides and feature breakdowns",
      evaluation: "Publish detailed reviews and case studies",
      purchase: "Optimize product pages and add clear CTAs",
      "post-purchase": "Create support content, tutorials, and accessory guides",
    },
    intent: {
      learn: "Create educational blog posts and how-to guides",
      compare: "Build comparison pages between your products and alternatives",
      buy: "Optimize product listings with pricing and availability",
      explore: "Add category pages and curated collections",
      solve: "Create troubleshooting guides and FAQ content",
      evaluate: "Publish detailed specs and customer testimonials",
    },
  };

  return recommendations[type]?.[value] || "Consider adding content for this category";
}
