import { NextResponse } from "next/server";
import { diagnoseGap } from "../../../services/tavilyService";
import { diagnoseGapRequestSchema } from "../../../lib/security/validators";
import { validateUrlForSSRF } from "../../../lib/security/ssrf-guard";
import { apiKeyManager } from "../../../lib/security/api-keys";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request with Zod schema
    const parseResult = diagnoseGapRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Invalid request",
          details: errors,
        },
        { status: 400 }
      );
    }

    const { query, userUrl } = parseResult.data;

    // Additional SSRF validation for userUrl
    const ssrfCheck = validateUrlForSSRF(userUrl);
    if (!ssrfCheck.valid) {
      return NextResponse.json(
        {
          error: "URL Validation Error",
          message: ssrfCheck.error,
        },
        { status: 400 }
      );
    }

    // Check if Tavily is configured
    if (!apiKeyManager.isConfigured("tavily")) {
      return NextResponse.json({
        status: "ERROR",
        message:
          "Tavily API Key is missing. Please add TAVILY_API_KEY to your .env file.",
      });
    }

    const apiKey = apiKeyManager.getKey("tavily");
    const result = await diagnoseGap(query, userUrl, apiKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/diagnose-gap:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
