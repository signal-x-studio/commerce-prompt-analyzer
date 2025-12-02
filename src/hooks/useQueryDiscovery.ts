"use client";

import { useState, useCallback, useEffect } from "react";
import type { VisibilityQuery, AdvancedAnalysisSettings } from "../types";

// ============================================
// Types
// ============================================

export interface Industry {
  id: string;
  name: string;
}

export interface ContentAnalysisSummary {
  pageType: string;
  title: string;
  topics: string[];
  categories: string[];
  chunkCount: number;
}

export interface UseQueryDiscoveryReturn {
  queries: VisibilityQuery[];
  isLoading: boolean;
  error: string | null;
  industries: Industry[];
  contentAnalysis: ContentAnalysisSummary | null;

  // Actions
  suggestWithAI: (brandUrl: string, brandName?: string, industry?: string, count?: number) => Promise<void>;
  loadIndustryTemplate: (industry: string) => Promise<void>;
  deriveFromContent: (brandUrl: string, count?: number, enableMatchRate?: boolean) => Promise<void>;
  classifyQueries: (brandUrl?: string, enableMatchRate?: boolean) => Promise<void>;
  addCustomQuery: (text: string, category?: string) => void;
  toggleQuery: (queryId: string) => void;
  removeQuery: (queryId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  clearQueries: () => void;
  setQueries: (queries: VisibilityQuery[]) => void;

  // Computed
  selectedCount: number;
}

// ============================================
// Hook
// ============================================

export function useQueryDiscovery(): UseQueryDiscoveryReturn {
  const [queries, setQueries] = useState<VisibilityQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysisSummary | null>(null);

  // Load industries on first use
  const loadIndustries = useCallback(async () => {
    if (industries.length > 0) return;

    try {
      const response = await fetch("/api/visibility/suggest-queries");
      if (response.ok) {
        const data = await response.json();
        setIndustries(data.industries || []);
      }
    } catch (e) {
      console.error("Failed to load industries:", e);
    }
  }, [industries.length]);

  // Suggest queries with AI
  const suggestWithAI = useCallback(
    async (brandUrl: string, brandName?: string, industry?: string, count: number = 10) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/visibility/suggest-queries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "ai",
            brandUrl,
            brandName,
            industry,
            count,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate queries");
        }

        const data = await response.json();
        const newQueries = data.queries || [];

        // Add without duplicates
        setQueries((prev) => {
          const existingTexts = new Set(prev.map((q) => q.text.toLowerCase()));
          const unique = newQueries.filter(
            (q: VisibilityQuery) => !existingTexts.has(q.text.toLowerCase())
          );
          return [...prev, ...unique];
        });
      } catch (e: any) {
        setError(e.message || "Failed to generate AI queries");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Load industry template queries
  const loadIndustryTemplate = useCallback(async (industry: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/visibility/suggest-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "template",
          industry,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load template");
      }

      const data = await response.json();
      const newQueries = data.queries || [];

      // Add without duplicates
      setQueries((prev) => {
        const existingTexts = new Set(prev.map((q) => q.text.toLowerCase()));
        const unique = newQueries.filter(
          (q: VisibilityQuery) => !existingTexts.has(q.text.toLowerCase())
        );
        return [...prev, ...unique];
      });
    } catch (e: any) {
      setError(e.message || "Failed to load industry template");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Derive queries from content (GEO Framework - NEW)
  const deriveFromContent = useCallback(
    async (brandUrl: string, count: number = 10, enableMatchRate: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/visibility/suggest-queries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "content-derived",
            brandUrl,
            count,
            enableMatchRateScoring: enableMatchRate,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to derive queries from content");
        }

        const data = await response.json();
        const newQueries = data.queries || [];

        // Store content analysis summary
        if (data.contentAnalysis) {
          setContentAnalysis(data.contentAnalysis);
        }

        // Add without duplicates
        setQueries((prev) => {
          const existingTexts = new Set(prev.map((q) => q.text.toLowerCase()));
          const unique = newQueries.filter(
            (q: VisibilityQuery) => !existingTexts.has(q.text.toLowerCase())
          );
          return [...prev, ...unique];
        });
      } catch (e: any) {
        setError(e.message || "Failed to derive queries from content");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Classify existing queries (GEO Framework - NEW)
  const classifyQueriesFn = useCallback(
    async (brandUrl?: string, enableMatchRate: boolean = false) => {
      if (queries.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/visibility/suggest-queries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "classify",
            queries: queries.map((q) => ({
              id: q.id,
              text: q.text,
              source: q.source,
              category: q.category,
              selected: q.selected,
            })),
            brandUrl,
            enableMatchRateScoring: enableMatchRate,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to classify queries");
        }

        const data = await response.json();
        const classifiedQueries = data.queries || [];

        // Replace queries with classified versions
        setQueries(classifiedQueries);
      } catch (e: any) {
        setError(e.message || "Failed to classify queries");
      } finally {
        setIsLoading(false);
      }
    },
    [queries]
  );

  // Add custom query
  const addCustomQuery = useCallback((text: string, category?: string) => {
    if (!text.trim()) return;

    const newQuery: VisibilityQuery = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      source: "custom",
      category: category || "Custom",
      selected: true,
    };

    setQueries((prev) => {
      // Check for duplicate
      const exists = prev.some(
        (q) => q.text.toLowerCase() === newQuery.text.toLowerCase()
      );
      if (exists) return prev;
      return [...prev, newQuery];
    });
  }, []);

  // Toggle query selection
  const toggleQuery = useCallback((queryId: string) => {
    setQueries((prev) =>
      prev.map((q) => (q.id === queryId ? { ...q, selected: !q.selected } : q))
    );
  }, []);

  // Remove query
  const removeQuery = useCallback((queryId: string) => {
    setQueries((prev) => prev.filter((q) => q.id !== queryId));
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    setQueries((prev) => prev.map((q) => ({ ...q, selected: true })));
  }, []);

  // Deselect all
  const deselectAll = useCallback(() => {
    setQueries((prev) => prev.map((q) => ({ ...q, selected: false })));
  }, []);

  // Clear all queries
  const clearQueries = useCallback(() => {
    setQueries([]);
    setError(null);
  }, []);

  // Load industries on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined" && industries.length === 0) {
      loadIndustries();
    }
  }, [loadIndustries, industries.length]);

  return {
    queries,
    isLoading,
    error,
    industries,
    contentAnalysis,
    suggestWithAI,
    loadIndustryTemplate,
    deriveFromContent,
    classifyQueries: classifyQueriesFn,
    addCustomQuery,
    toggleQuery,
    removeQuery,
    selectAll,
    deselectAll,
    clearQueries,
    setQueries,
    selectedCount: queries.filter((q) => q.selected).length,
  };
}
