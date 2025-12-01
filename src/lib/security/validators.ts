import { z } from "zod";

// Blocked private/internal network patterns for SSRF protection
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./, // Link-local
  /^::1$/, // IPv6 localhost
  /^fc00:/i, // IPv6 private
  /^fe80:/i, // IPv6 link-local
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
];

// Prompt injection detection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /disregard\s+(your|the|all)\s+(previous\s+)?instructions/i,
  /you are now/i,
  /pretend\s+(you are|to be)/i,
  /new persona/i,
  /roleplay as/i,
  /jailbreak/i,
  /bypass\s+(your|the)\s+(rules|restrictions)/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /system:\s*you are/i,
];

/**
 * URL validation schema with SSRF protection
 * Validates that URL is well-formed and doesn't point to internal networks
 */
export const urlSchema = z
  .string()
  .min(1, "URL is required")
  .max(2048, "URL must be less than 2048 characters")
  .url("Invalid URL format")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "Only HTTP/HTTPS URLs are allowed" }
  )
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const hostname = parsed.hostname;
        return !PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
      } catch {
        return false;
      }
    },
    { message: "URL points to internal/private network (not allowed)" }
  );

/**
 * Prompt validation schema with injection detection
 */
export const promptSchema = z
  .string()
  .min(1, "Prompt is required")
  .max(2000, "Prompt must be less than 2000 characters")
  .refine(
    (text) => !INJECTION_PATTERNS.some((pattern) => pattern.test(text)),
    { message: "Potential prompt injection detected" }
  );

/**
 * Engine ID validation for existing engines
 */
export const engineIdSchema = z.enum([
  "gemini_grounded",
  "competitor_ai",
  "gpt4o",
  "technical_ai",
]);

/**
 * Council engine ID validation for council mode
 */
export const councilEngineIdSchema = z.enum([
  "gemini",
  "gpt4o",
  "claude",
  "llama",
]);

/**
 * Engine object validation
 */
export const engineSchema = z.object({
  id: engineIdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  systemInstruction: z.string().max(1000),
});

/**
 * Catalog structure validation
 */
export const catalogStructureSchema = z.object({
  mainCategory: z.string().min(1).max(200),
  subcategories: z.array(z.string().min(1).max(200)).max(50),
  facets: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        options: z.array(z.string().min(1).max(100)).max(50),
      })
    )
    .max(20),
});

// ============================================
// API Route Request Schemas
// ============================================

/**
 * /api/test-prompt request validation
 */
export const testPromptRequestSchema = z.object({
  prompt: promptSchema,
  userUrl: urlSchema,
  engine: engineSchema,
  mock: z.boolean().optional().default(false),
});

/**
 * /api/generate-structure request validation
 */
export const generateStructureRequestSchema = z.object({
  url: urlSchema,
  mock: z.boolean().optional().default(false),
});

/**
 * /api/generate-prompts request validation
 */
export const generatePromptsRequestSchema = z.object({
  structure: catalogStructureSchema,
  mock: z.boolean().optional().default(false),
});

/**
 * /api/diagnose-gap request validation
 */
export const diagnoseGapRequestSchema = z.object({
  query: z.string().min(1).max(500),
  userUrl: urlSchema,
});

/**
 * Council configuration validation
 */
export const councilConfigSchema = z.object({
  engines: z
    .array(councilEngineIdSchema)
    .min(2, "At least 2 engines required for council")
    .max(4, "Maximum 4 engines allowed"),
  judgeEngine: councilEngineIdSchema,
  enableSynthesis: z.boolean().default(true),
});

/**
 * /api/council/stream request validation
 */
export const councilStreamRequestSchema = z.object({
  prompt: promptSchema,
  userUrl: urlSchema,
  config: councilConfigSchema,
  mock: z.boolean().optional().default(false),
});

/**
 * /api/council/evaluate request validation
 */
export const councilEvaluateRequestSchema = z.object({
  blindedResponses: z.array(
    z.object({
      blindId: z.string(),
      content: z.string(),
      metadata: z.object({
        tokenCount: z.number().optional(),
      }),
    })
  ),
  prompt: promptSchema,
  userUrl: urlSchema,
  judgeEngine: councilEngineIdSchema,
});

/**
 * /api/council/synthesize request validation
 */
export const councilSynthesizeRequestSchema = z.object({
  engineResponses: z.record(z.string(), z.any()),
  evaluations: z.array(z.any()),
  prompt: promptSchema,
  userUrl: urlSchema,
});

// ============================================
// Utility Types (inferred from schemas)
// ============================================

export type TestPromptRequest = z.infer<typeof testPromptRequestSchema>;
export type GenerateStructureRequest = z.infer<
  typeof generateStructureRequestSchema
>;
export type GeneratePromptsRequest = z.infer<
  typeof generatePromptsRequestSchema
>;
export type DiagnoseGapRequest = z.infer<typeof diagnoseGapRequestSchema>;
export type CouncilConfig = z.infer<typeof councilConfigSchema>;
export type CouncilStreamRequest = z.infer<typeof councilStreamRequestSchema>;
export type CouncilEvaluateRequest = z.infer<
  typeof councilEvaluateRequestSchema
>;
export type CouncilSynthesizeRequest = z.infer<
  typeof councilSynthesizeRequestSchema
>;

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validates request body and returns parsed data or throws formatted error
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    throw new ValidationError("Invalid request", errors);
  }
  return result.data;
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly errors: Array<{ path: string; message: string }>;
  public readonly statusCode = 400;

  constructor(
    message: string,
    errors: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }

  toJSON() {
    return {
      error: "Validation Error",
      message: this.message,
      details: this.errors,
    };
  }
}

/**
 * Check if a string contains potential prompt injection
 */
export function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Check if a URL points to a private/internal network
 */
export function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(url.hostname));
  } catch {
    return true; // Invalid URL, treat as private for safety
  }
}
