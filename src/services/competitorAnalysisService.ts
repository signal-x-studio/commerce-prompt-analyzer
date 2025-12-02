/**
 * Competitor Analysis Service (GEO Framework)
 *
 * Extracts and analyzes competitor mentions from LLM responses.
 * Implements competitive analysis from the GEO framework.
 */

import type {
  ModelVisibilityResult,
  ExtractedCompetitor,
  LLMModelId,
  CompetitorMention,
  GroundingSource,
} from "../types";

// ============================================
// URL Extraction from Citations
// ============================================

/**
 * Extract competitor URLs from grounded sources
 * Filters out the brand URL to find competitors
 */
export function extractCompetitorUrlsFromSources(
  sources: GroundingSource[],
  brandUrl: string
): { url: string; domain: string; title: string; rank: number }[] {
  let brandDomain = "";
  try {
    brandDomain = new URL(brandUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    brandDomain = brandUrl.toLowerCase();
  }

  const competitors: { url: string; domain: string; title: string; rank: number }[] = [];

  for (const source of sources) {
    try {
      const sourceUrl = new URL(source.uri);
      const sourceDomain = sourceUrl.hostname.replace(/^www\./, "").toLowerCase();

      // Skip brand's own URLs
      if (sourceDomain === brandDomain || sourceDomain.includes(brandDomain)) {
        continue;
      }

      // Skip common non-competitor domains
      const skipDomains = [
        "google.com", "youtube.com", "wikipedia.org", "reddit.com",
        "facebook.com", "twitter.com", "instagram.com", "linkedin.com",
        "amazon.com", "ebay.com", // Generic marketplaces unless they ARE the brand
        "yelp.com", "trustpilot.com", // Review sites
      ];

      if (skipDomains.some((d) => sourceDomain.includes(d))) {
        continue;
      }

      competitors.push({
        url: source.uri,
        domain: sourceDomain,
        title: source.title || sourceDomain,
        rank: source.rank || 0,
      });
    } catch {
      // Skip invalid URLs
    }
  }

  return competitors;
}

// ============================================
// Competitor Aggregation
// ============================================

/**
 * Aggregate competitor data across all model results
 */
export function aggregateCompetitors(
  modelResults: Record<LLMModelId, ModelVisibilityResult>,
  brandUrl: string
): ExtractedCompetitor[] {
  const competitorMap = new Map<string, ExtractedCompetitor>();

  for (const [modelId, result] of Object.entries(modelResults)) {
    // Process grounded sources (citations)
    if (result.sources) {
      const competitorUrls = extractCompetitorUrlsFromSources(result.sources, brandUrl);
      for (const comp of competitorUrls) {
        const existing = competitorMap.get(comp.domain);
        if (existing) {
          existing.citationCount++;
          if (!existing.mentionedInModels.includes(modelId as LLMModelId)) {
            existing.mentionedInModels.push(modelId as LLMModelId);
          }
          if (comp.url && !existing.url) {
            existing.url = comp.url;
          }
        } else {
          competitorMap.set(comp.domain, {
            name: comp.title.split(" - ")[0].split(" | ")[0], // Clean title
            domain: comp.domain,
            url: comp.url,
            mentionCount: 0,
            citationCount: 1,
            mentionedInModels: [modelId as LLMModelId],
            averageSentiment: 0,
            contexts: [],
          });
        }
      }
    }

    // Process text mentions
    if (result.competitorsMentioned) {
      for (const mention of result.competitorsMentioned) {
        const key = mention.url
          ? new URL(mention.url).hostname.replace(/^www\./, "").toLowerCase()
          : mention.name.toLowerCase().replace(/\s+/g, "");

        const existing = competitorMap.get(key);
        if (existing) {
          existing.mentionCount++;
          if (mention.context) {
            existing.contexts.push(mention.context);
          }
          if (mention.sentiment) {
            // Update average sentiment
            const sentimentValue =
              mention.sentiment === "positive" ? 1 :
              mention.sentiment === "negative" ? -1 : 0;
            const totalMentions = existing.mentionCount + existing.citationCount;
            existing.averageSentiment =
              (existing.averageSentiment * (totalMentions - 1) + sentimentValue) / totalMentions;
          }
          if (!existing.mentionedInModels.includes(modelId as LLMModelId)) {
            existing.mentionedInModels.push(modelId as LLMModelId);
          }
        } else {
          let domain: string | undefined;
          if (mention.url) {
            try {
              domain = new URL(mention.url).hostname.replace(/^www\./, "").toLowerCase();
            } catch {
              // Keep undefined
            }
          }

          competitorMap.set(key, {
            name: mention.name,
            domain,
            url: mention.url,
            mentionCount: 1,
            citationCount: 0,
            mentionedInModels: [modelId as LLMModelId],
            averageSentiment:
              mention.sentiment === "positive" ? 1 :
              mention.sentiment === "negative" ? -1 : 0,
            contexts: mention.context ? [mention.context] : [],
          });
        }
      }
    }
  }

  // Convert to array and sort by total mentions
  return Array.from(competitorMap.values())
    .sort((a, b) => (b.mentionCount + b.citationCount) - (a.mentionCount + a.citationCount))
    .slice(0, 20); // Top 20 competitors
}

// ============================================
// Competitor Leaderboard
// ============================================

/**
 * Build a competitor leaderboard comparing visibility
 */
export function buildCompetitorLeaderboard(
  competitors: ExtractedCompetitor[],
  brandResults: {
    found: boolean;
    citationCount: number;
    mentionCount: number;
    sentiment: number;
  }
): {
  brand: { rank: number; score: number; found: boolean };
  competitors: Array<{
    name: string;
    domain?: string;
    rank: number;
    score: number;
    citationCount: number;
    mentionCount: number;
    sentiment: number;
  }>;
} {
  // Calculate score for each competitor
  // Score = (citationCount * 2) + mentionCount + (sentiment * 0.5)
  const scoredCompetitors = competitors.map((comp) => ({
    name: comp.name,
    domain: comp.domain,
    citationCount: comp.citationCount,
    mentionCount: comp.mentionCount,
    sentiment: comp.averageSentiment,
    score: comp.citationCount * 2 + comp.mentionCount + comp.averageSentiment * 0.5,
    rank: 0, // Will be assigned after sorting
  }));

  // Calculate brand score
  const brandScore = brandResults.citationCount * 2 +
    brandResults.mentionCount +
    brandResults.sentiment * 0.5;

  // Sort by score and assign ranks
  scoredCompetitors.sort((a, b) => b.score - a.score);

  // Find brand's position
  let brandRank = 1;
  for (const comp of scoredCompetitors) {
    if (comp.score >= brandScore) {
      brandRank++;
    }
  }

  // Assign ranks to competitors
  scoredCompetitors.forEach((comp, i) => {
    comp.rank = i + 1;
    if (comp.score < brandScore && brandRank <= i + 1) {
      comp.rank++; // Shift down if brand is ahead
    }
  });

  return {
    brand: {
      rank: brandRank,
      score: brandScore,
      found: brandResults.found,
    },
    competitors: scoredCompetitors,
  };
}

// ============================================
// Competitive Gap Analysis
// ============================================

/**
 * Analyze gaps between brand and competitors
 */
export function analyzeCompetitiveGaps(
  brandResults: Record<LLMModelId, ModelVisibilityResult>,
  competitors: ExtractedCompetitor[]
): {
  platformGaps: { platform: string; brandFound: boolean; competitorsFound: number }[];
  recommendations: string[];
} {
  const platformGaps: { platform: string; brandFound: boolean; competitorsFound: number }[] = [];
  const recommendations: string[] = [];

  // Group by platform type
  const searchPlatforms = ["gemini-grounded", "gemini-flash", "perplexity", "perplexity-pro"];
  const chatPlatforms = ["gpt4o", "gpt4o-mini", "claude-sonnet", "claude-haiku", "llama"];

  // Check search platforms
  let brandFoundInSearch = false;
  let competitorsInSearch = 0;
  for (const platform of searchPlatforms) {
    const result = brandResults[platform as LLMModelId];
    if (result?.found) brandFoundInSearch = true;
  }
  for (const comp of competitors) {
    if (comp.mentionedInModels.some((m) => searchPlatforms.includes(m))) {
      competitorsInSearch++;
    }
  }
  platformGaps.push({
    platform: "Search Platforms",
    brandFound: brandFoundInSearch,
    competitorsFound: competitorsInSearch,
  });

  // Check chat platforms
  let brandFoundInChat = false;
  let competitorsInChat = 0;
  for (const platform of chatPlatforms) {
    const result = brandResults[platform as LLMModelId];
    if (result?.found) brandFoundInChat = true;
  }
  for (const comp of competitors) {
    if (comp.mentionedInModels.some((m) => chatPlatforms.includes(m))) {
      competitorsInChat++;
    }
  }
  platformGaps.push({
    platform: "Chat Platforms",
    brandFound: brandFoundInChat,
    competitorsFound: competitorsInChat,
  });

  // Generate recommendations
  if (!brandFoundInSearch && competitorsInSearch > 0) {
    recommendations.push(
      "Improve SEO and structured data to increase visibility in AI search platforms. " +
      `${competitorsInSearch} competitors are being cited.`
    );
  }

  if (!brandFoundInChat && competitorsInChat > 0) {
    recommendations.push(
      "Build brand authority through content marketing to increase mentions in chat platforms. " +
      `${competitorsInChat} competitors are being mentioned.`
    );
  }

  const topCompetitor = competitors[0];
  if (topCompetitor && topCompetitor.citationCount > 3) {
    recommendations.push(
      `Analyze ${topCompetitor.name}'s content strategy - they're cited ${topCompetitor.citationCount} times across ${topCompetitor.mentionedInModels.length} platforms.`
    );
  }

  return { platformGaps, recommendations };
}
