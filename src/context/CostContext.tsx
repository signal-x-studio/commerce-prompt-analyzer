'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { UsageMetadata } from '../types';

// Pricing for Gemini 2.0 Flash (approximate)
// Input: $0.10 / 1M tokens
// Output: $0.40 / 1M tokens
const PRICE_PER_MILLION_INPUT = 0.10;
const PRICE_PER_MILLION_OUTPUT = 0.40;

interface CostContextType {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  trackUsage: (usage?: UsageMetadata) => void;
  resetCost: () => void;
}

const CostContext = createContext<CostContextType | undefined>(undefined);

export const CostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalCost, setTotalCost] = useState(0);
  const [totalInputTokens, setTotalInputTokens] = useState(0);
  const [totalOutputTokens, setTotalOutputTokens] = useState(0);

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

  const resetCost = useCallback(() => {
    setTotalCost(0);
    setTotalInputTokens(0);
    setTotalOutputTokens(0);
  }, []);

  return (
    <CostContext.Provider value={{ totalCost, totalInputTokens, totalOutputTokens, trackUsage, resetCost }}>
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
