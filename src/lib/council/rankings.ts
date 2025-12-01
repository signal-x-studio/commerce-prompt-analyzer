/**
 * Ranking Aggregation Utilities
 *
 * Implements rank aggregation for council mode evaluations.
 * Uses average position ranking inspired by Karpathy's llm-council.
 *
 * Key features:
 * - Borda count scoring
 * - Tie handling with deterministic resolution
 * - Confidence scoring based on agreement
 * - Support for both peer review and judge evaluations
 */

import type { CouncilEngineId } from "../security/api-keys";
import type { BlindMapping } from "./blind-review";

// Single evaluation from one judge
export interface Evaluation {
  judgeId: CouncilEngineId | "peer";
  rankings: RankingEntry[];
  reasoning?: string;
  timestamp: number;
}

// Single ranking entry
export interface RankingEntry {
  blindId: string;
  rank: number; // 1 = best
  score?: number; // Optional numeric score
  feedback?: string; // Optional qualitative feedback
}

// Aggregated result for one response
export interface AggregatedRank {
  blindId: string;
  engineId: CouncilEngineId;
  averageRank: number;
  bordaScore: number;
  rankings: number[]; // Individual ranks received
  agreementScore: number; // 0-1, how consistent the rankings are
  finalRank: number; // Resolved final position
}

// Complete aggregation result
export interface AggregationResult {
  rankings: AggregatedRank[];
  winner: AggregatedRank;
  totalEvaluations: number;
  consensusLevel: "strong" | "moderate" | "weak" | "none";
}

/**
 * Calculate Borda count score for a position
 * Higher score = better ranking
 *
 * @param rank - Position (1 = best)
 * @param totalCandidates - Total number of responses being ranked
 */
function bordaScore(rank: number, totalCandidates: number): number {
  return totalCandidates - rank;
}

/**
 * Calculate agreement score (0-1) based on rank variance
 * 1 = perfect agreement, 0 = maximum disagreement
 */
function calculateAgreement(rankings: number[]): number {
  if (rankings.length <= 1) return 1;

  const mean = rankings.reduce((a, b) => a + b, 0) / rankings.length;
  const variance =
    rankings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rankings.length;

  // Max possible variance for rank spread
  const maxRank = Math.max(...rankings);
  const minRank = Math.min(...rankings);
  const maxVariance = Math.pow(maxRank - minRank, 2) / 4;

  if (maxVariance === 0) return 1;

  return Math.max(0, 1 - variance / maxVariance);
}

/**
 * Determine consensus level from agreement scores
 */
function determineConsensusLevel(
  rankings: AggregatedRank[]
): "strong" | "moderate" | "weak" | "none" {
  const avgAgreement =
    rankings.reduce((sum, r) => sum + r.agreementScore, 0) / rankings.length;

  if (avgAgreement >= 0.85) return "strong";
  if (avgAgreement >= 0.6) return "moderate";
  if (avgAgreement >= 0.35) return "weak";
  return "none";
}

/**
 * Resolve ties deterministically using secondary criteria
 */
function resolveTies(rankings: AggregatedRank[]): AggregatedRank[] {
  // Sort by: 1) averageRank (lower better), 2) bordaScore (higher better),
  // 3) agreementScore (higher better), 4) blindId (alphabetical for determinism)
  const sorted = [...rankings].sort((a, b) => {
    // Primary: average rank (ascending)
    if (a.averageRank !== b.averageRank) {
      return a.averageRank - b.averageRank;
    }
    // Secondary: borda score (descending)
    if (a.bordaScore !== b.bordaScore) {
      return b.bordaScore - a.bordaScore;
    }
    // Tertiary: agreement score (descending)
    if (a.agreementScore !== b.agreementScore) {
      return b.agreementScore - a.agreementScore;
    }
    // Quaternary: alphabetical for determinism
    return a.blindId.localeCompare(b.blindId);
  });

  // Assign final ranks
  return sorted.map((rank, index) => ({
    ...rank,
    finalRank: index + 1,
  }));
}

/**
 * Aggregate multiple evaluations into final rankings
 *
 * @param evaluations - Array of evaluations from different judges
 * @param mapping - Blind ID to engine ID mapping
 * @returns Aggregated rankings with winner
 */
export function aggregateRankings(
  evaluations: Evaluation[],
  mapping: BlindMapping[]
): AggregationResult {
  if (evaluations.length === 0) {
    throw new Error("No evaluations to aggregate");
  }

  // Build a map of blindId -> engine info
  const engineMap = new Map(
    mapping.map((m) => [m.blindId, m.engineId])
  );

  // Collect all blindIds from evaluations
  const allBlindIds = new Set<string>();
  evaluations.forEach((evaluation) => {
    evaluation.rankings.forEach((r) => allBlindIds.add(r.blindId));
  });

  const totalCandidates = allBlindIds.size;

  // Aggregate rankings per blindId
  const aggregated: Map<string, AggregatedRank> = new Map();

  allBlindIds.forEach((blindId) => {
    const individualRankings: number[] = [];
    let totalBorda = 0;

    evaluations.forEach((evaluation) => {
      const entry = evaluation.rankings.find((r) => r.blindId === blindId);
      if (entry) {
        individualRankings.push(entry.rank);
        totalBorda += bordaScore(entry.rank, totalCandidates);
      }
    });

    const averageRank =
      individualRankings.reduce((a, b) => a + b, 0) / individualRankings.length;

    aggregated.set(blindId, {
      blindId,
      engineId: engineMap.get(blindId) || ("unknown" as CouncilEngineId),
      averageRank,
      bordaScore: totalBorda,
      rankings: individualRankings,
      agreementScore: calculateAgreement(individualRankings),
      finalRank: 0, // Will be set by resolveTies
    });
  });

  // Convert to array and resolve ties
  const rankingsArray = Array.from(aggregated.values());
  const resolvedRankings = resolveTies(rankingsArray);

  // Find winner (finalRank === 1)
  const winner = resolvedRankings.find((r) => r.finalRank === 1)!;

  return {
    rankings: resolvedRankings,
    winner,
    totalEvaluations: evaluations.length,
    consensusLevel: determineConsensusLevel(resolvedRankings),
  };
}

/**
 * Parse ranking from LLM judge response
 * Expects format like: "1. Response A\n2. Response B\n3. Response C"
 */
export function parseRankingsFromText(
  text: string,
  expectedBlindIds: string[]
): RankingEntry[] {
  const rankings: RankingEntry[] = [];

  // Pattern matches "1. Response A" or "1) Response A" or "#1 Response A"
  const rankPattern = /(?:^|\n)\s*(?:#?\d+[\.\):]?\s*)(Response\s+[A-Z])/gi;
  let match;
  let rank = 1;

  while ((match = rankPattern.exec(text)) !== null) {
    const blindId = match[1].replace(/\s+/g, " ").trim();
    if (expectedBlindIds.includes(blindId)) {
      rankings.push({
        blindId,
        rank,
      });
      rank++;
    }
  }

  // If pattern matching fails, try to find responses in order of appearance
  if (rankings.length === 0) {
    rank = 1;
    for (const blindId of expectedBlindIds) {
      const normalizedBlindId = blindId.replace(/\s+/g, " ");
      if (text.includes(normalizedBlindId)) {
        rankings.push({
          blindId: normalizedBlindId,
          rank,
        });
        rank++;
      }
    }
  }

  return rankings;
}

/**
 * Generate ranking summary for display
 */
export function formatRankingSummary(result: AggregationResult): string {
  const lines = [
    `Council Verdict (${result.consensusLevel} consensus from ${result.totalEvaluations} evaluations)`,
    "",
    "Final Rankings:",
  ];

  result.rankings.forEach((r) => {
    const agreementPct = Math.round(r.agreementScore * 100);
    lines.push(
      `  ${r.finalRank}. ${r.engineId} (avg rank: ${r.averageRank.toFixed(2)}, agreement: ${agreementPct}%)`
    );
  });

  lines.push("");
  lines.push(`Winner: ${result.winner.engineId}`);

  return lines.join("\n");
}

/**
 * Calculate win rate for each engine across multiple queries
 */
export interface WinRateStats {
  engineId: CouncilEngineId;
  wins: number;
  totalQueries: number;
  winRate: number;
  avgRank: number;
}

export function calculateWinRates(
  results: AggregationResult[]
): WinRateStats[] {
  if (results.length === 0) return [];

  // Collect all unique engines
  const engineStats = new Map<
    CouncilEngineId,
    { wins: number; totalRanks: number; count: number }
  >();

  results.forEach((result) => {
    result.rankings.forEach((ranking) => {
      const current = engineStats.get(ranking.engineId) || {
        wins: 0,
        totalRanks: 0,
        count: 0,
      };

      current.count++;
      current.totalRanks += ranking.finalRank;
      if (ranking.finalRank === 1) {
        current.wins++;
      }

      engineStats.set(ranking.engineId, current);
    });
  });

  return Array.from(engineStats.entries())
    .map(([engineId, stats]) => ({
      engineId,
      wins: stats.wins,
      totalQueries: stats.count,
      winRate: stats.wins / stats.count,
      avgRank: stats.totalRanks / stats.count,
    }))
    .sort((a, b) => b.winRate - a.winRate);
}
