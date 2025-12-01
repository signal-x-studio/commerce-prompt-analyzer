'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { UsageMetadata } from '../types';

// Pricing for Gemini 2.0 Flash (approximate)
// Input: $0.10 / 1M tokens
// Output: $0.40 / 1M tokens
const PRICE_PER_MILLION_INPUT = 0.10;
const PRICE_PER_MILLION_OUTPUT = 0.40;

// Default budget limits
const DEFAULT_BUDGET_LIMIT = 1.00; // $1.00 default
const WARNING_THRESHOLD = 0.8; // Warn at 80% of budget

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

interface CostContextType {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  budgetLimit: number;
  budgetStatus: BudgetStatus;
  budgetRemaining: number;
  budgetPercentUsed: number;
  trackUsage: (usage?: UsageMetadata) => void;
  trackCost: (cost: number) => void;
  resetCost: () => void;
  setBudgetLimit: (limit: number) => void;
  wouldExceedBudget: (estimatedCost: number) => boolean;
}

const CostContext = createContext<CostContextType | undefined>(undefined);

export const CostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalCost, setTotalCost] = useState(0);
  const [totalInputTokens, setTotalInputTokens] = useState(0);
  const [totalOutputTokens, setTotalOutputTokens] = useState(0);
  const [budgetLimit, setBudgetLimitState] = useState(DEFAULT_BUDGET_LIMIT);

  const trackUsage = useCallback((usage?: UsageMetadata) => {
    if (!usage) return;

    const inputTokens = usage.promptTokenCount || 0;
    const outputTokens = usage.candidatesTokenCount || 0;

    const cost = (inputTokens / 1_000_000 * PRICE_PER_MILLION_INPUT) +
                 (outputTokens / 1_000_000 * PRICE_PER_MILLION_OUTPUT);

    setTotalCost(prev => prev + cost);
    setTotalInputTokens(prev => prev + inputTokens);
    setTotalOutputTokens(prev => prev + outputTokens);
  }, []);

  const trackCost = useCallback((cost: number) => {
    setTotalCost(prev => prev + cost);
  }, []);

  const resetCost = useCallback(() => {
    setTotalCost(0);
    setTotalInputTokens(0);
    setTotalOutputTokens(0);
  }, []);

  const setBudgetLimit = useCallback((limit: number) => {
    setBudgetLimitState(Math.max(0.01, limit)); // Minimum $0.01
  }, []);

  const wouldExceedBudget = useCallback((estimatedCost: number) => {
    return (totalCost + estimatedCost) > budgetLimit;
  }, [totalCost, budgetLimit]);

  const budgetRemaining = useMemo(() =>
    Math.max(0, budgetLimit - totalCost),
    [budgetLimit, totalCost]
  );

  const budgetPercentUsed = useMemo(() =>
    budgetLimit > 0 ? (totalCost / budgetLimit) * 100 : 0,
    [totalCost, budgetLimit]
  );

  const budgetStatus = useMemo((): BudgetStatus => {
    if (totalCost >= budgetLimit) return 'exceeded';
    if (totalCost >= budgetLimit * WARNING_THRESHOLD) return 'warning';
    return 'ok';
  }, [totalCost, budgetLimit]);

  return (
    <CostContext.Provider value={{
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      budgetLimit,
      budgetStatus,
      budgetRemaining,
      budgetPercentUsed,
      trackUsage,
      trackCost,
      resetCost,
      setBudgetLimit,
      wouldExceedBudget,
    }}>
      {children}
    </CostContext.Provider>
  );
};

export const useCost = () => {
  const context = useContext(CostContext);
  if (context === undefined) {
    throw new Error('useCost must be used within a CostProvider');
  }
  return context;
};
