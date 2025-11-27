// Pricing for Gemini 2.0 Flash (approximate)
// Input: $0.10 / 1M tokens
// Output: $0.40 / 1M tokens
const PRICE_PER_MILLION_INPUT = 0.10;
const PRICE_PER_MILLION_OUTPUT = 0.40;

// Estimated average tokens per test
const AVG_INPUT_TOKENS = 2000; // Prompt + Grounding context
const AVG_OUTPUT_TOKENS = 500; // Response

export const calculateEstimatedCost = (numPrompts: number, numEngines: number): number => {
  if (numPrompts === 0 || numEngines === 0) return 0;

  const totalTests = numPrompts * numEngines;
  
  const inputCost = (totalTests * AVG_INPUT_TOKENS / 1_000_000) * PRICE_PER_MILLION_INPUT;
  const outputCost = (totalTests * AVG_OUTPUT_TOKENS / 1_000_000) * PRICE_PER_MILLION_OUTPUT;

  return inputCost + outputCost;
};
