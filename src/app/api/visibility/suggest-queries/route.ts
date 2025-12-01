/**
 * Query Suggestion API
 *
 * Generates relevant queries for visibility testing using AI or templates.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  suggestQueriesWithAI,
  getIndustryTemplateQueries,
  getAvailableIndustries,
} from "../../../../services/queryDiscoveryService";

// ============================================
// Request Validation
// ============================================

const suggestRequestSchema = z.object({
  method: z.enum(["ai", "template"]),
  brandUrl: z.string().url().optional(),
  brandName: z.string().optional(),
  industry: z.string().optional(),
  count: z.number().min(1).max(20).optional().default(10),
});

// ============================================
// GET Handler - List available industries
// ============================================

export async function GET() {
  const industries = getAvailableIndustries();
  return NextResponse.json({ industries });
}

// ============================================
// POST Handler - Generate queries
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = suggestRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { method, brandUrl, brandName, industry, count } = parseResult.data;

    if (method === "ai") {
      if (!brandUrl) {
        return NextResponse.json(
          { error: "brandUrl is required for AI suggestions" },
          { status: 400 }
        );
      }

      const queries = await suggestQueriesWithAI(brandUrl, brandName, industry, count);
      return NextResponse.json({ queries });
    }

    if (method === "template") {
      if (!industry) {
        return NextResponse.json(
          { error: "industry is required for template queries" },
          { status: 400 }
        );
      }

      const queries = getIndustryTemplateQueries(industry);
      return NextResponse.json({ queries });
    }

    return NextResponse.json(
      { error: "Invalid method" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Query suggestion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate queries" },
      { status: 500 }
    );
  }
}
