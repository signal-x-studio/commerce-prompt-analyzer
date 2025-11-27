import React, { useMemo } from 'react';
import { TestResult, EngineId, ENGINES } from '../types';

interface CompetitorLeaderboardProps {
    testResults: Record<string, Partial<Record<EngineId, TestResult>>>;
    userUrl: string;
}

export const CompetitorLeaderboard: React.FC<CompetitorLeaderboardProps> = ({ testResults, userUrl }) => {
    const userDomain = new URL(userUrl).hostname.replace('www.', '');

    const { leaderboard, overlap } = useMemo(() => {
        const domainCounts: Record<string, number> = {};
        const overlapCounts: Record<string, number> = {};
        let totalCitations = 0;
        let userFoundCount = 0;

        Object.values(testResults).forEach(engineResults => {
            Object.values(engineResults).forEach(result => {
                if (result?.sources) {
                    const domainsInPrompt = new Set<string>();
                    let userInPrompt = false;

                    result.sources.forEach(source => {
                        try {
                            const domain = new URL(source.uri).hostname.replace('www.', '');
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
                        domainsInPrompt.forEach(domain => {
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
                percentage: totalCitations > 0 ? Math.round((count / totalCitations) * 100) : 0
            }));

        const sortedOverlap = Object.entries(overlapCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([domain, count]) => ({
                domain,
                count,
                percentage: userFoundCount > 0 ? Math.round((count / userFoundCount) * 100) : 0
            }));

        return { leaderboard: sortedLeaderboard, overlap: sortedOverlap };
    }, [testResults, userDomain]);

    if (leaderboard.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Share of Voice (Leaderboard)</h3>
                <div className="space-y-3">
                    {leaderboard.map((item, index) => (
                        <div key={item.domain} className="flex items-center">
                            <span className={`w-6 text-sm font-bold ${index === 0 ? 'text-yellow-500' : 'text-slate-400'}`}>
                                #{index + 1}
                            </span>
                            <div className="flex-grow">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className={`font-medium ${item.domain.includes(userDomain) ? 'text-blue-600' : 'text-slate-700'}`}>
                                        {item.domain}
                                    </span>
                                    <span className="text-slate-500">{item.percentage}% ({item.count})</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full ${item.domain.includes(userDomain) ? 'bg-blue-500' : 'bg-slate-400'}`}
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Common Competitors (Overlap)</h3>
                <p className="text-xs text-slate-500 mb-4">
                    When <strong>{userDomain}</strong> appears, these domains also appear:
                </p>
                {overlap.length > 0 ? (
                    <div className="space-y-3">
                        {overlap.map((item, index) => (
                            <div key={item.domain} className="flex items-center">
                                <span className="w-6 text-sm font-bold text-slate-400">
                                    #{index + 1}
                                </span>
                                <div className="flex-grow">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">{item.domain}</span>
                                        <span className="text-slate-500">{item.percentage}% co-occurrence</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div 
                                            className="h-2 rounded-full bg-orange-400"
                                            style={{ width: `${item.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-slate-500 italic">
                        No overlap data available yet. Run more tests where your domain is found.
                    </div>
                )}
            </div>
        </div>
    );
};
