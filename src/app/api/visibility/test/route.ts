/**
 * Visibility Test API
 *
 * Unified endpoint for testing brand visibility across multiple LLM platforms.
 * Supports SSE streaming for real-time progress updates.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  testModelVisibility,
  testModelsParallel,
  estimateTestCost,
} from "../../../../services/visibilityService";
import {
  LLM_MODELS,
  type LLMModelId,
  type VisibilityQuery,
  type ModelVisibilityResult,
  type ExecutionMode,
} from "../../../../types";

// ============================================
// Request Validation
// ============================================

const visibilityQuerySchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(500),
  source: z.enum(["url-generated", "ai-suggested", "industry-template", "custom"]),
  category: z.string().optional(),
  selected: z.boolean(),
});

const testRequestSchema = z.object({
  brandUrl: z.string().url(),
  brandName: z.string().optional(),
  queries: z.array(visibilityQuerySchema).min(1),
  models: z.array(z.string()).min(1),
  executionMode: z.enum(["all-queries-all-models", "all-queries-one-model", "one-query-all-models"]),
  selectedModel: z.string().optional(),
  selectedQueryId: z.string().optional(),
  mock: z.boolean().optional().default(false),
});

// ============================================
// SSE Event Types
// ============================================

interface SSEEvent {
  type: "start" | "query_start" | "model_start" | "model_complete" | "query_complete" | "complete" | "error";
  data: Record<string, unknown>;
  timestamp: number;
}

function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: SSEEvent,
  isClosed: { value: boolean }
): void {
  if (isClosed.value) return;
  try {
    const data = JSON.stringify(event);
    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
  } catch (error) {
    isClosed.value = true;
  }
}

function closeController(
  controller: ReadableStreamDefaultController,
  isClosed: { value: boolean }
): void {
  if (isClosed.value) return;
  try {
    controller.close();
    isClosed.value = true;
  } catch {
    isClosed.value = true;
  }
}

// ============================================
// Concurrency Control
// ============================================

const QUERY_CONCURRENCY_LIMIT = 3; // Max queries running in parallel

/**
 * Simple semaphore for limiting concurrent operations
 */
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      next?.();
    } else {
      this.permits++;
    }
  }
}

// ============================================
// Mock Data
// ============================================

function generateMockResult(
  modelId: LLMModelId,
  brandUrl: string
): ModelVisibilityResult {
  const model = LLM_MODELS[modelId];
  const found = Math.random() > 0.4; // 60% chance of being found

  return {
    modelId,
    status: "complete",
    found,
    detectionMethod: model.supportsGrounding ? "grounded" : "text-match",
    sources: model.supportsGrounding && found
      ? [
          { uri: brandUrl, title: "Brand Website", rank: Math.floor(Math.random() * 5) + 1 },
          { uri: "https://example.com/competitor", title: "Competitor Site", rank: 2 },
        ]
      : undefined,
    rank: found && model.supportsGrounding ? Math.floor(Math.random() * 5) + 1 : undefined,
    mentionContext: found ? "...mentioned in the context of product recommendations..." : undefined,
    sentiment: found
      ? (["positive", "neutral", "negative"] as const)[Math.floor(Math.random() * 3)]
      : "neutral",
    confidence: found ? 0.7 + Math.random() * 0.3 : 0,
    responseText: `This is a mock response from ${model.name}. ${found ? `The brand ${brandUrl} was mentioned.` : "The brand was not mentioned."}`,
    tokenCount: { prompt: 150, completion: 350, total: 500 },
    latencyMs: 500 + Math.random() * 1500,
    cost: 0.001 + Math.random() * 0.005,
  };
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const isClosed = { value: false };

      try {
        // Parse and validate request
        const body = await request.json();
        const parseResult = testRequestSchema.safeParse(body);

        if (!parseResult.success) {
          sendEvent(controller, encoder, {
            type: "error",
            data: { error: "Validation Error", details: parseResult.error.issues },
            timestamp: Date.now(),
          }, isClosed);
          closeController(controller, isClosed);
          return;
        }

        const {
          brandUrl,
          brandName,
          queries,
          models,
          executionMode,
          selectedModel,
          selectedQueryId,
          mock,
        } = parseResult.data;

        // Validate model IDs
        const validModels = models.filter((m) => m in LLM_MODELS) as LLMModelId[];
        if (validModels.length === 0) {
          sendEvent(controller, encoder, {
            type: "error",
            data: { error: "No valid models selected" },
            timestamp: Date.now(),
          }, isClosed);
          closeController(controller, isClosed);
          return;
        }

        // Get selected queries
        const selectedQueries = queries.filter((q) => q.selected);
        if (selectedQueries.length === 0) {
          sendEvent(controller, encoder, {
            type: "error",
            data: { error: "No queries selected" },
            timestamp: Date.now(),
          }, isClosed);
          closeController(controller, isClosed);
          return;
        }

        // Determine what to test based on execution mode
        let queriesToTest: VisibilityQuery[] = [];
        let modelsToTest: LLMModelId[] = [];

        switch (executionMode) {
          case "all-queries-all-models":
            queriesToTest = selectedQueries;
            modelsToTest = validModels;
            break;
          case "all-queries-one-model":
            queriesToTest = selectedQueries;
            modelsToTest = selectedModel && validModels.includes(selectedModel as LLMModelId)
              ? [selectedModel as LLMModelId]
              : [validModels[0]];
            break;
          case "one-query-all-models":
            const targetQuery = selectedQueryId
              ? selectedQueries.find((q) => q.id === selectedQueryId)
              : selectedQueries[0];
            queriesToTest = targetQuery ? [targetQuery] : [selectedQueries[0]];
            modelsToTest = validModels;
            break;
        }

        const totalTests = queriesToTest.length * modelsToTest.length;

        // Process queries in parallel with concurrency limit
        const allResults: Record<string, Record<LLMModelId, ModelVisibilityResult>> = {};
        let completedQueries = 0;
        let totalCost = 0;

        // Optimize concurrency based on execution mode
        // For single query mode, no need for semaphore limiting
        const effectiveConcurrency = queriesToTest.length === 1
          ? 1
          : QUERY_CONCURRENCY_LIMIT;
        const semaphore = new Semaphore(effectiveConcurrency);

        // Send start event with concurrency info
        sendEvent(controller, encoder, {
          type: "start",
          data: {
            totalQueries: queriesToTest.length,
            totalModels: modelsToTest.length,
            totalTests,
            concurrencyLimit: QUERY_CONCURRENCY_LIMIT,
            estimatedCost: estimateTestCost({
              brandUrl,
              brandName,
              queries: queriesToTest,
              models: modelsToTest,
              executionMode,
            }),
          },
          timestamp: Date.now(),
        }, isClosed);

        // Process single query with semaphore
        const processQuery = async (query: VisibilityQuery): Promise<void> => {
          await semaphore.acquire();

          try {
            // Send query start event
            sendEvent(controller, encoder, {
              type: "query_start",
              data: {
                queryId: query.id,
                queryText: query.text,
                models: modelsToTest.map(id => ({ id, name: LLM_MODELS[id].name })),
              },
              timestamp: Date.now(),
            }, isClosed);

            let queryResults: Record<LLMModelId, ModelVisibilityResult>;

            if (mock) {
              // Mock mode: simulate parallel with small delays
              const mockPromises = modelsToTest.map(async (modelId) => {
                await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));
                return { modelId, result: generateMockResult(modelId, brandUrl) };
              });
              const mockResults = await Promise.all(mockPromises);
              queryResults = {} as Record<LLMModelId, ModelVisibilityResult>;
              for (const { modelId, result } of mockResults) {
                queryResults[modelId] = result;
              }
            } else {
              // PARALLEL EXECUTION: Run all models for this query simultaneously
              queryResults = await testModelsParallel(
                modelsToTest,
                query.text,
                brandUrl,
                brandName
              );
            }

            // Calculate costs
            const modelResultsArray = Object.values(queryResults);
            const queryCost = modelResultsArray.reduce((sum, r) => sum + (r.cost || 0), 0);
            totalCost += queryCost;
            completedQueries++;

            // Build model results data
            const modelResultsData: Record<string, unknown> = {};
            for (const [modelId, result] of Object.entries(queryResults)) {
              modelResultsData[modelId] = {
                found: result.found,
                sentiment: result.sentiment,
                confidence: result.confidence,
                rank: result.rank,
                cost: result.cost,
                latencyMs: result.latencyMs,
                detectionMethod: result.detectionMethod,
                responseText: result.responseText,
                mentionContext: result.mentionContext,
                sources: result.sources,
                detectionDetails: result.detectionDetails,
                competitorsMentioned: result.competitorsMentioned,
              };
            }

            allResults[query.id] = queryResults;

            // Calculate query-level metrics
            const foundCount = modelResultsArray.filter((r) => r.found).length;
            const citationRate = (foundCount / modelResultsArray.length) * 100;

            // Send query complete with all model results
            sendEvent(controller, encoder, {
              type: "query_complete",
              data: {
                queryId: query.id,
                queryText: query.text,
                modelResults: modelResultsData,
                citationRate,
                modelsFound: foundCount,
                modelsTotal: modelResultsArray.length,
                progress: completedQueries / queriesToTest.length,
              },
              timestamp: Date.now(),
            }, isClosed);
          } finally {
            semaphore.release();
          }
        };

        // Launch all queries in parallel (semaphore limits concurrency)
        await Promise.all(queriesToTest.map(processQuery));

        // Calculate overall metrics
        const allModelResults = Object.values(allResults).flatMap((qr) => Object.values(qr));
        const overallFound = allModelResults.filter((r) => r.found).length;
        const overallCitationRate = (overallFound / allModelResults.length) * 100;

        // Calculate per-model citation rates
        const citationRateByModel: Record<string, number> = {};
        for (const modelId of modelsToTest) {
          const modelResults = Object.values(allResults).map((qr) => qr[modelId]).filter(Boolean);
          const found = modelResults.filter((r) => r.found).length;
          citationRateByModel[modelId] = (found / modelResults.length) * 100;
        }

        // Send complete event
        sendEvent(controller, encoder, {
          type: "complete",
          data: {
            overallCitationRate,
            citationRateByModel,
            totalCost,
            totalTests,
            results: allResults,
          },
          timestamp: Date.now(),
        }, isClosed);

        closeController(controller, isClosed);
      } catch (error: any) {
        sendEvent(controller, encoder, {
          type: "error",
          data: { error: error.message || "Unknown error" },
          timestamp: Date.now(),
        }, isClosed);
        closeController(controller, isClosed);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
