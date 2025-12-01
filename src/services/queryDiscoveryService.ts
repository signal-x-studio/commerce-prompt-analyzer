/**
 * Query Discovery Service
 *
 * Helps users discover relevant queries to test for brand visibility.
 * Multiple discovery methods: URL scraping, AI suggestions, industry templates.
 */

import { GoogleGenAI } from "@google/genai";
import type { VisibilityQuery, QuerySource } from "../types";

// ============================================
// Page Content Fetching
// ============================================

interface PageAnalysis {
  title: string;
  description: string;
  pageType: "homepage" | "category" | "product" | "other";
  categories: string[];
  products: string[];
  priceRange?: string;
  brandIndicators: string[];
  rawContent: string;
}

/**
 * Fetch and analyze page content to understand what the brand sells
 * This is optional - if it fails, we fall back to basic URL-based inference
 */
async function fetchAndAnalyzePage(url: string): Promise<PageAnalysis | null> {
  try {
    // Create abort controller with longer timeout (15s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // Fetch the page HTML with a realistic browser user agent
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract useful content from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    // Extract text content (strip HTML tags)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000); // Limit content size

    // Extract navigation/category links
    const navLinks: string[] = [];
    const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/gi);
    if (navMatch) {
      navMatch.forEach(nav => {
        const links = nav.match(/<a[^>]*>([^<]+)<\/a>/gi) || [];
        links.forEach(link => {
          const textMatch = link.match(/>([^<]+)</);
          if (textMatch && textMatch[1].trim().length > 2) {
            navLinks.push(textMatch[1].trim());
          }
        });
      });
    }

    // Look for product indicators
    const products: string[] = [];
    const productPatterns = [
      /<h[1-3][^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)</gi,
      /data-product-name="([^"]+)"/gi,
      /<span[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)</gi,
    ];
    productPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null && products.length < 10) {
        if (match[1].trim().length > 2) {
          products.push(match[1].trim());
        }
      }
    });

    // Detect page type from URL and content
    let pageType: PageAnalysis["pageType"] = "other";
    const urlLower = url.toLowerCase();
    const pathSegments = new URL(url).pathname.split("/").filter(Boolean);

    if (pathSegments.length === 0 || urlLower.endsWith(".com") || urlLower.endsWith(".com/")) {
      pageType = "homepage";
    } else if (
      urlLower.includes("/category") ||
      urlLower.includes("/collection") ||
      urlLower.includes("/shop/") ||
      urlLower.includes("/c/") ||
      (pathSegments.length === 1 && !urlLower.includes("/product"))
    ) {
      pageType = "category";
    } else if (
      urlLower.includes("/product") ||
      urlLower.includes("/p/") ||
      urlLower.includes("/item/") ||
      pathSegments.length >= 2
    ) {
      pageType = "product";
    }

    // Look for price indicators
    const priceMatches = html.match(/\$[\d,]+\.?\d*/g) || [];
    let priceRange: string | undefined;
    if (priceMatches.length > 0) {
      const prices = priceMatches
        .map(p => parseFloat(p.replace(/[$,]/g, "")))
        .filter(p => p > 0 && p < 100000)
        .sort((a, b) => a - b);
      if (prices.length > 1) {
        priceRange = `$${prices[0].toFixed(0)} - $${prices[prices.length - 1].toFixed(0)}`;
      }
    }

    return {
      title,
      description,
      pageType,
      categories: [...new Set(navLinks)].slice(0, 15),
      products: [...new Set(products)].slice(0, 10),
      priceRange,
      brandIndicators: [title, description].filter(Boolean),
      rawContent: textContent.slice(0, 4000),
    };
  } catch (error) {
    console.error("Failed to fetch/analyze page:", error);
    return null;
  }
}

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
// Query ID Generation
// ============================================

function generateQueryId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// AI-Powered Query Suggestion
// ============================================

/**
 * Generate queries using AI based on brand/URL/industry
 * Now fetches and analyzes the actual page content for smarter suggestions
 */
export async function suggestQueriesWithAI(
  brandUrl: string,
  brandName?: string,
  industry?: string,
  count: number = 10
): Promise<VisibilityQuery[]> {
  const client = getGeminiClient();

  let domain = "";
  try {
    domain = new URL(brandUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = brandUrl;
  }

  // Fetch and analyze the actual page content
  const pageAnalysis = await fetchAndAnalyzePage(brandUrl);

  // Build context from page analysis
  let pageContext = "";
  if (pageAnalysis) {
    pageContext = `
Page Analysis Results:
- Page Type: ${pageAnalysis.pageType}
- Page Title: ${pageAnalysis.title}
- Meta Description: ${pageAnalysis.description}
${pageAnalysis.categories.length > 0 ? `- Site Categories/Navigation: ${pageAnalysis.categories.join(", ")}` : ""}
${pageAnalysis.products.length > 0 ? `- Products Found: ${pageAnalysis.products.join(", ")}` : ""}
${pageAnalysis.priceRange ? `- Price Range: ${pageAnalysis.priceRange}` : ""}

Page Content Summary:
${pageAnalysis.rawContent.slice(0, 2000)}
`;
  }

  // Customize prompt based on page type
  let pageTypeGuidance = "";
  if (pageAnalysis) {
    switch (pageAnalysis.pageType) {
      case "homepage":
        pageTypeGuidance = `This is the brand's HOMEPAGE. Generate queries covering their full product range and brand positioning.`;
        break;
      case "category":
        pageTypeGuidance = `This is a CATEGORY PAGE. Focus queries specifically on this product category and related shopping needs.`;
        break;
      case "product":
        pageTypeGuidance = `This is a PRODUCT PAGE. Generate queries about this specific product type, alternatives, comparisons, and buying decisions.`;
        break;
      default:
        pageTypeGuidance = `Generate queries relevant to what this page offers.`;
    }
  }

  const prompt = `You are helping an e-commerce brand understand their visibility in AI search results.

Brand Information:
- Website: ${brandUrl}
- Brand Name: ${brandName || domain}
${industry ? `- Industry: ${industry}` : ""}
${pageContext}

${pageTypeGuidance}

Generate ${count} realistic search queries that consumers might ask AI assistants (like ChatGPT, Google Gemini, Perplexity, or Claude) when shopping for products or services this brand offers.

IMPORTANT Requirements:
1. Queries should be natural, conversational questions people actually ask
2. Base your queries on the ACTUAL products and categories shown on the page
3. Include a mix of:
   - Product discovery queries ("best X for Y")
   - Comparison queries ("X vs Y" or "top brands for Z")
   - Review/recommendation queries ("where to buy X")
   - Specific need queries ("X under $500" or "X for beginners")
4. Do NOT mention the brand name in the queries - we're testing if AI mentions them organically
5. Make queries specific to what this brand ACTUALLY sells based on the page content

Return ONLY a JSON array of objects with this format:
[
  {"text": "query text here", "category": "Product Discovery"},
  {"text": "another query", "category": "Comparison"}
]

Categories should be one of: "Product Discovery", "Comparison", "Review", "Specific Need", "How-To", "Local"`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
      },
    });

    const text = response.text || "";

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    return parsed.map((item: { text: string; category?: string }) => ({
      id: generateQueryId(),
      text: item.text,
      source: "ai-suggested" as QuerySource,
      category: item.category || "General",
      selected: true,
    }));
  } catch (error) {
    console.error("Failed to generate AI queries:", error);
    // Return fallback generic queries
    return getGenericQueries(industry || "retail");
  }
}

// ============================================
// Industry Templates
// ============================================

interface IndustryTemplate {
  name: string;
  queries: { text: string; category: string }[];
}

const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  jewelry: {
    name: "Jewelry & Accessories",
    queries: [
      { text: "best engagement rings under $5000", category: "Product Discovery" },
      { text: "where to buy diamond earrings online", category: "Product Discovery" },
      { text: "top jewelry stores for wedding bands", category: "Comparison" },
      { text: "best place to buy anniversary gifts for wife", category: "Specific Need" },
      { text: "affordable luxury watches for men", category: "Product Discovery" },
      { text: "custom jewelry makers near me", category: "Local" },
      { text: "best online jewelry stores 2024", category: "Review" },
      { text: "how to choose an engagement ring", category: "How-To" },
    ],
  },
  electronics: {
    name: "Electronics & Tech",
    queries: [
      { text: "best laptop for college students 2024", category: "Product Discovery" },
      { text: "top rated wireless earbuds for running", category: "Product Discovery" },
      { text: "where to buy refurbished phones", category: "Product Discovery" },
      { text: "MacBook vs Windows laptop for programming", category: "Comparison" },
      { text: "best TV deals right now", category: "Specific Need" },
      { text: "most reliable laptop brands", category: "Review" },
      { text: "budget gaming PC build 2024", category: "Specific Need" },
      { text: "best smart home devices to start with", category: "How-To" },
    ],
  },
  fashion: {
    name: "Fashion & Apparel",
    queries: [
      { text: "best online clothing stores for women", category: "Product Discovery" },
      { text: "where to buy affordable business casual", category: "Product Discovery" },
      { text: "top sustainable fashion brands", category: "Review" },
      { text: "best jeans brands for men", category: "Comparison" },
      { text: "winter coat recommendations", category: "Product Discovery" },
      { text: "athletic wear brands like Lululemon", category: "Comparison" },
      { text: "best places to buy sneakers online", category: "Product Discovery" },
      { text: "how to build a capsule wardrobe", category: "How-To" },
    ],
  },
  home: {
    name: "Home & Furniture",
    queries: [
      { text: "best mattress for back pain", category: "Product Discovery" },
      { text: "where to buy affordable furniture online", category: "Product Discovery" },
      { text: "top rated vacuum cleaners 2024", category: "Review" },
      { text: "Wayfair vs Amazon for furniture", category: "Comparison" },
      { text: "best coffee maker for home", category: "Product Discovery" },
      { text: "smart thermostat recommendations", category: "Product Discovery" },
      { text: "how to furnish a small apartment", category: "How-To" },
      { text: "best air purifier for allergies", category: "Specific Need" },
    ],
  },
  travel: {
    name: "Travel & Hospitality",
    queries: [
      { text: "best flight booking sites", category: "Product Discovery" },
      { text: "where to find cheap hotel deals", category: "Product Discovery" },
      { text: "Expedia vs Booking.com comparison", category: "Comparison" },
      { text: "best travel credit cards 2024", category: "Review" },
      { text: "all inclusive resorts Caribbean", category: "Product Discovery" },
      { text: "best airline for international travel", category: "Comparison" },
      { text: "how to find cheap flights", category: "How-To" },
      { text: "best vacation packages for families", category: "Specific Need" },
    ],
  },
  health: {
    name: "Health & Wellness",
    queries: [
      { text: "best vitamins for energy", category: "Product Discovery" },
      { text: "where to buy supplements online", category: "Product Discovery" },
      { text: "top rated fitness trackers", category: "Review" },
      { text: "best meal delivery service for weight loss", category: "Comparison" },
      { text: "organic skincare brands", category: "Product Discovery" },
      { text: "best meditation apps", category: "Comparison" },
      { text: "how to start a workout routine", category: "How-To" },
      { text: "affordable gym equipment for home", category: "Specific Need" },
    ],
  },
  automotive: {
    name: "Automotive",
    queries: [
      { text: "best electric cars 2024", category: "Product Discovery" },
      { text: "where to buy car parts online", category: "Product Discovery" },
      { text: "Tesla vs other EVs comparison", category: "Comparison" },
      { text: "most reliable car brands", category: "Review" },
      { text: "best SUV for families", category: "Specific Need" },
      { text: "how to negotiate car prices", category: "How-To" },
      { text: "best car insurance companies", category: "Comparison" },
      { text: "used car buying tips", category: "How-To" },
    ],
  },
  food: {
    name: "Food & Grocery",
    queries: [
      { text: "best grocery delivery services", category: "Comparison" },
      { text: "where to buy organic food online", category: "Product Discovery" },
      { text: "meal kit delivery comparison", category: "Comparison" },
      { text: "best coffee subscription services", category: "Product Discovery" },
      { text: "healthy snack delivery options", category: "Product Discovery" },
      { text: "Instacart vs Amazon Fresh", category: "Comparison" },
      { text: "best wine delivery services", category: "Product Discovery" },
      { text: "how to save money on groceries", category: "How-To" },
    ],
  },
  retail: {
    name: "General Retail",
    queries: [
      { text: "best online shopping sites", category: "Product Discovery" },
      { text: "where to find the best deals online", category: "Product Discovery" },
      { text: "top rated products on Amazon", category: "Review" },
      { text: "best stores for home goods", category: "Product Discovery" },
      { text: "how to find discount codes", category: "How-To" },
      { text: "best time to buy electronics", category: "How-To" },
      { text: "most trusted online retailers", category: "Review" },
      { text: "Black Friday deals preview", category: "Specific Need" },
    ],
  },
};

/**
 * Get queries from industry templates
 */
export function getIndustryTemplateQueries(industry: string): VisibilityQuery[] {
  const template = INDUSTRY_TEMPLATES[industry.toLowerCase()] || INDUSTRY_TEMPLATES.retail;

  return template.queries.map((q) => ({
    id: generateQueryId(),
    text: q.text,
    source: "industry-template" as QuerySource,
    category: q.category,
    selected: true,
  }));
}

/**
 * Get all available industry names
 */
export function getAvailableIndustries(): { id: string; name: string }[] {
  return Object.entries(INDUSTRY_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
  }));
}

/**
 * Get generic fallback queries
 */
function getGenericQueries(industry: string): VisibilityQuery[] {
  return getIndustryTemplateQueries(industry).slice(0, 5);
}

// ============================================
// Custom Query Creation
// ============================================

/**
 * Create a custom query from user input
 */
export function createCustomQuery(text: string, category?: string): VisibilityQuery {
  return {
    id: generateQueryId(),
    text: text.trim(),
    source: "custom",
    category: category || "Custom",
    selected: true,
  };
}

// ============================================
// URL-Based Query Generation
// ============================================

/**
 * Generate queries from website structure
 * This wraps the existing generate-prompts functionality
 */
export async function generateQueriesFromUrl(
  categories: string[],
  subcategories: string[]
): Promise<VisibilityQuery[]> {
  const client = getGeminiClient();

  const prompt = `Generate 5 realistic consumer search queries for an e-commerce site with these categories:
Categories: ${categories.join(", ")}
${subcategories.length > 0 ? `Subcategories: ${subcategories.join(", ")}` : ""}

Generate natural questions someone might ask an AI assistant when shopping for these products.

Return ONLY a JSON array:
[{"text": "query here", "category": "Product Discovery"}]`;

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

    return parsed.map((item: { text: string; category?: string }) => ({
      id: generateQueryId(),
      text: item.text,
      source: "url-generated" as QuerySource,
      category: item.category || "General",
      selected: true,
    }));
  } catch (error) {
    console.error("Failed to generate URL-based queries:", error);
    return [];
  }
}

// ============================================
// Query Management Utilities
// ============================================

/**
 * Toggle query selection
 */
export function toggleQuerySelection(
  queries: VisibilityQuery[],
  queryId: string
): VisibilityQuery[] {
  return queries.map((q) =>
    q.id === queryId ? { ...q, selected: !q.selected } : q
  );
}

/**
 * Select all queries
 */
export function selectAllQueries(queries: VisibilityQuery[]): VisibilityQuery[] {
  return queries.map((q) => ({ ...q, selected: true }));
}

/**
 * Deselect all queries
 */
export function deselectAllQueries(queries: VisibilityQuery[]): VisibilityQuery[] {
  return queries.map((q) => ({ ...q, selected: false }));
}

/**
 * Get selected queries
 */
export function getSelectedQueries(queries: VisibilityQuery[]): VisibilityQuery[] {
  return queries.filter((q) => q.selected);
}

/**
 * Remove a query
 */
export function removeQuery(
  queries: VisibilityQuery[],
  queryId: string
): VisibilityQuery[] {
  return queries.filter((q) => q.id !== queryId);
}

/**
 * Add queries without duplicates
 */
export function addQueries(
  existing: VisibilityQuery[],
  newQueries: VisibilityQuery[]
): VisibilityQuery[] {
  const existingTexts = new Set(existing.map((q) => q.text.toLowerCase()));
  const uniqueNew = newQueries.filter(
    (q) => !existingTexts.has(q.text.toLowerCase())
  );
  return [...existing, ...uniqueNew];
}
