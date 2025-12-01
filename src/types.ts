export interface CatalogStructure {
  mainCategory: string;
  subcategories: string[];
  facets: { name: string; options: string[] }[];
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface CategoryPrompts {
  subcategory: string;
  prompts: string[];
  usage?: UsageMetadata;
}

export interface GenerationResult {
  promptsByCategory: CategoryPrompts[];
  thinking: string;
  sources: string;
}

// Types for Answerability Testing
export type TestStatus =
  | "untested"
  | "testing"
  | "found"
  | "not-found"
  | "error";

export interface GroundingSource {
  uri: string;
  title: string;
  rank?: number;
}

export interface TestResult {
  status: TestStatus;
  sources?: GroundingSource[];
  rank?: number | null;
  sentiment?: "positive" | "negative" | "neutral";
  answerText?: string;
  error?: string;
}

export type EngineId =
  | "gemini_grounded"
  | "competitor_ai"
  | "gpt4o"
  | "technical_ai";

export interface Engine {
  id: EngineId;
  name: string;
  description: string;
  systemInstruction: string;
}

export const ENGINES: Record<EngineId, Engine> = {
  gemini_grounded: {
    id: "gemini_grounded",
    name: "Gemini Grounded Search",
    description: "Standard, balanced search grounding.",
    systemInstruction:
      "You are a helpful assistant. Use Google Search to find the answer.",
  },
  competitor_ai: {
    id: "competitor_ai",
    name: "Competitor Research AI",
    description: "Focuses on finding direct competitors and review sites.",
    systemInstruction:
      "You are a market researcher. Identify top competitors and review sites.",
  },
  gpt4o: {
    id: "gpt4o",
    name: "OpenAI GPT-4o",
    description: "General purpose reasoning model (no live search).",
    systemInstruction: "You are a helpful assistant.",
  },
  technical_ai: {
    id: "technical_ai",
    name: "Technical Deep-Dive AI",
    description: "Prioritizes forums, blogs, and technical documentation.",
    systemInstruction:
      "You are a technical researcher. Use Google Search to find technical specifications, expert blogs, forums (like Reddit, Stack Overflow), and documentation related to the user's query. Prioritize informational and community-driven sources.",
  },
};

export interface DiagnosisResult {
  status: "INVISIBLE" | "FILTERED" | "FOUND_IN_SEARCH" | "ERROR";
  message: string;
  searchRank?: number;
  foundUrl?: string;
}

// ============================================
// LLM Platform Configuration (Unified)
// ============================================

/**
 * Platform type determines detection method:
 * - "search": Has web search/grounding, returns real citations (drives traffic)
 * - "chat": Knowledge-based only, detects brand mentions (drives awareness)
 */
export type PlatformType = "search" | "chat";

/**
 * Cost tier for model selection
 * - "budget": Consumer free-tier equivalent, cheapest
 * - "premium": Consumer paid-tier equivalent, better quality
 */
export type CostTier = "budget" | "premium";

/**
 * All available model IDs
 */
export type LLMModelId =
  | "gemini-flash"      // Google AI - Budget
  | "gemini-pro"        // Google AI - Premium
  | "perplexity"        // Perplexity - Budget
  | "perplexity-pro"    // Perplexity - Premium
  | "gpt4o-mini"        // ChatGPT - Budget
  | "gpt4o"             // ChatGPT - Premium
  | "claude-haiku"      // Claude - Budget
  | "claude-sonnet"     // Claude - Premium
  | "llama"             // Meta AI - Budget
  | "gemini-grounded";  // Google AI with grounding (special case)

export interface LLMModel {
  id: LLMModelId;
  name: string;
  provider: string;
  consumerProduct: string;      // What consumer tool uses this
  platformType: PlatformType;
  costTier: CostTier;
  openRouterId: string;         // OpenRouter model ID
  costPer1MInput: number;
  costPer1MOutput: number;
  supportsGrounding?: boolean;  // Has real web search/citations
}

export const LLM_MODELS: Record<LLMModelId, LLMModel> = {
  // Google AI - Search platform (with grounding)
  "gemini-flash": {
    id: "gemini-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    consumerProduct: "Google AI / Search",
    platformType: "search",
    costTier: "budget",
    openRouterId: "google/gemini-2.0-flash-001",
    costPer1MInput: 0.075,
    costPer1MOutput: 0.30,
    supportsGrounding: true,
  },
  "gemini-pro": {
    id: "gemini-pro",
    name: "Gemini 2.0 Pro",
    provider: "Google",
    consumerProduct: "Gemini Advanced",
    platformType: "search",
    costTier: "premium",
    openRouterId: "google/gemini-2.0-pro-exp-02-05",
    costPer1MInput: 1.25,
    costPer1MOutput: 5.00,
    supportsGrounding: true,
  },
  "gemini-grounded": {
    id: "gemini-grounded",
    name: "Gemini Grounded Search",
    provider: "Google",
    consumerProduct: "Google AI Overviews",
    platformType: "search",
    costTier: "budget",
    openRouterId: "google/gemini-2.0-flash-001", // Uses direct Gemini API with grounding
    costPer1MInput: 0.075,
    costPer1MOutput: 0.30,
    supportsGrounding: true,
  },

  // Perplexity - Search platform (native citations)
  "perplexity": {
    id: "perplexity",
    name: "Perplexity Sonar",
    provider: "Perplexity",
    consumerProduct: "Perplexity Free",
    platformType: "search",
    costTier: "budget",
    openRouterId: "perplexity/sonar",
    costPer1MInput: 1.00,
    costPer1MOutput: 1.00,
    supportsGrounding: true,
  },
  "perplexity-pro": {
    id: "perplexity-pro",
    name: "Perplexity Sonar Pro",
    provider: "Perplexity",
    consumerProduct: "Perplexity Pro",
    platformType: "search",
    costTier: "premium",
    openRouterId: "perplexity/sonar-pro",
    costPer1MInput: 3.00,
    costPer1MOutput: 15.00,
    supportsGrounding: true,
  },

  // OpenAI - Chat platform
  "gpt4o-mini": {
    id: "gpt4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    consumerProduct: "ChatGPT Free",
    platformType: "chat",
    costTier: "budget",
    openRouterId: "openai/gpt-4o-mini",
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
  },
  "gpt4o": {
    id: "gpt4o",
    name: "GPT-4o",
    provider: "OpenAI",
    consumerProduct: "ChatGPT Plus",
    platformType: "chat",
    costTier: "premium",
    openRouterId: "openai/gpt-4o",
    costPer1MInput: 2.50,
    costPer1MOutput: 10.00,
  },

  // Anthropic - Chat platform
  "claude-haiku": {
    id: "claude-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    consumerProduct: "Claude Free",
    platformType: "chat",
    costTier: "budget",
    openRouterId: "anthropic/claude-3-5-haiku-20241022",
    costPer1MInput: 0.80,
    costPer1MOutput: 4.00,
  },
  "claude-sonnet": {
    id: "claude-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    consumerProduct: "Claude Pro",
    platformType: "chat",
    costTier: "premium",
    openRouterId: "anthropic/claude-3-5-sonnet-20241022",
    costPer1MInput: 3.00,
    costPer1MOutput: 15.00,
  },

  // Meta - Chat platform
  "llama": {
    id: "llama",
    name: "Llama 3.1 70B",
    provider: "Meta",
    consumerProduct: "Meta AI",
    platformType: "chat",
    costTier: "budget",
    openRouterId: "meta-llama/llama-3.1-70b-instruct",
    costPer1MInput: 0.52,
    costPer1MOutput: 0.75,
  },
};

/**
 * Model presets for quick selection
 */
export type ModelPreset = "quick" | "balanced" | "comprehensive" | "custom";

export const MODEL_PRESETS: Record<ModelPreset, { name: string; description: string; models: LLMModelId[] }> = {
  quick: {
    name: "Quick Check",
    description: "2 models, ~$0.01/query",
    models: ["gemini-flash", "gpt4o-mini"],
  },
  balanced: {
    name: "Balanced",
    description: "4 models, ~$0.02/query",
    models: ["gemini-flash", "perplexity", "gpt4o-mini", "claude-haiku"],
  },
  comprehensive: {
    name: "Comprehensive",
    description: "6 models, ~$0.05/query",
    models: ["gemini-flash", "perplexity", "gpt4o-mini", "gpt4o", "claude-haiku", "llama"],
  },
  custom: {
    name: "Custom",
    description: "Select your own models",
    models: [],
  },
};

// ============================================
// Legacy Council Types (to be removed)
// Keeping temporarily for backward compatibility
// ============================================

export type CouncilEngineId = "gemini" | "gpt4o" | "claude" | "llama";

export interface CouncilEngine {
  id: CouncilEngineId;
  name: string;
  description: string;
  provider: string;
}

export const COUNCIL_ENGINES: Record<CouncilEngineId, CouncilEngine> = {
  gemini: {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    description: "Google's fast multimodal model",
    provider: "Google",
  },
  gpt4o: {
    id: "gpt4o",
    name: "GPT-4o",
    description: "OpenAI's flagship model",
    provider: "OpenAI",
  },
  claude: {
    id: "claude",
    name: "Claude 3.5 Sonnet",
    description: "Anthropic's balanced model",
    provider: "Anthropic",
  },
  llama: {
    id: "llama",
    name: "Llama 3.1 70B",
    description: "Meta's open-weight model",
    provider: "Meta",
  },
};

export interface CouncilConfig {
  engines: CouncilEngineId[];
  judgeEngine: CouncilEngineId;
  enableSynthesis: boolean;
}

export interface CouncilEngineResponse {
  engineId: CouncilEngineId;
  content: string;
  tokenCount: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  latencyMs: number;
  rank?: number;
  found?: boolean;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface CouncilRanking {
  engineId: CouncilEngineId;
  finalRank: number;
  averageRank: number;
  agreementScore: number;
}

export interface CouncilEvaluation {
  judgeEngine: CouncilEngineId;
  rankings: CouncilRanking[];
  reasoning: string;
  timestamp: number;
}

export interface CouncilResult {
  sessionId: string;
  prompt: string;
  userUrl: string;
  engineResponses: CouncilEngineResponse[];
  evaluation: CouncilEvaluation;
  synthesizedContent?: string;
  winner: CouncilEngineId;
  consensusLevel: "strong" | "moderate" | "weak" | "none";
  totalCost: number;
  totalLatencyMs: number;
}

// SSE Event types for streaming
export type CouncilStreamEventType =
  | "stage"
  | "engine_start"
  | "engine_complete"
  | "engine_error"
  | "evaluation_start"
  | "evaluation_complete"
  | "synthesis_start"
  | "synthesis_complete"
  | "rankings"
  | "complete"
  | "error";

export interface CouncilStreamEvent {
  type: CouncilStreamEventType;
  data: Record<string, unknown>;
  timestamp: number;
}

// Council session state for UI
export type CouncilSessionStatus =
  | "idle"
  | "querying"
  | "evaluating"
  | "synthesizing"
  | "complete"
  | "error";

export interface CouncilSessionState {
  status: CouncilSessionStatus;
  currentStage: number;
  stageName: string;
  engineStatuses: Record<CouncilEngineId, "pending" | "loading" | "complete" | "error">;
  engineResponses: Partial<Record<CouncilEngineId, CouncilEngineResponse>>;
  rankings?: CouncilRanking[];
  winner?: CouncilEngineId;
  synthesizedContent?: string;
  error?: string;
  totalCost: number;
}

// ============================================
// Brand Visibility Assessment Types
// ============================================

export interface BrandMention {
  engineId: CouncilEngineId;
  found: boolean;
  sentiment: "positive" | "negative" | "neutral";
  mentionContext?: string;
  rank?: number; // Position in recommendations if applicable
  confidence: number; // 0-1 confidence score
}

export interface BrandVisibilityScore {
  overall: number; // 0-100 composite score
  citationRate: number; // % of engines that cited the brand
  averageSentiment: number; // -1 to 1 (negative to positive)
  averageRank: number | null; // Average position when cited
  consensusLevel: "strong" | "moderate" | "weak" | "none";
}

export interface BrandVisibilityResult {
  query: string;
  brandUrl: string;
  brandName?: string;
  timestamp: number;
  mentions: BrandMention[];
  score: BrandVisibilityScore;
  engineResponses: Partial<Record<CouncilEngineId, CouncilEngineResponse>>;
  recommendations: string[];
  totalCost: number;
}

export interface QuickAssessmentConfig {
  engines: CouncilEngineId[];
  brandUrl: string;
  brandName?: string;
  customPrompt?: string;
}

// Batch council mode for existing flow
export interface BatchCouncilResult {
  prompt: string;
  visibilityResult: BrandVisibilityResult;
}

export interface BatchCouncilSummary {
  totalPrompts: number;
  averageVisibilityScore: number;
  citationRateByEngine: Record<CouncilEngineId, number>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topPerformingPrompts: string[];
  problemPrompts: string[];
  totalCost: number;
}

// ============================================
// Unified Visibility Analysis Types (New)
// ============================================

/**
 * Query source - how the query was generated/discovered
 */
export type QuerySource = "url-generated" | "ai-suggested" | "industry-template" | "custom";

/**
 * A query to test for visibility
 */
export interface VisibilityQuery {
  id: string;
  text: string;
  source: QuerySource;
  category?: string;     // e.g., "Product Search", "Comparison", "Review"
  selected: boolean;
}

/**
 * Competitor mention found in response
 */
export interface CompetitorMention {
  name: string;              // Brand/company name
  url?: string;              // Website if mentioned
  context?: string;          // Surrounding text
  sentiment?: "positive" | "negative" | "neutral";
}

/**
 * Brand detection details - explains what we searched for and found
 */
export interface BrandDetectionDetails {
  searchedFor: string[];           // Brand variations we looked for
  matchedTerm?: string;            // Which term actually matched
  matchLocation?: "url" | "text" | "sources";  // Where the match was found
}

/**
 * Detection result for a single model
 */
export interface ModelVisibilityResult {
  modelId: LLMModelId;
  status: "pending" | "loading" | "complete" | "error";

  // Core results
  found: boolean;                              // Was brand cited/mentioned?
  detectionMethod: "grounded" | "text-match";  // How was it detected?

  // For grounded/search platforms
  sources?: GroundingSource[];                 // Actual cited URLs
  rank?: number;                               // Position in citations

  // For all platforms
  mentionContext?: string;                     // Surrounding text if mentioned
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;                          // 0-1 confidence in detection

  // Detection explanation
  detectionDetails?: BrandDetectionDetails;

  // Competitor analysis
  competitorsMentioned?: CompetitorMention[];

  // Response data
  responseText?: string;
  tokenCount?: { prompt: number; completion: number; total: number };
  latencyMs?: number;
  cost: number;
  error?: string;
}

/**
 * Result for a single query across all selected models
 */
export interface QueryVisibilityResult {
  query: VisibilityQuery;
  modelResults: Record<LLMModelId, ModelVisibilityResult>;

  // Aggregate metrics for this query
  citationRate: number;           // % of models that found brand
  searchPlatformsCited: number;   // # of search platforms that cited (drives traffic)
  chatPlatformsMentioned: number; // # of chat platforms that mentioned (awareness)
  averageSentiment: number;       // -1 to 1
  averageRank: number | null;     // Average rank when cited
}

/**
 * Overall visibility analysis result
 */
export interface VisibilityAnalysisResult {
  // Input
  brandUrl: string;
  brandName?: string;
  queries: VisibilityQuery[];
  models: LLMModelId[];

  // Per-query results
  queryResults: QueryVisibilityResult[];

  // Aggregate scores
  overallScore: number;                        // 0-100 composite
  searchVisibilityScore: number;               // 0-100 for search platforms
  chatAwarenessScore: number;                  // 0-100 for chat platforms

  // By-model breakdown
  citationRateByModel: Record<LLMModelId, number>;

  // By-platform-type breakdown
  citationRateByPlatformType: {
    search: number;
    chat: number;
  };

  // Competitor analysis
  competitorMentions: {
    domain: string;
    mentionCount: number;
    platforms: LLMModelId[];
  }[];

  // Recommendations
  recommendations: string[];

  // Metadata
  totalCost: number;
  totalLatencyMs: number;
  timestamp: number;
}

/**
 * Execution mode for running tests
 */
export type ExecutionMode =
  | "all-queries-all-models"   // Full matrix
  | "all-queries-one-model"    // Deep dive on one model
  | "one-query-all-models";    // Spot check across models

/**
 * Configuration for a visibility test run
 */
export interface VisibilityTestConfig {
  brandUrl: string;
  brandName?: string;
  queries: VisibilityQuery[];
  models: LLMModelId[];
  executionMode: ExecutionMode;
  selectedModel?: LLMModelId;    // For "all-queries-one-model"
  selectedQuery?: string;        // For "one-query-all-models"
}
