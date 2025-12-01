"use client";

import { useState, useCallback, useRef } from "react";
import type {
  CouncilConfig,
  CouncilEngineId,
  CouncilEngineResponse,
  CouncilRanking,
  CouncilSessionState,
  CouncilSessionStatus,
  CouncilStreamEvent,
} from "../types";

interface UseCouncilStreamOptions {
  onStageChange?: (stage: number, name: string) => void;
  onEngineComplete?: (engineId: CouncilEngineId, response: Partial<CouncilEngineResponse>) => void;
  onComplete?: (result: CouncilSessionState) => void;
  onError?: (error: string) => void;
}

interface UseCouncilStreamReturn {
  state: CouncilSessionState;
  startSession: (prompt: string, userUrl: string, config: CouncilConfig, mock?: boolean) => Promise<void>;
  cancelSession: () => void;
  reset: () => void;
  isLoading: boolean;
}

const initialState: CouncilSessionState = {
  status: "idle",
  currentStage: 0,
  stageName: "",
  engineStatuses: {
    gemini: "pending",
    gpt4o: "pending",
    claude: "pending",
    llama: "pending",
  },
  engineResponses: {},
  totalCost: 0,
};

export function useCouncilStream(
  options: UseCouncilStreamOptions = {}
): UseCouncilStreamReturn {
  const [state, setState] = useState<CouncilSessionState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateState = useCallback((updates: Partial<CouncilSessionState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleEvent = useCallback(
    (event: CouncilStreamEvent) => {
      switch (event.type) {
        case "stage": {
          const { stage, name, description } = event.data as {
            stage: number;
            name: string;
            description: string;
          };

          let status: CouncilSessionStatus = "querying";
          if (name === "evaluate") status = "evaluating";
          if (name === "synthesize") status = "synthesizing";

          updateState({
            currentStage: stage,
            stageName: description,
            status,
          });
          options.onStageChange?.(stage, name);
          break;
        }

        case "engine_start": {
          const { engineId } = event.data as { engineId: CouncilEngineId };
          setState((prev) => ({
            ...prev,
            engineStatuses: {
              ...prev.engineStatuses,
              [engineId]: "loading",
            },
          }));
          break;
        }

        case "engine_complete": {
          const data = event.data as {
            engineId: CouncilEngineId;
            tokenCount: { prompt: number; completion: number; total: number };
            latencyMs: number;
            cost: number;
            contentPreview: string;
          };

          const response: Partial<CouncilEngineResponse> = {
            engineId: data.engineId,
            tokenCount: data.tokenCount,
            latencyMs: data.latencyMs,
            cost: data.cost,
            content: data.contentPreview,
          };

          setState((prev) => ({
            ...prev,
            engineStatuses: {
              ...prev.engineStatuses,
              [data.engineId]: "complete",
            },
            engineResponses: {
              ...prev.engineResponses,
              [data.engineId]: response,
            },
            totalCost: prev.totalCost + data.cost,
          }));

          options.onEngineComplete?.(data.engineId, response);
          break;
        }

        case "engine_error": {
          const { engineId, error } = event.data as {
            engineId: CouncilEngineId;
            error: string;
          };

          setState((prev) => ({
            ...prev,
            engineStatuses: {
              ...prev.engineStatuses,
              [engineId]: "error",
            },
          }));
          break;
        }

        case "evaluation_start": {
          updateState({ status: "evaluating" });
          break;
        }

        case "evaluation_complete": {
          // Evaluation reasoning is in the data but we primarily care about rankings
          break;
        }

        case "rankings": {
          const { rankings, winner, consensusLevel } = event.data as {
            rankings: CouncilRanking[];
            winner: CouncilEngineId;
            consensusLevel: string;
          };

          updateState({
            rankings,
            winner,
          });
          break;
        }

        case "synthesis_start": {
          updateState({ status: "synthesizing" });
          break;
        }

        case "synthesis_complete": {
          const { content } = event.data as { content: string };
          updateState({ synthesizedContent: content });
          break;
        }

        case "complete": {
          const { totalCost, winner, synthesizedContent, engineResponses } =
            event.data as {
              totalCost: number;
              winner: CouncilEngineId;
              synthesizedContent?: string;
              engineResponses: Array<{
                engineId: CouncilEngineId;
                content: string;
                rank?: number;
              }>;
            };

          // Update with full content from final event
          const fullResponses: Partial<Record<CouncilEngineId, CouncilEngineResponse>> = {};
          engineResponses.forEach((r) => {
            fullResponses[r.engineId] = {
              ...state.engineResponses[r.engineId],
              content: r.content,
              rank: r.rank,
            } as CouncilEngineResponse;
          });

          const finalState: CouncilSessionState = {
            ...state,
            status: "complete",
            engineResponses: fullResponses,
            winner,
            synthesizedContent,
            totalCost,
          };

          setState(finalState);
          options.onComplete?.(finalState);
          break;
        }

        case "error": {
          const { error, message } = event.data as {
            error: string;
            message?: string;
          };
          const errorMessage = message || error;

          updateState({
            status: "error",
            error: errorMessage,
          });
          options.onError?.(errorMessage);
          break;
        }
      }
    },
    [state.engineResponses, options, updateState]
  );

  const startSession = useCallback(
    async (prompt: string, userUrl: string, config: CouncilConfig, mock: boolean = false) => {
      // Cancel any existing session
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      // Reset engine statuses for selected engines
      const engineStatuses: Record<CouncilEngineId, "pending" | "loading" | "complete" | "error"> = {
        gemini: "pending",
        gpt4o: "pending",
        claude: "pending",
        llama: "pending",
      };

      setState({
        ...initialState,
        status: "querying",
        engineStatuses,
      });

      try {
        const response = await fetch("/api/council/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, userUrl, config, mock }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to start council session");
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

          // Process complete SSE events
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // Keep incomplete event in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(line.slice(6)) as CouncilStreamEvent;
                handleEvent(eventData);
              } catch (e) {
                console.error("Failed to parse SSE event:", e);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          updateState({ status: "idle" });
          return;
        }

        const errorMessage = error.message || "An unexpected error occurred";
        updateState({
          status: "error",
          error: errorMessage,
        });
        options.onError?.(errorMessage);
      }
    },
    [handleEvent, options, updateState]
  );

  const cancelSession = useCallback(() => {
    abortControllerRef.current?.abort();
    updateState({ status: "idle" });
  }, [updateState]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(initialState);
  }, []);

  return {
    state,
    startSession,
    cancelSession,
    reset,
    isLoading: ["querying", "evaluating", "synthesizing"].includes(state.status),
  };
}
