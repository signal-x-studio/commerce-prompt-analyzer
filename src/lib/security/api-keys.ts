/**
 * Centralized API Key Management
 *
 * Provides secure, centralized access to API keys with:
 * - Single source of truth for key access
 * - Validation on startup
 * - Budget limit configuration per provider
 * - Model allowlists for security
 */

type ProviderScope = "gemini" | "openai" | "tavily" | "openrouter";

interface ProviderConfig {
  key: string | undefined;
  budgetLimit: number;
  isRequired: boolean;
}

interface ModelConfig {
  id: string;
  displayName: string;
  costPer1MInput: number;
  costPer1MOutput: number;
}

// OpenRouter model allowlist for security and cost control
export const OPENROUTER_ALLOWED_MODELS: Record<string, ModelConfig> = {
  gemini: {
    id: "google/gemini-2.0-flash-001",
    displayName: "Gemini 2.0 Flash",
    costPer1MInput: 0.10,
    costPer1MOutput: 0.40,
  },
  gpt4o: {
    id: "openai/gpt-4o",
    displayName: "GPT-4o",
    costPer1MInput: 2.50,
    costPer1MOutput: 10.00,
  },
  claude: {
    id: "anthropic/claude-3-5-sonnet-20241022",
    displayName: "Claude 3.5 Sonnet",
    costPer1MInput: 3.00,
    costPer1MOutput: 15.00,
  },
  llama: {
    id: "meta-llama/llama-3.1-70b-instruct",
    displayName: "Llama 3.1 70B",
    costPer1MInput: 0.52,
    costPer1MOutput: 0.75,
  },
} as const;

// Council engine IDs
export type CouncilEngineId = keyof typeof OPENROUTER_ALLOWED_MODELS;

class APIKeyManager {
  private providers: Record<ProviderScope, ProviderConfig>;
  private initialized = false;

  constructor() {
    this.providers = {
      gemini: {
        key: undefined,
        budgetLimit: 10,
        isRequired: true,
      },
      openai: {
        key: undefined,
        budgetLimit: 20,
        isRequired: false,
      },
      tavily: {
        key: undefined,
        budgetLimit: 5,
        isRequired: false,
      },
      openrouter: {
        key: undefined,
        budgetLimit: 30,
        isRequired: false, // Required for council mode, optional otherwise
      },
    };
  }

  /**
   * Initialize provider configs from environment variables
   * Called lazily on first access
   */
  private initialize(): void {
    if (this.initialized) return;

    // Load API keys from environment
    this.providers.gemini.key =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.API_KEY;

    this.providers.openai.key = process.env.OPENAI_API_KEY;
    this.providers.tavily.key = process.env.TAVILY_API_KEY;
    this.providers.openrouter.key = process.env.OPENROUTER_API_KEY;

    // Load budget limits from environment (defaults above)
    const geminiLimit = process.env.GEMINI_BUDGET_LIMIT;
    if (geminiLimit) this.providers.gemini.budgetLimit = parseFloat(geminiLimit);

    const openaiLimit = process.env.OPENAI_BUDGET_LIMIT;
    if (openaiLimit) this.providers.openai.budgetLimit = parseFloat(openaiLimit);

    const openrouterLimit = process.env.OPENROUTER_BUDGET_LIMIT;
    if (openrouterLimit)
      this.providers.openrouter.budgetLimit = parseFloat(openrouterLimit);

    this.initialized = true;
  }

  /**
   * Get API key for a provider
   * @throws Error if required key is missing
   */
  getKey(provider: ProviderScope): string {
    this.initialize();

    const config = this.providers[provider];
    if (!config.key) {
      if (config.isRequired) {
        throw new APIKeyError(
          `Required API key not configured: ${provider.toUpperCase()}_API_KEY`
        );
      }
      throw new APIKeyError(
        `API key not configured: ${provider.toUpperCase()}_API_KEY`
      );
    }

    return config.key;
  }

  /**
   * Check if a provider is configured (has API key)
   */
  isConfigured(provider: ProviderScope): boolean {
    this.initialize();
    return !!this.providers[provider].key;
  }

  /**
   * Get budget limit for a provider
   */
  getBudgetLimit(provider: ProviderScope): number {
    this.initialize();
    return this.providers[provider].budgetLimit;
  }

  /**
   * Get global daily budget limit
   */
  getGlobalBudgetLimit(): number {
    const limit = process.env.GLOBAL_DAILY_BUDGET;
    return limit ? parseFloat(limit) : 50;
  }

  /**
   * Validate that required providers are configured
   * Call this on server startup
   */
  validateRequiredKeys(): void {
    this.initialize();

    const missing: string[] = [];
    for (const [provider, config] of Object.entries(this.providers)) {
      if (config.isRequired && !config.key) {
        missing.push(provider);
      }
    }

    if (missing.length > 0) {
      console.warn(
        `[API Keys] Missing required keys: ${missing.join(", ")}`
      );
    }
  }

  /**
   * Check if council mode is available (OpenRouter configured)
   */
  isCouncilModeAvailable(): boolean {
    return this.isConfigured("openrouter");
  }

  /**
   * Get OpenRouter model ID from council engine ID
   */
  getOpenRouterModelId(councilEngineId: CouncilEngineId): string {
    const model = OPENROUTER_ALLOWED_MODELS[councilEngineId];
    if (!model) {
      throw new APIKeyError(`Unknown council engine: ${councilEngineId}`);
    }
    return model.id;
  }

  /**
   * Validate that a model ID is in the allowlist
   */
  isModelAllowed(modelId: string): boolean {
    return Object.values(OPENROUTER_ALLOWED_MODELS).some(
      (model) => model.id === modelId
    );
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(
    councilEngineId: CouncilEngineId,
    inputTokens: number,
    outputTokens: number = 500
  ): number {
    const model = OPENROUTER_ALLOWED_MODELS[councilEngineId];
    if (!model) return 0;

    const inputCost = (inputTokens / 1_000_000) * model.costPer1MInput;
    const outputCost = (outputTokens / 1_000_000) * model.costPer1MOutput;

    return inputCost + outputCost;
  }

  /**
   * Get list of available council engines
   */
  getAvailableCouncilEngines(): CouncilEngineId[] {
    if (!this.isCouncilModeAvailable()) {
      return [];
    }
    return Object.keys(OPENROUTER_ALLOWED_MODELS) as CouncilEngineId[];
  }
}

/**
 * Custom error for API key issues
 */
export class APIKeyError extends Error {
  public readonly statusCode = 500;

  constructor(message: string) {
    super(message);
    this.name = "APIKeyError";
  }
}

// Singleton instance
export const apiKeyManager = new APIKeyManager();

// Export for convenience
export function getGeminiKey(): string {
  return apiKeyManager.getKey("gemini");
}

export function getOpenAIKey(): string {
  return apiKeyManager.getKey("openai");
}

export function getTavilyKey(): string {
  return apiKeyManager.getKey("tavily");
}

export function getOpenRouterKey(): string {
  return apiKeyManager.getKey("openrouter");
}
