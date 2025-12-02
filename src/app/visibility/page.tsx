"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  LLM_MODELS,
  MODEL_PRESETS,
  type LLMModelId,
  type ModelPreset,
  type ExecutionMode,
} from "../../types";
import { useQueryDiscovery } from "../../hooks/useQueryDiscovery";
import { useVisibilityTest } from "../../hooks/useVisibilityTest";
import { useCost } from "../../context/CostContext";
import { CostDisplay } from "../../components/CostDisplay";
import { QueryResultCard } from "../../components/visibility/QueryResultCard";
import { CostOptimizationTips } from "../../components/visibility/CostOptimizationTips";
import { ApiKeyWarning } from "../../components/visibility/ApiKeyWarning";

// ============================================
// Main Page Component
// ============================================

export default function VisibilityPage() {
  // Section 1: Brand Info
  const [brandUrl, setBrandUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");

  // Section 2: Queries
  const queryDiscovery = useQueryDiscovery();

  // Section 3: Models
  const [modelPreset, setModelPreset] = useState<ModelPreset>("balanced");
  const [selectedModels, setSelectedModels] = useState<LLMModelId[]>(
    MODEL_PRESETS.balanced.models
  );

  // Section 4: Execution
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("all-queries-all-models");
  const [selectedModelForExecution, setSelectedModelForExecution] = useState<LLMModelId | null>(null);
  const [selectedQueryForExecution, setSelectedQueryForExecution] = useState<string | null>(null);
  const [useMockMode, setUseMockMode] = useState(false);

  // Budget tracking
  const { wouldExceedBudget, budgetLimit, budgetRemaining, budgetStatus } = useCost();

  // Visibility Test
  const visibilityTest = useVisibilityTest({
    onComplete: (state) => {
      console.log("Test complete:", state);
    },
    onError: (error) => {
      console.error("Test error:", error);
    },
  });

  // ============================================
  // Handlers
  // ============================================

  const handlePresetChange = useCallback((preset: ModelPreset) => {
    setModelPreset(preset);
    if (preset !== "custom") {
      setSelectedModels(MODEL_PRESETS[preset].models);
    }
  }, []);

  const handleModelToggle = useCallback((modelId: LLMModelId) => {
    setModelPreset("custom");
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((m) => m !== modelId);
      }
      return [...prev, modelId];
    });
  }, []);

  const handleApplyCostSuggestion = useCallback((suggestion: string) => {
    switch (suggestion) {
      case "use-budget-preset":
        handlePresetChange("quick"); // Use the "Quick Check" preset (budget-friendly)
        break;
      case "single-model-mode":
        setExecutionMode("all-queries-one-model");
        break;
    }
  }, [handlePresetChange]);

  const handleRunTest = useCallback(async () => {
    if (!brandUrl || queryDiscovery.selectedCount === 0 || selectedModels.length === 0) {
      return;
    }

    await visibilityTest.startTest({
      brandUrl,
      brandName: brandName || undefined,
      queries: queryDiscovery.queries,
      models: selectedModels,
      executionMode,
      selectedModel: selectedModelForExecution || undefined,
      selectedQueryId: selectedQueryForExecution || undefined,
      mock: useMockMode,
    });
  }, [
    brandUrl,
    brandName,
    queryDiscovery.queries,
    queryDiscovery.selectedCount,
    selectedModels,
    executionMode,
    selectedModelForExecution,
    selectedQueryForExecution,
    useMockMode,
    visibilityTest,
  ]);

  // ============================================
  // Computed Values
  // ============================================

  const testCount = useMemo(() => {
    const queryCount = queryDiscovery.selectedCount;
    const modelCount = selectedModels.length;

    switch (executionMode) {
      case "all-queries-all-models":
        return queryCount * modelCount;
      case "all-queries-one-model":
        return queryCount;
      case "one-query-all-models":
        return modelCount;
      default:
        return 0;
    }
  }, [queryDiscovery.selectedCount, selectedModels.length, executionMode]);

  const estimatedCost = useMemo(() => {
    // Calculate based on actual model pricing
    // Average ~500 input tokens, ~300 output tokens per test
    const avgInputTokens = 500;
    const avgOutputTokens = 300;

    let totalCost = 0;
    const queriesPerModel = executionMode === "one-query-all-models" ? 1 : queryDiscovery.selectedCount;
    const modelsPerQuery = executionMode === "all-queries-one-model" ? 1 : selectedModels.length;

    for (const modelId of selectedModels) {
      const model = LLM_MODELS[modelId];
      if (model) {
        const inputCost = (avgInputTokens / 1_000_000) * model.costPer1MInput;
        const outputCost = (avgOutputTokens / 1_000_000) * model.costPer1MOutput;
        const testsForThisModel = executionMode === "all-queries-one-model" && selectedModels[0] !== modelId
          ? 0
          : queriesPerModel;
        totalCost += (inputCost + outputCost) * testsForThisModel;
      }
    }

    return totalCost;
  }, [testCount, selectedModels, queryDiscovery.selectedCount, executionMode]);

  const canRunTest = brandUrl && queryDiscovery.selectedCount > 0 && selectedModels.length > 0;

  // Budget warnings
  const willExceedBudget = !useMockMode && wouldExceedBudget(estimatedCost);
  const budgetWarning = !useMockMode && budgetStatus === 'warning';
  const budgetExceeded = !useMockMode && budgetStatus === 'exceeded';

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 font-sans text-slate-800 antialiased">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  LLM Brand Visibility Analyzer
                </h1>
                <p className="text-slate-600">
                  See how AI platforms cite and recommend your brand
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/docs"
                className="text-sm text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Docs
              </Link>
              <CostDisplay />
            </div>
          </div>
        </header>

        <main className="space-y-6">
          {/* API Key Warning */}
          <ApiKeyWarning />

          {/* Mock Mode Toggle */}
          <div className="flex justify-end">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={useMockMode}
                onChange={(e) => setUseMockMode(e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ms-3 text-sm font-medium text-slate-700">
                Mock Mode (No Cost)
              </span>
            </label>
          </div>

          {/* Section 1: Brand Info */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              Your Brand
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Website URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={brandUrl}
                  onChange={(e) => setBrandUrl(e.target.value)}
                  placeholder="https://www.yourbrand.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={visibilityTest.isRunning}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Brand Name <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Your Brand Name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={visibilityTest.isRunning}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Industry <span className="text-slate-400">(for better query suggestions)</span>
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={visibilityTest.isRunning}
                >
                  <option value="">Select industry...</option>
                  {queryDiscovery.industries.map((ind) => (
                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Query Discovery */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              Discover Queries
            </h2>

            {/* Query Generation Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => brandUrl && queryDiscovery.suggestWithAI(brandUrl, brandName, industry)}
                disabled={!brandUrl || queryDiscovery.isLoading || visibilityTest.isRunning}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {queryDiscovery.isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Suggest
                  </>
                )}
              </button>

              {industry && (
                <button
                  onClick={() => queryDiscovery.loadIndustryTemplate(industry)}
                  disabled={queryDiscovery.isLoading || visibilityTest.isRunning}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Load {queryDiscovery.industries.find(i => i.id === industry)?.name} Templates
                </button>
              )}

              {queryDiscovery.queries.length > 0 && (
                <>
                  <button
                    onClick={queryDiscovery.selectAll}
                    className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={queryDiscovery.deselectAll}
                    className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={queryDiscovery.clearQueries}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>

            {/* Custom Query Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a custom query..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={visibilityTest.isRunning}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const input = e.target as HTMLInputElement;
                    queryDiscovery.addCustomQuery(input.value);
                    input.value = "";
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = (e.target as HTMLButtonElement).previousSibling as HTMLInputElement;
                  queryDiscovery.addCustomQuery(input.value);
                  input.value = "";
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Query List */}
            {queryDiscovery.queries.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queryDiscovery.queries.map((query) => (
                  <div
                    key={query.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      query.selected
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={query.selected}
                      onChange={() => queryDiscovery.toggleQuery(query.id)}
                      className="w-4 h-4 text-indigo-600 rounded"
                      disabled={visibilityTest.isRunning}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{query.text}</p>
                      <p className="text-xs text-slate-500">
                        {query.category} · {query.source.replace("-", " ")}
                      </p>
                    </div>
                    <button
                      onClick={() => queryDiscovery.removeQuery(query.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      disabled={visibilityTest.isRunning}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No queries yet. Use AI Suggest or add custom queries above.</p>
              </div>
            )}

            {queryDiscovery.error && (
              <p className="mt-2 text-sm text-red-600">{queryDiscovery.error}</p>
            )}

            <p className="mt-3 text-sm text-slate-500">
              {queryDiscovery.selectedCount} of {queryDiscovery.queries.length} queries selected
            </p>
          </section>

          {/* Section 3: Model Selection */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              Select AI Platforms
            </h2>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.entries(MODEL_PRESETS) as [ModelPreset, typeof MODEL_PRESETS[ModelPreset]][]).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetChange(key)}
                  disabled={visibilityTest.isRunning}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    modelPreset === key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {preset.name}
                  <span className="ml-1 opacity-70">{preset.description}</span>
                </button>
              ))}
            </div>

            {/* Model Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Platforms */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Search Platforms
                  <span className="text-xs text-slate-500">(citations & traffic)</span>
                </h3>
                <div className="space-y-2">
                  {Object.values(LLM_MODELS)
                    .filter((m) => m.platformType === "search")
                    .map((model) => (
                      <label
                        key={model.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedModels.includes(model.id)
                            ? "bg-green-50 border-green-200"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={() => handleModelToggle(model.id)}
                          className="w-4 h-4 text-green-600 rounded"
                          disabled={visibilityTest.isRunning}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {model.name}
                            {model.costTier === "premium" && (
                              <span className="ml-1 text-amber-500">★</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{model.consumerProduct}</p>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              {/* Chat Platforms */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Chat Platforms
                  <span className="text-xs text-slate-500">(brand awareness)</span>
                </h3>
                <div className="space-y-2">
                  {Object.values(LLM_MODELS)
                    .filter((m) => m.platformType === "chat")
                    .map((model) => (
                      <label
                        key={model.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedModels.includes(model.id)
                            ? "bg-blue-50 border-blue-200"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={() => handleModelToggle(model.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                          disabled={visibilityTest.isRunning}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {model.name}
                            {model.costTier === "premium" && (
                              <span className="ml-1 text-amber-500">★</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{model.consumerProduct}</p>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {selectedModels.length} platforms selected
              <span className="ml-2 text-xs">★ = Premium tier</span>
            </p>
          </section>

          {/* Section 4: Run Test */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              Run Test
            </h2>

            {/* Execution Mode */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50">
                <input
                  type="radio"
                  name="executionMode"
                  checked={executionMode === "all-queries-all-models"}
                  onChange={() => setExecutionMode("all-queries-all-models")}
                  className="w-4 h-4 text-indigo-600"
                  disabled={visibilityTest.isRunning}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">All queries × All platforms</p>
                  <p className="text-xs text-slate-500">Complete visibility matrix</p>
                </div>
                <span className="text-sm text-slate-600">
                  {queryDiscovery.selectedCount * selectedModels.length} tests
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50">
                <input
                  type="radio"
                  name="executionMode"
                  checked={executionMode === "all-queries-one-model"}
                  onChange={() => setExecutionMode("all-queries-one-model")}
                  className="w-4 h-4 text-indigo-600"
                  disabled={visibilityTest.isRunning}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">All queries × One platform</p>
                  <p className="text-xs text-slate-500">Deep dive on a single platform</p>
                </div>
                <span className="text-sm text-slate-600">
                  {queryDiscovery.selectedCount} tests
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50">
                <input
                  type="radio"
                  name="executionMode"
                  checked={executionMode === "one-query-all-models"}
                  onChange={() => setExecutionMode("one-query-all-models")}
                  className="w-4 h-4 text-indigo-600"
                  disabled={visibilityTest.isRunning}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">One query × All platforms</p>
                  <p className="text-xs text-slate-500">Quick spot check across platforms</p>
                </div>
                <span className="text-sm text-slate-600">
                  {selectedModels.length} tests
                </span>
              </label>
            </div>

            {/* Budget Warning */}
            {(willExceedBudget || budgetExceeded) && (
              <div className={`mb-4 p-4 rounded-lg border ${
                budgetExceeded
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded-full ${budgetExceeded ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <svg className={`w-5 h-5 ${budgetExceeded ? 'text-red-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-semibold ${budgetExceeded ? 'text-red-800' : 'text-amber-800'}`}>
                      {budgetExceeded ? 'Budget Exceeded' : 'Budget Warning'}
                    </h4>
                    <p className={`text-sm mt-1 ${budgetExceeded ? 'text-red-700' : 'text-amber-700'}`}>
                      {budgetExceeded
                        ? `You've exceeded your session budget of $${budgetLimit.toFixed(2)}. Click the budget settings to increase your limit or reset the session.`
                        : `This test will cost ~$${estimatedCost.toFixed(4)}, which would exceed your remaining budget of $${budgetRemaining.toFixed(4)}.`
                      }
                    </p>
                    {!budgetExceeded && (
                      <p className="text-xs text-amber-600 mt-2">
                        Consider using Mock Mode for testing, or selecting fewer queries/models.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cost Optimization Tips - Show when not in mock mode and have models selected */}
            {!useMockMode && selectedModels.length > 0 && queryDiscovery.selectedCount > 0 && (
              <CostOptimizationTips
                selectedModels={selectedModels}
                queryCount={queryDiscovery.selectedCount}
                estimatedCost={estimatedCost}
                onApplySuggestion={handleApplyCostSuggestion}
              />
            )}

            {/* Run Button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                <span className="font-medium">{testCount}</span> tests
                {!useMockMode && (
                  <span className={`ml-2 ${willExceedBudget ? 'text-amber-600 font-medium' : ''}`}>
                    · Est. cost: <span className="font-medium">${estimatedCost.toFixed(4)}</span>
                    {willExceedBudget && <span className="text-xs ml-1">(exceeds budget)</span>}
                  </span>
                )}
                {visibilityTest.state.totalCost > 0 && (
                  <span className="ml-2">· Actual: <span className="font-medium">${visibilityTest.state.totalCost.toFixed(4)}</span></span>
                )}
              </div>

              <div className="flex gap-3">
                {visibilityTest.isRunning ? (
                  <button
                    onClick={visibilityTest.cancelTest}
                    className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel
                  </button>
                ) : (
                  <>
                    {visibilityTest.state.status !== "idle" && (
                      <button
                        onClick={visibilityTest.reset}
                        className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={handleRunTest}
                      disabled={!canRunTest}
                      className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Run Visibility Test
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Progress */}
            {visibilityTest.isRunning && (
              <div className="mt-4 space-y-3">
                {/* Progress Header */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-indigo-300 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                    <span className="text-slate-600 font-medium">
                      {visibilityTest.state.currentModel || "Starting parallel execution..."}
                    </span>
                  </div>
                  <span className="text-indigo-600 font-semibold">
                    {Math.round(visibilityTest.state.progress * 100)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${visibilityTest.state.progress * 100}%` }}
                  />
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {Object.keys(visibilityTest.state.queryResults).length} queries completed
                  </span>
                  {visibilityTest.state.totalCost > 0 && (
                    <span>Cost so far: ${visibilityTest.state.totalCost.toFixed(4)}</span>
                  )}
                </div>

                {/* Live Results Preview */}
                {Object.keys(visibilityTest.state.queryResults).length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      Live Results
                    </p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {Object.values(visibilityTest.state.queryResults).slice(-3).map((qr) => (
                        <div key={qr.queryId} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 truncate flex-1 mr-2">
                            {qr.queryText.substring(0, 40)}...
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            qr.citationRate >= 50
                              ? 'bg-green-100 text-green-700'
                              : qr.citationRate > 0
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {qr.modelsFound}/{qr.modelsTotal} found
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Results Section - Show during running AND after complete */}
          {(visibilityTest.state.status === "complete" ||
            (visibilityTest.isRunning && Object.keys(visibilityTest.state.queryResults).length > 0)) && (
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Results</h2>

              {/* Overall Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-600">
                    {visibilityTest.state.overallCitationRate.toFixed(0)}%
                  </p>
                  <p className="text-sm text-slate-600">Overall Citation Rate</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {Object.entries(visibilityTest.state.citationRateByModel)
                      .filter(([id]) => LLM_MODELS[id as LLMModelId]?.platformType === "search")
                      .reduce((sum, [, rate]) => sum + rate, 0) /
                      Object.entries(visibilityTest.state.citationRateByModel)
                        .filter(([id]) => LLM_MODELS[id as LLMModelId]?.platformType === "search")
                        .length || 0}%
                  </p>
                  <p className="text-sm text-slate-600">Search Visibility</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {Object.entries(visibilityTest.state.citationRateByModel)
                      .filter(([id]) => LLM_MODELS[id as LLMModelId]?.platformType === "chat")
                      .reduce((sum, [, rate]) => sum + rate, 0) /
                      Object.entries(visibilityTest.state.citationRateByModel)
                        .filter(([id]) => LLM_MODELS[id as LLMModelId]?.platformType === "chat")
                        .length || 0}%
                  </p>
                  <p className="text-sm text-slate-600">Chat Awareness</p>
                </div>
              </div>

              {/* Per-Model Results */}
              <h3 className="text-sm font-medium text-slate-700 mb-3">Citation Rate by Platform</h3>
              <div className="space-y-2">
                {Object.entries(visibilityTest.state.citationRateByModel).map(([modelId, rate]) => {
                  const model = LLM_MODELS[modelId as LLMModelId];
                  return (
                    <div key={modelId} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-slate-600 truncate">{model?.name || modelId}</div>
                      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            model?.platformType === "search" ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-slate-600 text-right">{rate.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>

              {/* Query Results - Expandable Cards */}
              <h3 className="text-sm font-medium text-slate-700 mt-6 mb-3">
                Results by Query
                <span className="text-xs text-slate-500 font-normal ml-2">
                  (click to expand and see full details)
                </span>
              </h3>
              <div className="space-y-3">
                {Object.values(visibilityTest.state.queryResults).map((qr) => (
                  <QueryResultCard
                    key={qr.queryId}
                    queryId={qr.queryId}
                    queryText={qr.queryText}
                    modelResults={qr.modelResults}
                    citationRate={qr.citationRate}
                    modelsFound={qr.modelsFound}
                    modelsTotal={qr.modelsTotal}
                    brandName={brandName || undefined}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Error Display */}
          {visibilityTest.state.status === "error" && visibilityTest.state.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{visibilityTest.state.error}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
