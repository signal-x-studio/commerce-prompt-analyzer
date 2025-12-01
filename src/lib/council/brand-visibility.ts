/**
 * Brand Visibility Scoring Utilities
 *
 * Analyzes LLM responses to determine brand visibility, sentiment,
 * and citation quality across multiple AI models.
 */

import type {
  BrandMention,
  BrandVisibilityScore,
  BrandVisibilityResult,
  CouncilEngineId,
  CouncilEngineResponse,
  CompetitorMention,
} from "../../types";

/**
 * Extract brand mentions from LLM response content
 */
export function extractBrandMention(
  engineId: CouncilEngineId,
  content: string,
  brandUrl: string,
  brandName?: string
): BrandMention {
  const normalizedContent = content.toLowerCase();

  // Extract domain name from URL for matching
  const domain = extractDomainName(brandUrl);

  // Build comprehensive list of brand identifiers including variations
  const brandIdentifiers = generateBrandVariations(domain, brandName, brandUrl);

  // Check if brand is mentioned
  const found = brandIdentifiers.some((identifier) =>
    normalizedContent.includes(identifier.toLowerCase())
  );

  // Extract mention context (surrounding text)
  const mentionContext = found
    ? extractMentionContext(content, brandIdentifiers)
    : undefined;

  // Analyze sentiment around the mention
  const sentiment = found
    ? analyzeSentiment(content, brandIdentifiers)
    : "neutral";

  // Try to extract rank/position if mentioned in a list
  const rank = found ? extractRankFromContent(content, brandIdentifiers) : undefined;

  // Calculate confidence based on specificity of mention
  const confidence = calculateMentionConfidence(
    content,
    brandIdentifiers,
    found
  );

  return {
    engineId,
    found,
    sentiment,
    mentionContext,
    rank,
    confidence,
  };
}

/**
 * Generate variations of brand name for better matching
 * e.g., "bestbuy" -> ["bestbuy", "best buy", "best-buy", "BestBuy"]
 */
export function generateBrandVariations(
  domain: string,
  brandName?: string,
  brandUrl?: string
): string[] {
  const variations = new Set<string>();

  // Add the domain as-is
  variations.add(domain.toLowerCase());

  // Add brand name if provided
  if (brandName) {
    variations.add(brandName.toLowerCase());
  }

  // Add URL variations
  if (brandUrl) {
    variations.add(brandUrl.toLowerCase());
    // Extract just the hostname without protocol
    try {
      const url = new URL(brandUrl);
      variations.add(url.hostname.toLowerCase());
      variations.add(url.hostname.replace(/^www\./, "").toLowerCase());
    } catch {
      // Ignore URL parsing errors
    }
  }

  // Generate spaced variations from camelCase or concatenated names
  // e.g., "bestbuy" -> "best buy"
  const spacedVariation = domain
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase to spaces
    .replace(/([a-z])(\d)/g, "$1 $2") // letter-number boundary
    .toLowerCase();

  if (spacedVariation !== domain.toLowerCase()) {
    variations.add(spacedVariation);
  }

  // Try to split common compound words
  // Common patterns: word boundaries where a new word might start
  const commonSplits = tryCommonWordSplits(domain);
  commonSplits.forEach((split) => variations.add(split.toLowerCase()));

  // Add hyphenated version
  const hyphenated = domain.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  if (hyphenated !== domain.toLowerCase()) {
    variations.add(hyphenated);
  }

  return Array.from(variations).filter(Boolean);
}

/**
 * Try to split domain into common word combinations
 */
function tryCommonWordSplits(domain: string): string[] {
  const splits: string[] = [];
  const lowerDomain = domain.toLowerCase();

  // Common word endings to try splitting on
  const commonWords = [
    "buy", "shop", "store", "market", "mart", "direct", "online", "hub",
    "depot", "world", "zone", "plus", "pro", "tech", "max", "express"
  ];

  for (const word of commonWords) {
    if (lowerDomain.endsWith(word) && lowerDomain.length > word.length) {
      const prefix = lowerDomain.slice(0, -word.length);
      splits.push(`${prefix} ${word}`);
    }
    if (lowerDomain.startsWith(word) && lowerDomain.length > word.length) {
      const suffix = lowerDomain.slice(word.length);
      splits.push(`${word} ${suffix}`);
    }
  }

  return splits;
}

/**
 * Extract domain name from URL
 */
function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove www. prefix and get just the domain name
    return urlObj.hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    // If URL parsing fails, try to extract from string
    return url
      .replace(/https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split(".")[0];
  }
}

/**
 * Extract context around brand mention
 */
function extractMentionContext(
  content: string,
  brandIdentifiers: string[]
): string {
  const lowerContent = content.toLowerCase();

  for (const identifier of brandIdentifiers) {
    const index = lowerContent.indexOf(identifier);
    if (index !== -1) {
      const start = Math.max(0, index - 100);
      const end = Math.min(content.length, index + identifier.length + 100);
      return content.slice(start, end).trim();
    }
  }

  return "";
}

/**
 * Analyze sentiment around brand mentions
 */
export function analyzeSentiment(
  content: string,
  brandIdentifiers: string[]
): "positive" | "negative" | "neutral" {
  const lowerContent = content.toLowerCase();

  // Find the context around brand mentions
  let brandContext = "";
  for (const identifier of brandIdentifiers) {
    const index = lowerContent.indexOf(identifier);
    if (index !== -1) {
      const start = Math.max(0, index - 200);
      const end = Math.min(content.length, index + identifier.length + 200);
      brandContext += content.slice(start, end).toLowerCase() + " ";
    }
  }

  if (!brandContext) {
    return "neutral";
  }

  // Positive indicators
  const positiveTerms = [
    "recommend",
    "best",
    "top",
    "excellent",
    "great",
    "quality",
    "trusted",
    "reliable",
    "leading",
    "popular",
    "favorite",
    "preferred",
    "outstanding",
    "superior",
    "impressive",
    "highly rated",
    "well-known",
    "reputable",
    "go-to",
    "standout",
  ];

  // Negative indicators
  const negativeTerms = [
    "avoid",
    "poor",
    "worst",
    "bad",
    "unreliable",
    "expensive",
    "overpriced",
    "disappointing",
    "issues",
    "problems",
    "complaints",
    "not recommended",
    "below average",
    "mediocre",
    "lacking",
    "inferior",
    "questionable",
  ];

  const positiveCount = positiveTerms.filter((term) =>
    brandContext.includes(term)
  ).length;
  const negativeCount = negativeTerms.filter((term) =>
    brandContext.includes(term)
  ).length;

  if (positiveCount > negativeCount + 1) {
    return "positive";
  } else if (negativeCount > positiveCount + 1) {
    return "negative";
  }
  return "neutral";
}

/**
 * Extract rank/position from content if brand appears in a list
 */
function extractRankFromContent(
  content: string,
  brandIdentifiers: string[]
): number | undefined {
  const lowerContent = content.toLowerCase();

  // Common list patterns
  const listPatterns = [
    /(\d+)\.\s*([^.\n]+)/g, // "1. Brand Name"
    /\*\*(\d+)\.\s*([^*]+)\*\*/g, // "**1. Brand Name**"
    /(?:number|#|no\.?)\s*(\d+)[:\s]+([^\n]+)/gi, // "Number 1: Brand"
  ];

  for (const pattern of listPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const rank = parseInt(match[1], 10);
      const itemText = match[2].toLowerCase();

      for (const identifier of brandIdentifiers) {
        if (itemText.includes(identifier)) {
          return rank;
        }
      }
    }
  }

  return undefined;
}

/**
 * Calculate confidence score for the mention detection
 */
function calculateMentionConfidence(
  content: string,
  brandIdentifiers: string[],
  found: boolean
): number {
  if (!found) {
    return 0;
  }

  const lowerContent = content.toLowerCase();
  let confidence = 0.5; // Base confidence if found

  // Higher confidence for exact URL match
  for (const identifier of brandIdentifiers) {
    if (lowerContent.includes(identifier)) {
      confidence += 0.1;
    }
  }

  // Higher confidence if mentioned multiple times
  const mentionCount = brandIdentifiers.reduce((count, identifier) => {
    const regex = new RegExp(identifier, "gi");
    return count + (content.match(regex)?.length || 0);
  }, 0);

  if (mentionCount > 1) {
    confidence += 0.1 * Math.min(mentionCount - 1, 3);
  }

  // Higher confidence if mentioned with context (recommendation, review, etc.)
  const contextTerms = [
    "recommend",
    "suggest",
    "check out",
    "visit",
    "try",
    "consider",
  ];
  for (const term of contextTerms) {
    if (lowerContent.includes(term)) {
      confidence += 0.05;
    }
  }

  return Math.min(confidence, 1);
}

/**
 * Calculate overall brand visibility score from mentions
 */
export function calculateVisibilityScore(
  mentions: BrandMention[]
): BrandVisibilityScore {
  if (mentions.length === 0) {
    return {
      overall: 0,
      citationRate: 0,
      averageSentiment: 0,
      averageRank: null,
      consensusLevel: "none",
    };
  }

  // Citation rate
  const foundCount = mentions.filter((m) => m.found).length;
  const citationRate = (foundCount / mentions.length) * 100;

  // Average sentiment (-1 to 1)
  const sentimentScores: number[] = mentions.map((m) => {
    if (m.sentiment === "positive") return 1;
    if (m.sentiment === "negative") return -1;
    return 0;
  });
  const averageSentiment =
    sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;

  // Average rank (only from mentions that have a rank)
  const rankedMentions = mentions.filter(
    (m) => m.rank !== undefined && m.rank !== null
  );
  const averageRank =
    rankedMentions.length > 0
      ? rankedMentions.reduce((sum, m) => sum + (m.rank || 0), 0) /
        rankedMentions.length
      : null;

  // Consensus level
  const consensusLevel = calculateConsensusLevel(mentions);

  // Overall score (0-100)
  // Weighted: 40% citation rate, 30% sentiment, 20% rank, 10% confidence
  let overall = citationRate * 0.4;

  // Sentiment contribution (normalize -1 to 1 → 0 to 100)
  overall += ((averageSentiment + 1) / 2) * 100 * 0.3;

  // Rank contribution (lower is better, assume top 10 is good)
  if (averageRank !== null) {
    const rankScore = Math.max(0, (11 - averageRank) / 10) * 100;
    overall += rankScore * 0.2;
  } else {
    // If no rank data, give partial credit for being mentioned
    overall += (foundCount > 0 ? 50 : 0) * 0.2;
  }

  // Confidence contribution
  const avgConfidence =
    mentions.reduce((sum, m) => sum + m.confidence, 0) / mentions.length;
  overall += avgConfidence * 100 * 0.1;

  return {
    overall: Math.round(overall),
    citationRate,
    averageSentiment,
    averageRank,
    consensusLevel,
  };
}

/**
 * Calculate consensus level based on agreement among engines
 */
function calculateConsensusLevel(
  mentions: BrandMention[]
): "strong" | "moderate" | "weak" | "none" {
  if (mentions.length < 2) {
    return "none";
  }

  const foundCount = mentions.filter((m) => m.found).length;
  const foundRate = foundCount / mentions.length;

  // Check sentiment agreement
  const sentiments = mentions.filter((m) => m.found).map((m) => m.sentiment);
  const dominantSentiment = sentiments.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const maxSentimentCount = Math.max(
    ...Object.values(dominantSentiment),
    0
  );
  const sentimentAgreement =
    sentiments.length > 0 ? maxSentimentCount / sentiments.length : 0;

  // Strong: >80% citation rate and >80% sentiment agreement
  if (foundRate >= 0.8 && sentimentAgreement >= 0.8) {
    return "strong";
  }

  // Moderate: >60% citation rate and >60% sentiment agreement
  if (foundRate >= 0.6 && sentimentAgreement >= 0.6) {
    return "moderate";
  }

  // Weak: >40% citation rate
  if (foundRate >= 0.4) {
    return "weak";
  }

  return "none";
}

/**
 * Generate recommendations based on visibility analysis
 */
export function generateRecommendations(
  mentions: BrandMention[],
  score: BrandVisibilityScore
): string[] {
  const recommendations: string[] = [];

  // Low citation rate
  if (score.citationRate < 50) {
    recommendations.push(
      "Increase brand visibility by improving SEO and creating more authoritative content that LLMs can reference."
    );
    recommendations.push(
      "Consider developing comprehensive buying guides and comparison content for your product category."
    );
  }

  // Poor sentiment
  if (score.averageSentiment < 0) {
    recommendations.push(
      "Address negative sentiment by improving product quality, customer service, and online reviews."
    );
    recommendations.push(
      "Encourage satisfied customers to leave positive reviews on major platforms."
    );
  }

  // Low rank when mentioned
  if (score.averageRank !== null && score.averageRank > 5) {
    recommendations.push(
      "Work on becoming a top recommendation by establishing stronger market presence and brand authority."
    );
    recommendations.push(
      "Create more unique value propositions that differentiate your brand from competitors."
    );
  }

  // Weak consensus
  if (score.consensusLevel === "weak" || score.consensusLevel === "none") {
    recommendations.push(
      "Improve brand consistency across platforms to build stronger recognition among AI models."
    );
    recommendations.push(
      "Develop a more unified brand message that resonates across different information sources."
    );
  }

  // Check for missing engines
  const missingEngines = mentions.filter((m) => !m.found);
  if (missingEngines.length > 0) {
    const engineNames = missingEngines.map((m) => m.engineId).join(", ");
    recommendations.push(
      `Your brand was not cited by: ${engineNames}. Focus on building presence in data sources these models use.`
    );
  }

  // Positive feedback
  if (score.overall >= 70) {
    recommendations.push(
      "Good visibility! Maintain your current SEO and content strategy while continuing to monitor AI citation trends."
    );
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

// ============================================
// Competitor Extraction
// ============================================

/**
 * Common e-commerce and retail brands to detect as competitors
 */
const KNOWN_BRANDS: Record<string, { variations: string[], url?: string }> = {
  // Jewelry
  "Kay Jewelers": { variations: ["kay", "kay jewelers", "kay.com"], url: "kay.com" },
  "Jared": { variations: ["jared", "jared the galleria", "jared.com"], url: "jared.com" },
  "Zales": { variations: ["zales", "zales.com"], url: "zales.com" },
  "Blue Nile": { variations: ["blue nile", "bluenile", "bluenile.com"], url: "bluenile.com" },
  "James Allen": { variations: ["james allen", "jamesallen", "jamesallen.com"], url: "jamesallen.com" },
  "Tiffany": { variations: ["tiffany", "tiffany & co", "tiffany and co", "tiffany.com"], url: "tiffany.com" },
  "Brilliant Earth": { variations: ["brilliant earth", "brilliantearth"], url: "brilliantearth.com" },
  "Signet": { variations: ["signet jewelers", "signet"], url: "signetjewelers.com" },

  // Electronics
  "Best Buy": { variations: ["best buy", "bestbuy", "bestbuy.com"], url: "bestbuy.com" },
  "Amazon": { variations: ["amazon", "amazon.com"], url: "amazon.com" },
  "Walmart": { variations: ["walmart", "walmart.com"], url: "walmart.com" },
  "Target": { variations: ["target", "target.com"], url: "target.com" },
  "Newegg": { variations: ["newegg", "newegg.com"], url: "newegg.com" },
  "B&H": { variations: ["b&h", "b&h photo", "bhphoto", "bhphotovideo.com"], url: "bhphotovideo.com" },
  "Micro Center": { variations: ["micro center", "microcenter"], url: "microcenter.com" },

  // Fashion
  "Nordstrom": { variations: ["nordstrom", "nordstrom.com"], url: "nordstrom.com" },
  "Macy's": { variations: ["macy's", "macys", "macys.com"], url: "macys.com" },
  "ASOS": { variations: ["asos", "asos.com"], url: "asos.com" },
  "Zara": { variations: ["zara", "zara.com"], url: "zara.com" },
  "H&M": { variations: ["h&m", "hm", "hm.com"], url: "hm.com" },
  "Shein": { variations: ["shein", "shein.com"], url: "shein.com" },

  // Home
  "Wayfair": { variations: ["wayfair", "wayfair.com"], url: "wayfair.com" },
  "IKEA": { variations: ["ikea", "ikea.com"], url: "ikea.com" },
  "Home Depot": { variations: ["home depot", "homedepot", "homedepot.com"], url: "homedepot.com" },
  "Lowe's": { variations: ["lowe's", "lowes", "lowes.com"], url: "lowes.com" },
  "Pottery Barn": { variations: ["pottery barn", "potterybarn"], url: "potterybarn.com" },
  "West Elm": { variations: ["west elm", "westelm"], url: "westelm.com" },
  "Crate & Barrel": { variations: ["crate & barrel", "crate and barrel", "crateandbarrel"], url: "crateandbarrel.com" },

  // Watches
  "Rolex": { variations: ["rolex", "rolex.com"], url: "rolex.com" },
  "Citizen": { variations: ["citizen", "citizen watches", "citizenwatch.com"], url: "citizenwatch.com" },
  "Seiko": { variations: ["seiko", "seikowatches.com"], url: "seikowatches.com" },
  "Bulova": { variations: ["bulova", "bulova.com"], url: "bulova.com" },
  "Tissot": { variations: ["tissot", "tissotwatches.com"], url: "tissotwatches.com" },
  "Fossil": { variations: ["fossil", "fossil.com"], url: "fossil.com" },
  "Movado": { variations: ["movado", "movado.com"], url: "movado.com" },
  "Tag Heuer": { variations: ["tag heuer", "tagheuer"], url: "tagheuer.com" },
  "Omega": { variations: ["omega", "omega watches", "omegawatches.com"], url: "omegawatches.com" },
};

/**
 * Extract competitor mentions from LLM response
 */
export function extractCompetitorMentions(
  content: string,
  brandUrl: string,
  brandName?: string
): CompetitorMention[] {
  const lowerContent = content.toLowerCase();
  const competitors: CompetitorMention[] = [];

  // Get our brand's variations to exclude
  const ourBrandDomain = extractDomainName(brandUrl);
  const ourVariations = generateBrandVariations(ourBrandDomain, brandName, brandUrl);
  const ourVariationsLower = new Set(ourVariations.map(v => v.toLowerCase()));

  // Check each known brand
  for (const [brandDisplayName, brandInfo] of Object.entries(KNOWN_BRANDS)) {
    // Skip if this is our brand
    const isOurBrand = brandInfo.variations.some(v =>
      ourVariationsLower.has(v.toLowerCase()) ||
      (brandInfo.url && brandUrl.toLowerCase().includes(brandInfo.url))
    );

    if (isOurBrand) continue;

    // Check if this competitor is mentioned
    const mentioned = brandInfo.variations.some(v =>
      lowerContent.includes(v.toLowerCase())
    );

    if (mentioned) {
      // Extract context around the mention
      const mentionedVariation = brandInfo.variations.find(v =>
        lowerContent.includes(v.toLowerCase())
      ) || brandInfo.variations[0];

      const context = extractMentionContext(content, [mentionedVariation]);
      const sentiment = analyzeSentiment(content, [mentionedVariation]);

      competitors.push({
        name: brandDisplayName,
        url: brandInfo.url,
        context: context.substring(0, 150),
        sentiment,
      });
    }
  }

  // Also try to extract any URLs mentioned
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?/gi;
  const urlMatches = content.matchAll(urlPattern);

  for (const match of urlMatches) {
    const domain = match[1].toLowerCase();

    // Skip if it's our domain or already found
    if (ourVariationsLower.has(domain) ||
        domain.includes(ourBrandDomain.toLowerCase()) ||
        competitors.some(c => c.url?.includes(domain))) {
      continue;
    }

    // Skip common non-competitor domains
    const skipDomains = ['google.com', 'wikipedia.org', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'reddit.com'];
    if (skipDomains.some(d => domain.includes(d))) {
      continue;
    }

    const context = extractMentionContext(content, [domain]);

    competitors.push({
      name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      url: domain,
      context: context.substring(0, 150),
    });
  }

  // Remove duplicates and limit
  const uniqueCompetitors = competitors.filter((c, i, arr) =>
    arr.findIndex(x => x.name.toLowerCase() === c.name.toLowerCase()) === i
  );

  return uniqueCompetitors.slice(0, 10);
}

/**
 * Create a complete brand visibility result from engine responses
 */
export function createBrandVisibilityResult(
  query: string,
  brandUrl: string,
  brandName: string | undefined,
  engineResponses: Partial<Record<CouncilEngineId, CouncilEngineResponse>>,
  totalCost: number
): BrandVisibilityResult {
  const mentions: BrandMention[] = [];

  for (const [engineId, response] of Object.entries(engineResponses)) {
    if (response?.content) {
      const mention = extractBrandMention(
        engineId as CouncilEngineId,
        response.content,
        brandUrl,
        brandName
      );
      mentions.push(mention);
    }
  }

  const score = calculateVisibilityScore(mentions);
  const recommendations = generateRecommendations(mentions, score);

  return {
    query,
    brandUrl,
    brandName,
    timestamp: Date.now(),
    mentions,
    score,
    engineResponses,
    recommendations,
    totalCost,
  };
}
