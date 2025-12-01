"use client";

import { useState, useCallback, useRef } from "react";
import type {
  CouncilConfig,
  CouncilEngineId,
  BatchCouncilResult,
  BatchCouncilSummary,
  BrandVisibilityResult,
} from "../types";
import { createBrandVisibilityResult } from "../lib/council/brand-visibility";

interface UseBatchCouncilOptions {
  onPromptComplete?: (prompt: string, result: BrandVisibilityResult) => void;
  onComplete?: (summary: BatchCouncilSummary) => void;
  onError?: (error: string) => void;
}

interface UseBatchCouncilReturn {
  results: BatchCouncilResult[];
  summary: BatchCouncilSummary | null;
  isRunning: boolean;
  currentPrompt: string | null;
  completedCount: number;
  totalCount: number;
  startBatchTest: (
    prompts: string[],
    brandUrl: string,
    brandName: string | undefined,
    config: CouncilConfig,
    mock?: boolean
  ) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useBatchCouncil(
  options: UseBatchCouncilOptions = {}
): UseBatchCouncilReturn {
  const [results, setResults] = useState<BatchCouncilResult[]>([]);
  const [summary, setSummary] = useState<BatchCouncilSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const testSinglePrompt = useCallback(
    async (
      prompt: string,
      brandUrl: string,
      brandName: string | undefined,
      config: CouncilConfig,
      mock: boolean,
      signal: AbortSignal
    ): Promise<BrandVisibilityResult | null> => {
      try {
        const response = await fetch("/api/council/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, userUrl: brandUrl, config, mock }),
          signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to test prompt");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let engineResponses: Record<string, { content: string; cost: number }> = {};
        let totalCost = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));

                if (event.type === "engine_complete") {
                  const { engineId, contentPreview, cost } = event.data;
                  engineResponses[engineId] = {
                    content: contentPreview,
                    cost: cost || 0,
                  };
                  totalCost += cost || 0;
                }

                if (event.type === "complete") {
                  const { engineResponses: finalResponses, totalCost: finalCost } =
                    event.data;

                  // Update with full content
                  finalResponses.forEach(
                    (r: { engineId: string; content: string }) => {
                      if (engineResponses[r.engineId]) {
                        engineResponses[r.engineId].content = r.content;
                      }
                    }
                  );

                  totalCost = finalCost || totalCost;
                }
              } catch (e) {
                console.error("Failed to parse SSE event:", e);
              }
            }
          }
        }

        // Create brand visibility result
        const formattedResponses: Record<
          CouncilEngineId,
          { content: string; cost: number; engineId: CouncilEngineId }
        > = {} as Record<
          CouncilEngineId,
          { content: string; cost: number; engineId: CouncilEngineId }
        >;

        for (const [id, data] of Object.entries(engineResponses)) {
          formattedResponses[id as CouncilEngineId] = {
            engineId: id as CouncilEngineId,
            content: data.content,
            cost: data.cost,
          };
        }

        return createBrandVisibilityResult(
          prompt,
          brandUrl,
          brandName,
          formattedResponses as any,
          totalCost
        );
      } catch (error: any) {
        if (error.name === "AbortError") {
          return null;
        }
        console.error(`Error testing prompt "${prompt}":`, error);
        return null;
      }
    },
    []
  );

  const startBatchTest = useCallback(
    async (
      prompts: string[],
      brandUrl: string,
      brandName: string | undefined,
      config: CouncilConfig,
      mock: boolean = false
    ) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsRunning(true);
      setResults([]);
      setSummary(null);
      setCompletedCount(0);
      setTotalCount(prompts.length);

      const batchResults: BatchCouncilResult[] = [];
      let totalCost = 0;

      for (let i = 0; i < prompts.length; i++) {
        if (abortControllerRef.current?.signal.aborted) break;

        const prompt = prompts[i];
        setCurrentPrompt(prompt);

        const visibilityResult = await testSinglePrompt(
          prompt,
          brandUrl,
          brandName,
          config,
          mock,
          abortControllerRef.current.signal
        );

        if (visibilityResult) {
          const result: BatchCouncilResult = {
            prompt,
            visibilityResult,
          };

          batchResults.push(result);
          setResults((prev) => [...prev, result]);
          totalCost += visibilityResult.totalCost;
          options.onPromptComplete?.(prompt, visibilityResult);
        }

        setCompletedCount(i + 1);
      }

      // Calculate summary
      if (batchResults.length > 0) {
        const summaryData = calculateBatchSummary(batchResults, config.engines);
        setSummary(summaryData);
        options.onComplete?.(summaryData);
      }

      setIsRunning(false);
      setCurrentPrompt(null);
    },
    [testSinglePrompt, options]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setCurrentPrompt(null);
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setResults([]);
    setSummary(null);
    setIsRunning(false);
    setCurrentPrompt(null);
    setCompletedCount(0);
    setTotalCount(0);
  }, []);

  return {
    results,
    summary,
    isRunning,
    currentPrompt,
    completedCount,
    totalCount,
    startBatchTest,
    cancel,
    reset,
  };
}

function calculateBatchSummary(
  results: BatchCouncilResult[],
  engines: CouncilEngineId[]
): BatchCouncilSummary {
  const totalPrompts = results.length;

  // Calculate average visibility score
  const averageVisibilityScore =
    results.reduce((sum, r) => sum + r.visibilityResult.score.overall, 0) /
    totalPrompts;

  // Calculate citation rate by engine
  const citationRateByEngine: Record<CouncilEngineId, number> = {} as Record<
    CouncilEngineId,
    number
  >;

  for (const engineId of engines) {
    const citedCount = results.filter((r) =>
      r.visibilityResult.mentions.some(
        (m) => m.engineId === engineId && m.found
      )
    ).length;
    citationRateByEngine[engineId] = (citedCount / totalPrompts) * 100;
  }

  // Calculate sentiment distribution
  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const result of results) {
    for (const mention of result.visibilityResult.mentions) {
      if (mention.sentiment === "positive") positive++;
      else if (mention.sentiment === "negative") negative++;
      else neutral++;
    }
  }

  // Find top performing and problem prompts
  const sortedByScore = [...results].sort(
    (a, b) => b.visibilityResult.score.overall - a.visibilityResult.score.overall
  );

  const topPerformingPrompts = sortedByScore
    .filter((r) => r.visibilityResult.score.overall >= 70)
    .map((r) => r.prompt);

  const problemPrompts = sortedByScore
    .filter((r) => r.visibilityResult.score.overall < 40)
    .map((r) => r.prompt);

  // Calculate total cost
  const totalCost = results.reduce(
    (sum, r) => sum + r.visibilityResult.totalCost,
    0
  );

  return {
    totalPrompts,
    averageVisibilityScore,
    citationRateByEngine,
    sentimentDistribution: { positive, neutral, negative },
    topPerformingPrompts,
    problemPrompts,
    totalCost,
  };
}
