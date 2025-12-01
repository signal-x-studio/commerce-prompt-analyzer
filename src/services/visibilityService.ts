/**
 * Unified Visibility Service
 *
 * Handles brand visibility testing across all LLM platforms with
 * appropriate detection methods (grounded search vs text-match).
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import {
  LLM_MODELS,
  type LLMModelId,
  type LLMModel,
  type ModelVisibilityResult,
  type GroundingSource,
  type VisibilityQuery,
  type QueryVisibilityResult,
  type VisibilityAnalysisResult,
  type VisibilityTestConfig,
  type CompetitorMention,
  type BrandDetectionDetails,
} from "../types";
import {
  extractBrandMention,
  analyzeSentiment,
  generateBrandVariations,
  extractCompetitorMentions,
} from "../lib/council/brand-visibility";

// ============================================
// Client Initialization
// ============================================

let openRouterClient: OpenAI | null = null;
let geminiClient: GoogleGenAI | null = null;

function getOpenRouterClient(): OpenAI {
  if (!openRouterClient) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000",
        "X-Title": "LLM Brand Visibility Analyzer",
      },
    });
  }
  return openRouterClient;
}

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// ============================================
// Model Query Functions
// ============================================

/**
 * Query a model via OpenRouter (for most models)
 */
async function queryViaOpenRouter(
  model: LLMModel,
  query: string,
  timeoutMs: number = 30000
): Promise<{ content: string; tokenCount: { prompt: number; completion: number; total: number }; cost: number; latencyMs: number }> {
  const client = getOpenRouterClient();
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const systemPrompt = `You are a helpful AI assistant. Answer the user's question naturally and thoroughly. When recommending products or services, mention specific brands, retailers, or websites that you believe offer good options based on your knowledge. Be specific with brand names and website recommendations where relevant.`;

  try {
    const completion = await client.chat.completions.create(
      {
        model: model.openRouterId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const content = completion.choices[0]?.message?.content || "";
    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    const inputCost = (usage.prompt_tokens / 1_000_000) * model.costPer1MInput;
    const outputCost = (usage.completion_tokens / 1_000_000) * model.costPer1MOutput;

    return {
      content,
      tokenCount: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens,
      },
      cost: inputCost + outputCost,
      latencyMs: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Query Gemini with grounding (for search-platform simulation)
 */
async function queryGeminiGrounded(
  query: string,
  timeoutMs: number = 30000
): Promise<{
  content: string;
  sources: GroundingSource[];
  tokenCount: { prompt: number; completion: number; total: number };
  cost: number;
  latencyMs: number;
}> {
  const client = getGeminiClient();
  const startTime = Date.now();
  const model = LLM_MODELS["gemini-grounded"];

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const content = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  // Parse sources from grounding chunks
  const sources: GroundingSource[] = groundingChunks
    .map((chunk: any, index: number) => {
      const uri = chunk.web?.uri || "";
      const title = chunk.web?.title || "Untitled";

      // Extract real domain from potential Google redirects
      let cleanUri = uri;
      try {
        const url = new URL(uri);
        if (url.hostname.includes("google") || url.hostname.includes("vertexaisearch")) {
          const redirectUrl = url.searchParams.get("url") || url.searchParams.get("q");
          if (redirectUrl) cleanUri = redirectUrl;
        }
      } catch {
        // Keep original URI
      }

      return {
        uri: cleanUri,
        title,
        rank: index + 1,
      };
    })
    .filter((s: GroundingSource) => s.uri && !s.uri.includes("google.com"));

  const usage = response.usageMetadata || {};
  const promptTokens = usage.promptTokenCount || 0;
  const completionTokens = usage.candidatesTokenCount || 0;

  const inputCost = (promptTokens / 1_000_000) * model.costPer1MInput;
  const outputCost = (completionTokens / 1_000_000) * model.costPer1MOutput;

  return {
    content,
    sources,
    tokenCount: {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens,
    },
    cost: inputCost + outputCost,
    latencyMs: Date.now() - startTime,
  };
}

// ============================================
// Brand Detection
// ============================================

/**
 * Detect brand in grounded sources (for search platforms)
 */
function detectBrandInSources(
  sources: GroundingSource[],
  brandUrl: string,
  brandName?: string
): { found: boolean; rank?: number } {
  try {
    const brandDomain = new URL(brandUrl).hostname.replace(/^www\./, "").toLowerCase();

    for (const source of sources) {
      try {
        const sourceDomain = new URL(source.uri).hostname.replace(/^www\./, "").toLowerCase();
        if (sourceDomain === brandDomain || sourceDomain.includes(brandDomain)) {
          return { found: true, rank: source.rank };
        }
      } catch {
        // Skip invalid URLs
      }
    }

    return { found: false };
  } catch {
    return { found: false };
  }
}

/**
 * Detect brand mention in text (for chat platforms)
 */
function detectBrandInText(
  content: string,
  brandUrl: string,
  brandName?: string
): {
  found: boolean;
  mentionContext?: string;
  confidence: number;
  detectionDetails: BrandDetectionDetails;
} {
  // Get brand variations we're searching for
  let domain = "";
  try {
    domain = new URL(brandUrl).hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    domain = brandUrl.split("/")[0].split(".")[0];
  }

  const searchedFor = generateBrandVariations(domain, brandName, brandUrl);

  // Use existing brand detection logic
  const mention = extractBrandMention("gemini" as any, content, brandUrl, brandName);

  // Find which term matched
  let matchedTerm: string | undefined;
  if (mention.found) {
    const lowerContent = content.toLowerCase();
    matchedTerm = searchedFor.find(term => lowerContent.includes(term.toLowerCase()));
  }

  return {
    found: mention.found,
    mentionContext: mention.mentionContext,
    confidence: mention.confidence,
    detectionDetails: {
      searchedFor,
      matchedTerm,
      matchLocation: mention.found ? "text" : undefined,
    },
  };
}

// ============================================
// Main Query Function
// ============================================

/**
 * Test visibility for a single model
 */
export async function testModelVisibility(
  modelId: LLMModelId,
  query: string,
  brandUrl: string,
  brandName?: string
): Promise<ModelVisibilityResult> {
  const model = LLM_MODELS[modelId];
  const startTime = Date.now();

  try {
    // Special handling for Gemini with grounding
    if (modelId === "gemini-grounded") {
      const result = await queryGeminiGrounded(query);

      const detection = detectBrandInSources(result.sources, brandUrl, brandName);
      const textDetection = detectBrandInText(result.content, brandUrl, brandName);
      const sentiment = analyzeSentiment(result.content, [brandUrl, brandName || ""]);
      const competitors = extractCompetitorMentions(result.content, brandUrl, brandName);

      return {
        modelId,
        status: "complete",
        found: detection.found || textDetection.found,
        detectionMethod: "grounded",
        sources: result.sources,
        rank: detection.rank,
        mentionContext: textDetection.mentionContext,
        sentiment,
        confidence: detection.found ? 1.0 : textDetection.confidence,
        detectionDetails: {
          ...textDetection.detectionDetails,
          matchLocation: detection.found ? "sources" : textDetection.detectionDetails.matchLocation,
        },
        competitorsMentioned: competitors,
        responseText: result.content,
        tokenCount: result.tokenCount,
        latencyMs: result.latencyMs,
        cost: result.cost,
      };
    }

    // Standard OpenRouter query for all other models
    const result = await queryViaOpenRouter(model, query);
    const detection = detectBrandInText(result.content, brandUrl, brandName);
    const sentiment = analyzeSentiment(result.content, [brandUrl, brandName || ""]);
    const competitors = extractCompetitorMentions(result.content, brandUrl, brandName);

    // For Perplexity, try to parse citations from response
    let sources: GroundingSource[] | undefined;
    let rank: number | undefined;

    if (model.supportsGrounding && modelId.startsWith("perplexity")) {
      // Perplexity includes citations in the response - parse them
      const citationMatches = result.content.matchAll(/\[(\d+)\]/g);
      const citations = [...citationMatches];
      // Note: Full citation parsing would require response metadata from Perplexity
      // For now, we do text-based detection
    }

    return {
      modelId,
      status: "complete",
      found: detection.found,
      detectionMethod: model.supportsGrounding ? "grounded" : "text-match",
      sources,
      rank,
      mentionContext: detection.mentionContext,
      sentiment,
      confidence: detection.confidence,
      detectionDetails: detection.detectionDetails,
      competitorsMentioned: competitors,
      responseText: result.content,
      tokenCount: result.tokenCount,
      latencyMs: result.latencyMs,
      cost: result.cost,
    };
  } catch (error: any) {
    return {
      modelId,
      status: "error",
      found: false,
      detectionMethod: model.supportsGrounding ? "grounded" : "text-match",
      sentiment: "neutral",
      confidence: 0,
      cost: 0,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Test visibility for multiple models in parallel
 */
export async function testModelsParallel(
  modelIds: LLMModelId[],
  query: string,
  brandUrl: string,
  brandName?: string
): Promise<Record<LLMModelId, ModelVisibilityResult>> {
  const results = await Promise.allSettled(
    modelIds.map((modelId) => testModelVisibility(modelId, query, brandUrl, brandName))
  );

  const resultMap: Record<LLMModelId, ModelVisibilityResult> = {} as any;

  results.forEach((result, index) => {
    const modelId = modelIds[index];
    if (result.status === "fulfilled") {
      resultMap[modelId] = result.value;
    } else {
      resultMap[modelId] = {
        modelId,
        status: "error",
        found: false,
        detectionMethod: "text-match",
        sentiment: "neutral",
        confidence: 0,
        cost: 0,
        error: result.reason?.message || "Unknown error",
      };
    }
  });

  return resultMap;
}

/**
 * Test visibility for a query across all selected models
 */
export async function testQueryVisibility(
  query: VisibilityQuery,
  modelIds: LLMModelId[],
  brandUrl: string,
  brandName?: string
): Promise<QueryVisibilityResult> {
  const modelResults = await testModelsParallel(modelIds, query.text, brandUrl, brandName);

  // Calculate aggregate metrics
  const models = modelIds.map((id) => LLM_MODELS[id]);
  const results = Object.values(modelResults);
  const foundResults = results.filter((r) => r.found);

  const citationRate = results.length > 0 ? (foundResults.length / results.length) * 100 : 0;

  const searchPlatformsCited = foundResults.filter((r) => {
    const model = LLM_MODELS[r.modelId];
    return model.platformType === "search";
  }).length;

  const chatPlatformsMentioned = foundResults.filter((r) => {
    const model = LLM_MODELS[r.modelId];
    return model.platformType === "chat";
  }).length;

  const sentimentScores: number[] = results.map((r) => {
    if (r.sentiment === "positive") return 1;
    if (r.sentiment === "negative") return -1;
    return 0;
  });
  const averageSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    : 0;

  const rankedResults = foundResults.filter((r) => r.rank !== undefined);
  const averageRank = rankedResults.length > 0
    ? rankedResults.reduce((sum, r) => sum + (r.rank || 0), 0) / rankedResults.length
    : null;

  return {
    query,
    modelResults,
    citationRate,
    searchPlatformsCited,
    chatPlatformsMentioned,
    averageSentiment,
    averageRank,
  };
}

// ============================================
// Cost Estimation
// ============================================

/**
 * Estimate cost for a visibility test configuration
 */
export function estimateTestCost(config: VisibilityTestConfig): number {
  const { queries, models, executionMode, selectedModel, selectedQuery } = config;

  let numQueries = 0;
  let numModels = 0;

  switch (executionMode) {
    case "all-queries-all-models":
      numQueries = queries.filter((q) => q.selected).length;
      numModels = models.length;
      break;
    case "all-queries-one-model":
      numQueries = queries.filter((q) => q.selected).length;
      numModels = 1;
      break;
    case "one-query-all-models":
      numQueries = 1;
      numModels = models.length;
      break;
  }

  // Estimate ~500 tokens per query (input + output)
  const tokensPerQuery = 500;
  let totalCost = 0;

  const modelsToUse = executionMode === "all-queries-one-model" && selectedModel
    ? [selectedModel]
    : models;

  for (const modelId of modelsToUse) {
    const model = LLM_MODELS[modelId];
    const inputCost = (tokensPerQuery * 0.3 / 1_000_000) * model.costPer1MInput;
    const outputCost = (tokensPerQuery * 0.7 / 1_000_000) * model.costPer1MOutput;
    totalCost += (inputCost + outputCost) * numQueries;
  }

  return totalCost;
}

/**
 * Get models by platform type
 */
export function getModelsByPlatformType(type: "search" | "chat"): LLMModel[] {
  return Object.values(LLM_MODELS).filter((m) => m.platformType === type);
}

/**
 * Get models by cost tier
 */
export function getModelsByCostTier(tier: "budget" | "premium"): LLMModel[] {
  return Object.values(LLM_MODELS).filter((m) => m.costTier === tier);
}
