"use client";

import { useState, useCallback, useRef } from "react";
import type {
  LLMModelId,
  VisibilityQuery,
  ModelVisibilityResult,
  ExecutionMode,
} from "../types";

// ============================================
// Types
// ============================================

export interface QueryResult {
  queryId: string;
  queryText: string;
  modelResults: Record<LLMModelId, ModelVisibilityResult>;
  citationRate: number;
  modelsFound: number;
  modelsTotal: number;
}

export interface VisibilityTestState {
  status: "idle" | "running" | "complete" | "error";
  progress: number;
  currentQuery: string | null;
  currentModel: string | null;
  queryResults: Record<string, QueryResult>;
  overallCitationRate: number;
  citationRateByModel: Record<string, number>;
  totalCost: number;
  totalTests: number;
  completedTests: number;
  error: string | null;
}

export interface UseVisibilityTestOptions {
  onQueryComplete?: (queryId: string, result: QueryResult) => void;
  onComplete?: (state: VisibilityTestState) => void;
  onError?: (error: string) => void;
}

export interface UseVisibilityTestReturn {
  state: VisibilityTestState;
  startTest: (config: {
    brandUrl: string;
    brandName?: string;
    queries: VisibilityQuery[];
    models: LLMModelId[];
    executionMode: ExecutionMode;
    selectedModel?: LLMModelId;
    selectedQueryId?: string;
    mock?: boolean;
  }) => Promise<void>;
  cancelTest: () => void;
  reset: () => void;
  isRunning: boolean;
}

// ============================================
// Initial State
// ============================================

const initialState: VisibilityTestState = {
  status: "idle",
  progress: 0,
  currentQuery: null,
  currentModel: null,
  queryResults: {},
  overallCitationRate: 0,
  citationRateByModel: {},
  totalCost: 0,
  totalTests: 0,
  completedTests: 0,
  error: null,
};

// ============================================
// Hook
// ============================================

export function useVisibilityTest(
  options: UseVisibilityTestOptions = {}
): UseVisibilityTestReturn {
  const [state, setState] = useState<VisibilityTestState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startTest = useCallback(
    async (config: {
      brandUrl: string;
      brandName?: string;
      queries: VisibilityQuery[];
      models: LLMModelId[];
      executionMode: ExecutionMode;
      selectedModel?: LLMModelId;
      selectedQueryId?: string;
      mock?: boolean;
    }) => {
      // Cancel any existing test
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState({
        ...initialState,
        status: "running",
      });

      try {
        const response = await fetch("/api/visibility/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to start test");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

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
                handleEvent(event, setState, options);
              } catch (e) {
                console.error("Failed to parse SSE event:", e);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          setState((prev) => ({
            ...prev,
            status: "idle",
          }));
          return;
        }

        const errorMessage = error.message || "Unknown error";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
        }));
        options.onError?.(errorMessage);
      }
    },
    [options]
  );

  const cancelTest = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      status: "idle",
      currentQuery: null,
      currentModel: null,
    }));
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(initialState);
  }, []);

  return {
    state,
    startTest,
    cancelTest,
    reset,
    isRunning: state.status === "running",
  };
}

// ============================================
// Event Handler
// ============================================

function handleEvent(
  event: { type: string; data: Record<string, unknown>; timestamp: number },
  setState: React.Dispatch<React.SetStateAction<VisibilityTestState>>,
  options: UseVisibilityTestOptions
) {
  switch (event.type) {
    case "start":
      setState((prev) => ({
        ...prev,
        totalTests: event.data.totalTests as number,
      }));
      break;

    case "query_start": {
      // Now includes all models that will be tested in parallel
      const { queryText, models } = event.data as {
        queryId: string;
        queryText: string;
        models: Array<{ id: string; name: string }>;
      };
      setState((prev) => ({
        ...prev,
        currentQuery: queryText,
        currentModel: `Testing ${models.length} models in parallel...`,
      }));
      break;
    }

    case "query_complete": {
      // Now receives ALL model results in a single batch (parallel execution)
      const { queryId, queryText, modelResults, citationRate, modelsFound, modelsTotal, progress } = event.data as {
        queryId: string;
        queryText: string;
        modelResults: Record<string, Partial<ModelVisibilityResult>>;
        citationRate: number;
        modelsFound: number;
        modelsTotal: number;
        progress: number;
      };

      // Calculate cost from all model results
      const queryCost = Object.values(modelResults).reduce(
        (sum, r) => sum + ((r as any).cost || 0),
        0
      );

      setState((prev) => {
        const queryResult: QueryResult = {
          queryId,
          queryText: queryText || prev.currentQuery || "",
          modelResults: modelResults as Record<LLMModelId, ModelVisibilityResult>,
          citationRate,
          modelsFound,
          modelsTotal,
        };

        options.onQueryComplete?.(queryId, queryResult);

        return {
          ...prev,
          progress,
          completedTests: prev.completedTests + modelsTotal,
          totalCost: prev.totalCost + queryCost,
          currentModel: null,
          queryResults: {
            ...prev.queryResults,
            [queryId]: queryResult,
          },
        };
      });
      break;
    }

    case "complete": {
      const { overallCitationRate, citationRateByModel, totalCost } = event.data as {
        overallCitationRate: number;
        citationRateByModel: Record<string, number>;
        totalCost: number;
      };

      setState((prev) => {
        const finalState = {
          ...prev,
          status: "complete" as const,
          overallCitationRate,
          citationRateByModel,
          totalCost,
          currentQuery: null,
          currentModel: null,
        };

        options.onComplete?.(finalState);

        return finalState;
      });
      break;
    }

    case "error":
      setState((prev) => ({
        ...prev,
        status: "error",
        error: event.data.error as string,
        currentQuery: null,
        currentModel: null,
      }));
      options.onError?.(event.data.error as string);
      break;
  }
}
