/**
 * Content Analysis Service (GEO Framework)
 *
 * Analyzes brand content to derive relevant queries and calculate match rates.
 * Implements the "working backwards" approach from the GEO framework.
 */

import { GoogleGenAI } from "@google/genai";
import type {
  VisibilityQuery,
  UserIntent,
  FunnelStage,
  ContentType,
  ContentChunk,
  BrandContentAnalysis,
} from "../types";

// Re-export types for convenience
export type { BrandContentAnalysis, ContentChunk };

// ============================================
// Client Initialization
// ============================================

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// ============================================
// Content Fetching & Chunking
// ============================================

/**
 * Fetch and analyze page content into semantic chunks
 * Follows the GEO framework's document chunking approach
 */
export async function analyzePageContent(url: string): Promise<BrandContentAnalysis | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();
    const chunks: ContentChunk[] = [];
    let chunkId = 0;

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    if (title) {
      chunks.push({
        id: `chunk_${chunkId++}`,
        text: title,
        source: "title",
        wordCount: title.split(/\s+/).length,
      });
    }

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : "";
    if (description) {
      chunks.push({
        id: `chunk_${chunkId++}`,
        text: description,
        source: "description",
        wordCount: description.split(/\s+/).length,
      });
    }

    // Extract headings (h1-h3)
    const headingMatches = html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi);
    for (const match of headingMatches) {
      const text = match[1].trim();
      if (text.length > 5 && text.length < 200) {
        chunks.push({
          id: `chunk_${chunkId++}`,
          text,
          source: "heading",
          wordCount: text.split(/\s+/).length,
        });
      }
    }

    // Extract main content paragraphs
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");

    const paragraphMatches = cleanHtml.matchAll(/<p[^>]*>([^<]+)<\/p>/gi);
    for (const match of paragraphMatches) {
      const text = match[1].trim().replace(/\s+/g, " ");
      if (text.length > 50 && text.length < 500) {
        chunks.push({
          id: `chunk_${chunkId++}`,
          text,
          source: "paragraph",
          wordCount: text.split(/\s+/).length,
        });
      }
      if (chunks.length >= 30) break; // Max 30 chunks per GEO framework
    }

    // Extract navigation/categories
    const categories: string[] = [];
    const navMatches = html.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/gi);
    for (const navMatch of navMatches) {
      const linkMatches = navMatch[1].matchAll(/<a[^>]*>([^<]+)<\/a>/gi);
      for (const linkMatch of linkMatches) {
        const text = linkMatch[1].trim();
        if (text.length > 2 && text.length < 50 && !text.match(/^(home|menu|close|search)$/i)) {
          categories.push(text);
        }
      }
    }

    // Detect page type
    let pageType: BrandContentAnalysis["pageType"] = "other";
    const urlLower = url.toLowerCase();
    const pathSegments = new URL(url).pathname.split("/").filter(Boolean);

    if (pathSegments.length === 0 || urlLower.endsWith(".com") || urlLower.endsWith(".com/")) {
      pageType = "homepage";
    } else if (urlLower.includes("/category") || urlLower.includes("/collection") || urlLower.includes("/shop/")) {
      pageType = "category";
    } else if (urlLower.includes("/product") || urlLower.includes("/p/") || urlLower.includes("/item/")) {
      pageType = "product";
    } else if (urlLower.includes("/blog") || urlLower.includes("/article") || urlLower.includes("/post")) {
      pageType = "article";
    }

    return {
      url,
      title,
      description,
      pageType,
      chunks: chunks.slice(0, 30),
      topics: [], // Will be populated by AI analysis
      entities: [],
      categories: [...new Set(categories)].slice(0, 15),
    };
  } catch (error) {
    console.error("Failed to analyze page content:", error);
    return null;
  }
}

// ============================================
// Intent & Funnel Classification
// ============================================

/**
 * Classify a query's intent using rule-based + AI hybrid approach
 */
export function classifyQueryIntent(queryText: string): UserIntent {
  const text = queryText.toLowerCase();

  // Rule-based classification (high accuracy for common patterns)
  if (text.match(/^(how to|how do|what is|what are|why|when|where is)/)) {
    return "learn";
  }
  if (text.match(/(vs|versus|compared to|better than|difference between|or)/)) {
    return "compare";
  }
  if (text.match(/(buy|purchase|order|shop|deal|price|cost|cheap|affordable|discount)/)) {
    return "buy";
  }
  if (text.match(/(best|top|recommend|suggestion|should i|good)/)) {
    return "evaluate";
  }
  if (text.match(/(fix|solve|help|issue|problem|troubleshoot|repair)/)) {
    return "solve";
  }

  // Default to explore for general queries
  return "explore";
}

/**
 * Map a query to its funnel stage
 */
export function classifyFunnelStage(queryText: string, intent: UserIntent): FunnelStage {
  const text = queryText.toLowerCase();

  // Purchase intent signals
  if (text.match(/(buy|purchase|order|checkout|cart|shipping|delivery)/)) {
    return "purchase";
  }

  // Post-purchase signals
  if (text.match(/(return|refund|warranty|support|repair|replacement|accessory for my)/)) {
    return "post-purchase";
  }

  // Evaluation signals
  if (text.match(/(review|rating|vs|compare|best.*for|which.*should)/)) {
    return "evaluation";
  }

  // Consideration signals
  if (text.match(/(best|top|recommend|options|alternatives|similar to)/)) {
    return "consideration";
  }

  // Default to awareness for learning/exploring
  if (intent === "learn" || intent === "explore") {
    return "awareness";
  }

  return "consideration";
}

/**
 * Classify the content type the query is seeking
 */
export function classifyContentType(queryText: string): ContentType {
  const text = queryText.toLowerCase();

  if (text.match(/^how to|guide|tutorial|steps|instructions/)) {
    return "how-to";
  }
  if (text.match(/vs|versus|compared|comparison|difference/)) {
    return "comparison";
  }
  if (text.match(/review|rating|experience|testimonial/)) {
    return "review";
  }
  if (text.match(/top \d+|best \d+|\d+ best|\d+ top|list of/)) {
    return "listicle";
  }
  if (text.match(/new|latest|announce|update|release|2024|2025/)) {
    return "news";
  }
  if (text.match(/product|buy|price|spec|feature/)) {
    return "product";
  }

  return "informational";
}

/**
 * Classify a query with all GEO framework dimensions
 */
export function classifyQuery(query: VisibilityQuery): VisibilityQuery {
  const intent = classifyQueryIntent(query.text);
  const funnelStage = classifyFunnelStage(query.text, intent);
  const contentType = classifyContentType(query.text);

  return {
    ...query,
    intent,
    funnelStage,
    contentType,
  };
}

/**
 * Classify multiple queries
 */
export function classifyQueries(queries: VisibilityQuery[]): VisibilityQuery[] {
  return queries.map(classifyQuery);
}

// ============================================
// Content-Derived Query Generation
// ============================================

function generateQueryId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate queries derived FROM the brand's content
 * This is the "working backwards" approach from the GEO framework
 */
export async function deriveQueriesFromContent(
  contentAnalysis: BrandContentAnalysis,
  count: number = 10
): Promise<VisibilityQuery[]> {
  const client = getGeminiClient();

  // Build context from content chunks
  const chunkTexts = contentAnalysis.chunks
    .map((c) => `[${c.source}]: ${c.text}`)
    .join("\n");

  const prompt = `You are analyzing a brand's website content to determine what queries/prompts they SHOULD be cited for based on their actual content.

Page Information:
- URL: ${contentAnalysis.url}
- Page Type: ${contentAnalysis.pageType}
- Title: ${contentAnalysis.title}
- Description: ${contentAnalysis.description}
- Categories: ${contentAnalysis.categories.join(", ")}

Content Chunks:
${chunkTexts}

Based on this content, generate ${count} queries that:
1. This content ACTUALLY answers or addresses
2. Are natural questions someone would ask an AI assistant
3. DO NOT mention the brand name - we're testing organic citations
4. Span different funnel stages (awareness, consideration, evaluation, purchase)
5. Cover different intents (learn, compare, buy, explore, evaluate)

For each query, classify:
- intent: learn | compare | buy | explore | solve | evaluate
- funnelStage: awareness | consideration | evaluation | purchase | post-purchase
- contentType: how-to | product | news | informational | comparison | review | listicle

Return ONLY a JSON array:
[
  {
    "text": "query text",
    "intent": "compare",
    "funnelStage": "consideration",
    "contentType": "comparison",
    "category": "Product Comparison"
  }
]`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { temperature: 0.7 },
    });

    const text = response.text || "";
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    return parsed.map((item: any) => ({
      id: generateQueryId(),
      text: item.text,
      source: "content-derived" as const,
      category: item.category || "Content-Derived",
      selected: true,
      intent: item.intent as UserIntent,
      funnelStage: item.funnelStage as FunnelStage,
      contentType: item.contentType as ContentType,
    }));
  } catch (error) {
    console.error("Failed to derive queries from content:", error);
    return [];
  }
}

// ============================================
// Match Rate Scoring
// ============================================

/**
 * Calculate semantic match rate between a query and content chunks
 * Uses simple keyword/phrase matching (could be enhanced with embeddings)
 */
export function calculateMatchRate(
  queryText: string,
  chunks: ContentChunk[]
): { score: number; matchedChunks: string[] } {
  const queryWords = queryText.toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3); // Skip short words

  const matchedChunks: string[] = [];
  let totalMatches = 0;

  for (const chunk of chunks) {
    const chunkLower = chunk.text.toLowerCase();
    let chunkMatches = 0;

    for (const word of queryWords) {
      if (chunkLower.includes(word)) {
        chunkMatches++;
      }
    }

    if (chunkMatches > 0) {
      totalMatches += chunkMatches;
      if (chunkMatches >= queryWords.length * 0.3) {
        matchedChunks.push(chunk.text.slice(0, 100));
      }
    }
  }

  // Normalize score to 0-1
  const maxPossibleMatches = queryWords.length * chunks.length;
  const score = maxPossibleMatches > 0
    ? Math.min(1, totalMatches / (queryWords.length * 2))
    : 0;

  return { score, matchedChunks: matchedChunks.slice(0, 3) };
}

/**
 * Score all queries against brand content
 */
export function scoreQueriesAgainstContent(
  queries: VisibilityQuery[],
  contentAnalysis: BrandContentAnalysis
): VisibilityQuery[] {
  return queries.map((query) => {
    const { score, matchedChunks } = calculateMatchRate(query.text, contentAnalysis.chunks);
    return {
      ...query,
      matchScore: score,
      matchedChunks,
    };
  });
}

// ============================================
// Topic & Entity Extraction
// ============================================

/**
 * Extract key topics and entities from content using AI
 */
export async function extractTopicsAndEntities(
  contentAnalysis: BrandContentAnalysis
): Promise<{ topics: string[]; entities: string[] }> {
  const client = getGeminiClient();

  const chunkTexts = contentAnalysis.chunks.map((c) => c.text).join("\n\n");

  const prompt = `Analyze this website content and extract:
1. Key Topics: Main subjects/themes discussed (e.g., "running shoes", "outdoor gear", "eco-friendly products")
2. Named Entities: Specific brands, products, technologies, or proper nouns mentioned

Content:
${chunkTexts.slice(0, 4000)}

Return ONLY a JSON object:
{
  "topics": ["topic1", "topic2", ...],
  "entities": ["entity1", "entity2", ...]
}`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { temperature: 0.3 },
    });

    const text = response.text || "";
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());
    return {
      topics: parsed.topics || [],
      entities: parsed.entities || [],
    };
  } catch (error) {
    console.error("Failed to extract topics/entities:", error);
    return { topics: [], entities: [] };
  }
}
