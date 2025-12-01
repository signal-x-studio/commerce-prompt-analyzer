/**
 * OpenRouter Service
 *
 * Unified API client for querying multiple LLM providers through OpenRouter.
 * Supports Gemini, GPT-4o, Claude, and Llama models.
 */

import OpenAI from "openai";
import {
  apiKeyManager,
  OPENROUTER_ALLOWED_MODELS,
  type CouncilEngineId,
} from "../lib/security/api-keys";

// Response structure from OpenRouter
export interface OpenRouterResponse {
  engineId: CouncilEngineId;
  content: string;
  tokenCount: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  latencyMs: number;
}

// Error response when a model fails
export interface OpenRouterError {
  engineId: CouncilEngineId;
  error: string;
  status: "error";
}

export type QueryResult = OpenRouterResponse | OpenRouterError;

// Lazy initialization of OpenRouter client
let openRouterClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openRouterClient) {
    const apiKey = apiKeyManager.getKey("openrouter");
    openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ||
          "https://commerce-prompt-analyzer.vercel.app",
        "X-Title": "Commerce Prompt Analyzer",
      },
    });
  }
  return openRouterClient;
}

/**
 * Query a single model via OpenRouter
 *
 * Simulates real consumer queries - no brand hints are provided.
 * This ensures accurate brand visibility testing that reflects
 * how AI models actually respond to consumer questions.
 */
export async function queryModel(
  engineId: CouncilEngineId,
  prompt: string,
  timeoutMs: number = 30000
): Promise<QueryResult> {
  const startTime = Date.now();
  const modelConfig = OPENROUTER_ALLOWED_MODELS[engineId];

  if (!modelConfig) {
    return {
      engineId,
      error: `Unknown engine: ${engineId}`,
      status: "error",
    };
  }

  try {
    const client = getClient();

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // System prompt encourages specific brand/retailer mentions without bias
    const systemPrompt = `You are a helpful AI assistant. Answer the user's question naturally and thoroughly. When recommending products or services, mention specific brands, retailers, or websites that you believe offer good options based on your knowledge. Be specific with brand names and website recommendations where relevant.`;

    // Raw query only - no brand hints, exactly like a real consumer would ask
    const userPrompt = prompt;

    const completion = await client.chat.completions.create(
      {
        model: modelConfig.id,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const content = completion.choices[0]?.message?.content || "";
    const usage = completion.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    // Calculate cost based on model pricing
    const inputCost = (usage.prompt_tokens / 1_000_000) * modelConfig.costPer1MInput;
    const outputCost =
      (usage.completion_tokens / 1_000_000) * modelConfig.costPer1MOutput;

    return {
      engineId,
      content,
      tokenCount: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens,
      },
      cost: inputCost + outputCost,
      latencyMs: Date.now() - startTime,
    };
  } catch (error: any) {
    const errorMessage =
      error.name === "AbortError"
        ? `Request timeout after ${timeoutMs}ms`
        : error.message || "Unknown error";

    console.error(`[OpenRouter] Error querying ${engineId}:`, errorMessage);

    return {
      engineId,
      error: errorMessage,
      status: "error",
    };
  }
}

/**
 * Query multiple models in parallel
 * Uses Promise.allSettled for error isolation - one failure doesn't affect others
 */
export async function queryModelsParallel(
  engineIds: CouncilEngineId[],
  prompt: string,
  timeoutMs: number = 30000
): Promise<QueryResult[]> {
  const promises = engineIds.map((engineId) =>
    queryModel(engineId, prompt, timeoutMs)
  );

  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    // This shouldn't happen since queryModel catches all errors,
    // but handle it just in case
    return {
      engineId: engineIds[index],
      error: result.reason?.message || "Unknown error",
      status: "error" as const,
    };
  });
}

/**
 * Check if a query result is an error
 */
export function isQueryError(result: QueryResult): result is OpenRouterError {
  return "status" in result && result.status === "error";
}

/**
 * Check if a query result is successful
 */
export function isQuerySuccess(
  result: QueryResult
): result is OpenRouterResponse {
  return !isQueryError(result);
}

/**
 * Get successful results from a batch of query results
 */
export function getSuccessfulResults(
  results: QueryResult[]
): OpenRouterResponse[] {
  return results.filter(isQuerySuccess);
}

/**
 * Calculate total cost from a batch of query results
 */
export function calculateTotalCost(results: QueryResult[]): number {
  return results.reduce((total, result) => {
    if (isQuerySuccess(result)) {
      return total + result.cost;
    }
    return total;
  }, 0);
}

/**
 * Determine if a response mentions the user's URL/domain
 */
export function checkUrlMention(
  content: string,
  userUrl: string
): { found: boolean; rank: number | null } {
  try {
    const userDomain = new URL(userUrl).hostname.replace(/^www\./, "");

    // Simple heuristic: check if domain is mentioned
    const lowerContent = content.toLowerCase();
    const lowerDomain = userDomain.toLowerCase();

    if (lowerContent.includes(lowerDomain)) {
      // Try to determine rough "rank" based on position in content
      const position = lowerContent.indexOf(lowerDomain);
      const contentLength = lowerContent.length;

      // Approximate rank: 1-3 based on position
      let rank: number;
      if (position < contentLength * 0.3) {
        rank = 1; // Early mention
      } else if (position < contentLength * 0.6) {
        rank = 2; // Middle mention
      } else {
        rank = 3; // Late mention
      }

      return { found: true, rank };
    }

    return { found: false, rank: null };
  } catch {
    return { found: false, rank: null };
  }
}

/**
 * Analyze sentiment of content regarding a domain
 * Simple keyword-based analysis (can be enhanced with LLM call)
 */
export function analyzeSentiment(
  content: string,
  userUrl: string
): "positive" | "negative" | "neutral" {
  const userDomain = new URL(userUrl).hostname.replace(/^www\./, "");
  const lowerContent = content.toLowerCase();

  // If domain not mentioned, neutral
  if (!lowerContent.includes(userDomain.toLowerCase())) {
    return "neutral";
  }

  // Simple positive/negative keyword detection near the domain mention
  const positiveWords = [
    "excellent",
    "great",
    "best",
    "top",
    "recommended",
    "quality",
    "trusted",
    "reliable",
    "popular",
    "leading",
  ];
  const negativeWords = [
    "avoid",
    "bad",
    "poor",
    "worst",
    "unreliable",
    "scam",
    "issue",
    "problem",
    "complaint",
  ];

  const domainIndex = lowerContent.indexOf(userDomain.toLowerCase());
  const surroundingText = lowerContent.slice(
    Math.max(0, domainIndex - 100),
    domainIndex + userDomain.length + 100
  );

  const positiveCount = positiveWords.filter((word) =>
    surroundingText.includes(word)
  ).length;
  const negativeCount = negativeWords.filter((word) =>
    surroundingText.includes(word)
  ).length;

  if (positiveCount > negativeCount) {
    return "positive";
  } else if (negativeCount > positiveCount) {
    return "negative";
  }
  return "neutral";
}
