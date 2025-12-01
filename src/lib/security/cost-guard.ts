/**
 * Cost Guard
 *
 * Provides cost estimation and budget enforcement for API calls.
 * Prevents runaway costs from excessive API usage.
 */

import { OPENROUTER_ALLOWED_MODELS, type CouncilEngineId } from "./api-keys";

// Cost thresholds
export const COST_LIMITS = {
  // Per-request limits
  singleRequest: 0.10, // $0.10 max per single model query
  councilSession: 1.00, // $1.00 max per council session (4 models + eval + synth)

  // Per-session limits (tracked client-side)
  warningThreshold: 5.00, // Show warning at $5
  hardLimit: 10.00, // Block at $10 (require explicit confirmation)

  // Rate-based limits
  requestsPerMinute: 10,
  costPerMinute: 0.50, // $0.50/min max spend rate
} as const;

// Average tokens per query (used for estimation)
const AVERAGE_TOKENS = {
  input: 500, // Average prompt tokens
  output: 800, // Average completion tokens
  evaluation: 1200, // Evaluation prompts are longer
  synthesis: 1000, // Synthesis output is substantial
} as const;

export interface CostEstimate {
  totalCost: number;
  breakdown: {
    engineId: CouncilEngineId;
    estimatedCost: number;
    inputTokens: number;
    outputTokens: number;
  }[];
  withinBudget: boolean;
  warnings: string[];
}

/**
 * Estimate cost for a single model query
 */
export function estimateSingleQueryCost(engineId: CouncilEngineId): number {
  const model = OPENROUTER_ALLOWED_MODELS[engineId];
  if (!model) return 0;

  const inputCost = (AVERAGE_TOKENS.input / 1_000_000) * model.costPer1MInput;
  const outputCost = (AVERAGE_TOKENS.output / 1_000_000) * model.costPer1MOutput;

  return inputCost + outputCost;
}

/**
 * Estimate total cost for a council session
 */
export function estimateCouncilSessionCost(
  engines: CouncilEngineId[],
  judgeEngine: CouncilEngineId,
  enableSynthesis: boolean
): CostEstimate {
  const breakdown: CostEstimate["breakdown"] = [];
  const warnings: string[] = [];

  // Calculate cost for each query engine
  engines.forEach((engineId) => {
    const model = OPENROUTER_ALLOWED_MODELS[engineId];
    if (!model) return;

    const inputCost = (AVERAGE_TOKENS.input / 1_000_000) * model.costPer1MInput;
    const outputCost = (AVERAGE_TOKENS.output / 1_000_000) * model.costPer1MOutput;

    breakdown.push({
      engineId,
      estimatedCost: inputCost + outputCost,
      inputTokens: AVERAGE_TOKENS.input,
      outputTokens: AVERAGE_TOKENS.output,
    });
  });

  // Add evaluation cost (judge reviews all responses)
  const judgeModel = OPENROUTER_ALLOWED_MODELS[judgeEngine];
  if (judgeModel) {
    const evalInputTokens = AVERAGE_TOKENS.evaluation * engines.length;
    const evalOutputTokens = AVERAGE_TOKENS.output;

    const evalCost =
      (evalInputTokens / 1_000_000) * judgeModel.costPer1MInput +
      (evalOutputTokens / 1_000_000) * judgeModel.costPer1MOutput;

    breakdown.push({
      engineId: judgeEngine,
      estimatedCost: evalCost,
      inputTokens: evalInputTokens,
      outputTokens: evalOutputTokens,
    });
  }

  // Add synthesis cost if enabled
  if (enableSynthesis && judgeModel) {
    const synthInputTokens = AVERAGE_TOKENS.synthesis * engines.length;
    const synthOutputTokens = AVERAGE_TOKENS.synthesis;

    const synthCost =
      (synthInputTokens / 1_000_000) * judgeModel.costPer1MInput +
      (synthOutputTokens / 1_000_000) * judgeModel.costPer1MOutput;

    breakdown.push({
      engineId: judgeEngine,
      estimatedCost: synthCost,
      inputTokens: synthInputTokens,
      outputTokens: synthOutputTokens,
    });
  }

  const totalCost = breakdown.reduce((sum, b) => sum + b.estimatedCost, 0);

  // Check against limits
  if (totalCost > COST_LIMITS.councilSession) {
    warnings.push(
      `Estimated cost ($${totalCost.toFixed(4)}) exceeds council session limit ($${COST_LIMITS.councilSession})`
    );
  }

  return {
    totalCost,
    breakdown,
    withinBudget: totalCost <= COST_LIMITS.councilSession,
    warnings,
  };
}

/**
 * Validate that a request is within cost limits
 */
export function validateRequestCost(
  estimatedCost: number,
  sessionTotalCost: number = 0
): { allowed: boolean; reason?: string } {
  // Check single request limit
  if (estimatedCost > COST_LIMITS.singleRequest) {
    return {
      allowed: false,
      reason: `Request cost ($${estimatedCost.toFixed(4)}) exceeds per-request limit ($${COST_LIMITS.singleRequest})`,
    };
  }

  // Check session total
  const newTotal = sessionTotalCost + estimatedCost;
  if (newTotal > COST_LIMITS.hardLimit) {
    return {
      allowed: false,
      reason: `Session total ($${newTotal.toFixed(2)}) would exceed hard limit ($${COST_LIMITS.hardLimit})`,
    };
  }

  // Warning threshold (allow but warn)
  if (newTotal > COST_LIMITS.warningThreshold) {
    return {
      allowed: true,
      reason: `Session total ($${newTotal.toFixed(2)}) exceeds warning threshold ($${COST_LIMITS.warningThreshold})`,
    };
  }

  return { allowed: true };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.0001) {
    return "<$0.0001";
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Get cost breakdown summary for UI display
 */
export function getCostSummary(estimate: CostEstimate): string {
  const lines = [
    `Total Estimated Cost: ${formatCost(estimate.totalCost)}`,
    "",
    "Breakdown:",
  ];

  estimate.breakdown.forEach((b) => {
    lines.push(`  ${b.engineId}: ${formatCost(b.estimatedCost)}`);
  });

  if (estimate.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    estimate.warnings.forEach((w) => lines.push(`  - ${w}`));
  }

  return lines.join("\n");
}

/**
 * Calculate actual cost from token usage
 */
export function calculateActualCost(
  engineId: CouncilEngineId,
  promptTokens: number,
  completionTokens: number
): number {
  const model = OPENROUTER_ALLOWED_MODELS[engineId];
  if (!model) return 0;

  const inputCost = (promptTokens / 1_000_000) * model.costPer1MInput;
  const outputCost = (completionTokens / 1_000_000) * model.costPer1MOutput;

  return inputCost + outputCost;
}
