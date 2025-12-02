/**
 * API Status Endpoint
 *
 * Returns information about configured API keys and available features.
 * Does NOT expose actual key values, only their configured status.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const status = {
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      models: ["gemini-grounded"],
    },
    openRouter: {
      configured: Boolean(process.env.OPENROUTER_API_KEY),
      models: ["gpt-4o", "claude-sonnet", "perplexity-sonar", "llama-70b"],
    },
    allConfigured: false,
    anyConfigured: false,
    missingKeys: [] as string[],
  };

  // Check overall status
  status.allConfigured = status.gemini.configured && status.openRouter.configured;
  status.anyConfigured = status.gemini.configured || status.openRouter.configured;

  // Build missing keys list
  if (!status.gemini.configured) {
    status.missingKeys.push("GEMINI_API_KEY");
  }
  if (!status.openRouter.configured) {
    status.missingKeys.push("OPENROUTER_API_KEY");
  }

  return NextResponse.json(status);
}
