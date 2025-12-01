/**
 * Blind Review Utilities
 *
 * Implements anonymization for fair peer review in council mode.
 * Inspired by Karpathy's llm-council pattern to prevent model bias.
 *
 * Key features:
 * - Random shuffle to prevent position bias
 * - Blind IDs ("Response A", "Response B", etc.)
 * - Self-identifying phrase removal
 * - Secure mapping for de-anonymization
 */

import { nanoid } from "nanoid";
import type { CouncilEngineId } from "../security/api-keys";

// Response with engine identification
export interface IdentifiedResponse {
  engineId: CouncilEngineId;
  content: string;
  metadata?: {
    tokenCount?: number;
    latencyMs?: number;
    cost?: number;
  };
}

// Anonymized response for peer review
export interface BlindedResponse {
  blindId: string; // e.g., "Response A"
  content: string;
  metadata: {
    tokenCount?: number;
    // Note: latencyMs and cost removed to prevent identification
  };
}

// Mapping to restore identity after evaluation
export interface BlindMapping {
  blindId: string;
  engineId: CouncilEngineId;
  originalIndex: number;
}

// Complete blinding result
export interface BlindingResult {
  blindedResponses: BlindedResponse[];
  mapping: BlindMapping[];
  sessionId: string; // Unique session for audit trail
}

// Patterns that models commonly use to self-identify
const SELF_IDENTIFYING_PATTERNS: RegExp[] = [
  // Direct model mentions
  /\bI(?:'m| am) (?:an? )?(?:AI|artificial intelligence|language model|LLM)\b/gi,
  /\bAs (?:an? )?(?:AI|artificial intelligence|language model|assistant)\b/gi,
  /\b(?:ChatGPT|GPT-4|GPT-4o|OpenAI)\b/gi,
  /\b(?:Claude|Anthropic)\b/gi,
  /\b(?:Gemini|Google AI|Bard)\b/gi,
  /\b(?:Llama|Meta AI)\b/gi,
  /\b(?:trained by|created by|developed by) (?:OpenAI|Anthropic|Google|Meta)\b/gi,

  // Common AI disclaimer patterns
  /\bI don't have (?:real-time |current )?(?:access|information|data)\b/gi,
  /\bMy (?:knowledge|training) (?:cutoff|data) (?:is|was)\b/gi,
  /\bI cannot (?:browse|access) (?:the internet|websites|URLs)\b/gi,

  // Self-referential patterns
  /\bI(?:'m| am) not able to (?:verify|confirm|check)\b/gi,
  /\bAs a (?:large )?language model\b/gi,
];

/**
 * Fisher-Yates shuffle for cryptographically fair randomization
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use crypto for better randomness if available
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate blind ID from index (A, B, C, D, ...)
 */
function indexToBlindId(index: number): string {
  const letter = String.fromCharCode(65 + index); // 65 = 'A'
  return `Response ${letter}`;
}

/**
 * Remove self-identifying phrases from content
 * Replaces with neutral alternatives to maintain readability
 */
export function stripSelfIdentifyingPhrases(content: string): string {
  let sanitized = content;

  for (const pattern of SELF_IDENTIFYING_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      // Replace with contextually appropriate neutral text
      if (match.toLowerCase().includes("chatgpt") || match.toLowerCase().includes("gpt")) {
        return "[AI assistant]";
      }
      if (match.toLowerCase().includes("claude") || match.toLowerCase().includes("anthropic")) {
        return "[AI assistant]";
      }
      if (match.toLowerCase().includes("gemini") || match.toLowerCase().includes("google")) {
        return "[AI assistant]";
      }
      if (match.toLowerCase().includes("llama") || match.toLowerCase().includes("meta")) {
        return "[AI assistant]";
      }
      if (match.toLowerCase().includes("i'm") || match.toLowerCase().includes("i am")) {
        return "This response";
      }
      if (match.toLowerCase().includes("as a")) {
        return "Generally speaking,";
      }
      return "[...]";
    });
  }

  return sanitized;
}

/**
 * Blind responses for fair peer review
 *
 * @param responses - Array of identified model responses
 * @returns BlindingResult with anonymized responses and secure mapping
 */
export function blindResponses(responses: IdentifiedResponse[]): BlindingResult {
  const sessionId = nanoid(12); // Short but unique session ID

  // Create indexed array for tracking original positions
  const indexedResponses = responses.map((response, index) => ({
    ...response,
    originalIndex: index,
  }));

  // Shuffle to prevent position bias
  const shuffled = shuffleArray(indexedResponses);

  // Create blinded responses and mapping
  const blindedResponses: BlindedResponse[] = [];
  const mapping: BlindMapping[] = [];

  shuffled.forEach((response, newIndex) => {
    const blindId = indexToBlindId(newIndex);

    // Create blinded response with sanitized content
    blindedResponses.push({
      blindId,
      content: stripSelfIdentifyingPhrases(response.content),
      metadata: {
        tokenCount: response.metadata?.tokenCount,
        // Intentionally exclude latencyMs and cost as they could identify models
      },
    });

    // Store mapping for later de-anonymization
    mapping.push({
      blindId,
      engineId: response.engineId,
      originalIndex: response.originalIndex,
    });
  });

  return {
    blindedResponses,
    mapping,
    sessionId,
  };
}

/**
 * Restore engine identity to evaluation results
 *
 * @param blindId - The blind ID to look up (e.g., "Response A")
 * @param mapping - The mapping from blinding operation
 * @returns The original engine ID or null if not found
 */
export function unblindResponse(
  blindId: string,
  mapping: BlindMapping[]
): CouncilEngineId | null {
  const entry = mapping.find((m) => m.blindId === blindId);
  return entry?.engineId ?? null;
}

/**
 * Create a secure mapping object for client-side storage
 * Mapping should only be sent back to server after evaluation
 */
export function encodeMapping(mapping: BlindMapping[]): string {
  return Buffer.from(JSON.stringify(mapping)).toString("base64");
}

/**
 * Decode mapping from client
 */
export function decodeMapping(encoded: string): BlindMapping[] {
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    return JSON.parse(decoded) as BlindMapping[];
  } catch {
    throw new Error("Invalid mapping data");
  }
}

/**
 * Validate that all expected engines have responses in the blinding result
 */
export function validateBlindingCompleteness(
  result: BlindingResult,
  expectedEngines: CouncilEngineId[]
): { valid: boolean; missing: CouncilEngineId[] } {
  const presentEngines = new Set(result.mapping.map((m) => m.engineId));
  const missing = expectedEngines.filter((e) => !presentEngines.has(e));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Format blinded responses for inclusion in evaluation prompt
 */
export function formatBlindedResponsesForPrompt(
  blindedResponses: BlindedResponse[]
): string {
  return blindedResponses
    .map(
      (r) => `=== ${r.blindId} ===
${r.content}
`
    )
    .join("\n");
}
