import React, { useMemo } from "react";
import { EngineId, TestResult } from "../types";
import { Card, CardContent } from "./ui/Card";

interface CompetitorLeaderboardProps {
  testResults: Record<string, Partial<Record<EngineId, TestResult>>>;
  userUrl: string;
}

const StatCard: React.FC<{
  rank: number;
  domain: string;
  percentage: number;
  count: number;
  isUser?: boolean;
  colorClass?: string;
}> = ({
  rank,
  domain,
  percentage,
  count,
  isUser,
  colorClass = "bg-slate-500",
}) => (
  <Card
    className={`flex flex-col justify-between h-full ${
      isUser ? "border-indigo-200 ring-1 ring-indigo-100" : ""
    }`}
  >
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            rank === 1
              ? "bg-yellow-100 text-yellow-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          #{rank}
        </span>
        <span className="text-2xl font-bold text-slate-800">{percentage}%</span>
      </div>

      <div className="mb-3">
        <h4
          className={`font-medium truncate ${
            isUser ? "text-indigo-700" : "text-slate-700"
          }`}
          title={domain}
        >
          {domain}
        </h4>
        <p className="text-xs text-slate-400">{count} citations</p>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            isUser ? "bg-indigo-500" : colorClass
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </CardContent>
  </Card>
);

export const CompetitorLeaderboard: React.FC<CompetitorLeaderboardProps> = ({
  testResults,
  userUrl,
}) => {
  const userDomain = new URL(userUrl).hostname.replace("www.", "");

  const { leaderboard, overlap } = useMemo(() => {
    const domainCounts: Record<string, number> = {};
    const overlapCounts: Record<string, number> = {};
    let totalCitations = 0;
    let userFoundCount = 0;

    Object.values(testResults).forEach((engineResults) => {
      Object.values(engineResults).forEach((result) => {
        if (result?.sources) {
          const domainsInPrompt = new Set<string>();
          let userInPrompt = false;

          result.sources.forEach((source) => {
            try {
              const domain = new URL(source.uri).hostname.replace("www.", "");
              domainsInPrompt.add(domain);

              domainCounts[domain] = (domainCounts[domain] || 0) + 1;
              totalCitations++;

              if (domain.includes(userDomain)) {
                userInPrompt = true;
              }
            } catch (e) {
              // ignore invalid urls
            }
          });

          if (userInPrompt) {
            userFoundCount++;
            domainsInPrompt.forEach((domain) => {
              if (!domain.includes(userDomain)) {
                overlapCounts[domain] = (overlapCounts[domain] || 0) + 1;
              }
            });
          }
        }
      });
    });

    const sortedLeaderboard = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({
        domain,
        count,
        percentage:
          totalCitations > 0 ? Math.round((count / totalCitations) * 100) : 0,
      }));

    const sortedOverlap = Object.entries(overlapCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain, count]) => ({
        domain,
        count,
        percentage:
          userFoundCount > 0 ? Math.round((count / userFoundCount) * 100) : 0,
      }));

    return { leaderboard: sortedLeaderboard, overlap: sortedOverlap };
  }, [testResults, userDomain]);

  if (leaderboard.length === 0) return null;

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          Share of Voice
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {leaderboard.map((item, index) => (
            <StatCard
              key={item.domain}
              rank={index + 1}
              domain={item.domain}
              percentage={item.percentage}
              count={item.count}
              isUser={item.domain.includes(userDomain)}
              colorClass="bg-blue-500"
            />
          ))}
        </div>
      </section>

      {overlap.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Common Competitors (Overlap)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {overlap.map((item, index) => (
              <StatCard
                key={item.domain}
                rank={index + 1}
                domain={item.domain}
                percentage={item.percentage}
                count={item.count}
                colorClass="bg-orange-400"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
