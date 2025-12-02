"use client";

import React from "react";
import type { AdvancedAnalysisSettings } from "../../types";

interface AdvancedSettingsPanelProps {
  settings: AdvancedAnalysisSettings;
  onSettingsChange: (settings: AdvancedAnalysisSettings) => void;
  disabled?: boolean;
}

export function AdvancedSettingsPanel({
  settings,
  onSettingsChange,
  disabled = false,
}: AdvancedSettingsPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleToggle = (key: keyof AdvancedAnalysisSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <svg
              className="w-5 h-5 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Advanced Analysis (GEO Framework)
            </h3>
            <p className="text-xs text-slate-500">
              {enabledCount > 0
                ? `${enabledCount} feature${enabledCount > 1 ? "s" : ""} enabled`
                : "Enable advanced query & competitor analysis"}
            </p>
          </div>
        </div>
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
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Query Classification */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Query Classification
            </h4>
            <div className="space-y-3">
              <SettingToggle
                label="Intent Classification"
                description="Classify queries by user intent (learn, compare, buy, etc.)"
                checked={settings.enableIntentClassification}
                onChange={() => handleToggle("enableIntentClassification")}
                disabled={disabled}
              />
              <SettingToggle
                label="Funnel Stage Mapping"
                description="Map queries to buyer journey stages (awareness → purchase)"
                checked={settings.enableFunnelStageMapping}
                onChange={() => handleToggle("enableFunnelStageMapping")}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Content Analysis */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Content Analysis
            </h4>
            <div className="space-y-3">
              <SettingToggle
                label="Content-Derived Queries"
                description="Generate queries based on what your content actually covers"
                checked={settings.enableContentDerivedQueries}
                onChange={() => handleToggle("enableContentDerivedQueries")}
                disabled={disabled}
              />
              <SettingToggle
                label="Match Rate Scoring"
                description="Score how well each query matches your brand content"
                checked={settings.enableMatchRateScoring}
                onChange={() => handleToggle("enableMatchRateScoring")}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Competitor Analysis */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Competitor Analysis
            </h4>
            <div className="space-y-3">
              <SettingToggle
                label="Competitor URL Extraction"
                description="Extract competitor URLs from LLM citations"
                checked={settings.enableCompetitorUrlExtraction}
                onChange={() => handleToggle("enableCompetitorUrlExtraction")}
                disabled={disabled}
              />
              <SettingToggle
                label="Competitor Benchmarking"
                description="Compare your visibility against extracted competitors"
                checked={settings.enableCompetitorBenchmarking}
                onChange={() => handleToggle("enableCompetitorBenchmarking")}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Coverage Analysis */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Advanced Metrics
            </h4>
            <div className="space-y-3">
              <SettingToggle
                label="Coverage Analysis"
                description="Identify gaps in funnel stage and intent coverage"
                checked={settings.enableCoverageAnalysis}
                onChange={() => handleToggle("enableCoverageAnalysis")}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            <svg
              className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>
              Advanced features use additional API calls and may increase costs.
              Content-derived queries analyze your actual page content to suggest queries
              you <em>should</em> be cited for based on what you publish.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Setting Toggle Component
// ============================================

interface SettingToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: SettingToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <div
          className={`w-9 h-5 rounded-full transition-colors ${
            checked ? "bg-indigo-600" : "bg-slate-200"
          } ${disabled ? "opacity-50" : ""}`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            disabled ? "text-slate-400" : "text-slate-700"
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </label>
  );
}
