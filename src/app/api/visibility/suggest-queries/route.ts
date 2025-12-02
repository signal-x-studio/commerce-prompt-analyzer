/**
 * Query Suggestion API
 *
 * Generates relevant queries for visibility testing using AI or templates.
 * Enhanced with GEO Framework for content-derived queries and classification.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  suggestQueriesWithAI,
  getIndustryTemplateQueries,
  getAvailableIndustries,
  analyzePageContent,
  deriveQueriesFromContent,
  classifyQueries,
  scoreQueriesAgainstContent,
} from "../../../../services/queryDiscoveryService";

// ============================================
// Request Validation
// ============================================

const suggestRequestSchema = z.object({
  method: z.enum(["ai", "template", "content-derived", "classify"]),
  brandUrl: z.string().url().optional(),
  brandName: z.string().optional(),
  industry: z.string().optional(),
  count: z.number().min(1).max(20).optional().default(10),
  // For classify method
  queries: z.array(z.object({
    id: z.string(),
    text: z.string(),
    source: z.string(),
    category: z.string().optional(),
    selected: z.boolean(),
  })).optional(),
  // For scoring
  enableMatchRateScoring: z.boolean().optional().default(false),
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

    const { method, brandUrl, brandName, industry, count, queries, enableMatchRateScoring } = parseResult.data;

    // Method: AI suggestions (existing)
    if (method === "ai") {
      if (!brandUrl) {
        return NextResponse.json(
          { error: "brandUrl is required for AI suggestions" },
          { status: 400 }
        );
      }

      const generatedQueries = await suggestQueriesWithAI(brandUrl, brandName, industry, count);
      return NextResponse.json({ queries: generatedQueries });
    }

    // Method: Industry templates (existing)
    if (method === "template") {
      if (!industry) {
        return NextResponse.json(
          { error: "industry is required for template queries" },
          { status: 400 }
        );
      }

      const templateQueries = getIndustryTemplateQueries(industry);
      return NextResponse.json({ queries: templateQueries });
    }

    // Method: Content-derived queries (GEO Framework - NEW)
    if (method === "content-derived") {
      if (!brandUrl) {
        return NextResponse.json(
          { error: "brandUrl is required for content-derived queries" },
          { status: 400 }
        );
      }

      // Analyze the page content
      const contentAnalysis = await analyzePageContent(brandUrl);
      if (!contentAnalysis) {
        return NextResponse.json(
          { error: "Failed to analyze page content" },
          { status: 500 }
        );
      }

      // Derive queries from content
      const derivedQueries = await deriveQueriesFromContent(contentAnalysis, count);

      // Optionally score against content
      let finalQueries = derivedQueries;
      if (enableMatchRateScoring) {
        finalQueries = scoreQueriesAgainstContent(derivedQueries, contentAnalysis);
      }

      return NextResponse.json({
        queries: finalQueries,
        contentAnalysis: {
          pageType: contentAnalysis.pageType,
          title: contentAnalysis.title,
          topics: contentAnalysis.topics,
          categories: contentAnalysis.categories,
          chunkCount: contentAnalysis.chunks.length,
        },
      });
    }

    // Method: Classify existing queries (GEO Framework - NEW)
    if (method === "classify") {
      if (!queries || queries.length === 0) {
        return NextResponse.json(
          { error: "queries array is required for classification" },
          { status: 400 }
        );
      }

      // Cast to proper type and classify
      const inputQueries = queries.map((q) => ({
        ...q,
        source: q.source as any,
      }));

      let classifiedQueries = classifyQueries(inputQueries);

      // Optionally score against content if brandUrl provided
      if (enableMatchRateScoring && brandUrl) {
        const contentAnalysis = await analyzePageContent(brandUrl);
        if (contentAnalysis) {
          classifiedQueries = scoreQueriesAgainstContent(classifiedQueries, contentAnalysis);
        }
      }

      return NextResponse.json({ queries: classifiedQueries });
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
