"use client";

import React, { useEffect, useState } from "react";

interface ApiStatus {
  gemini: { configured: boolean; models: string[] };
  openRouter: { configured: boolean; models: string[] };
  allConfigured: boolean;
  anyConfigured: boolean;
  missingKeys: string[];
}

export function ApiKeyWarning() {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/visibility/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to check API status:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !status || status.allConfigured || dismissed) {
    return null;
  }

  const isFullyUnconfigured = !status.anyConfigured;

  return (
    <div
      className={`rounded-xl border p-4 mb-6 ${
        isFullyUnconfigured
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-1.5 rounded-full ${
            isFullyUnconfigured ? "bg-red-100" : "bg-amber-100"
          }`}
        >
          <svg
            className={`w-5 h-5 ${
              isFullyUnconfigured ? "text-red-600" : "text-amber-600"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4
            className={`text-sm font-semibold ${
              isFullyUnconfigured ? "text-red-800" : "text-amber-800"
            }`}
          >
            {isFullyUnconfigured
              ? "No API Keys Configured"
              : "Some API Keys Missing"}
          </h4>
          <p
            className={`text-sm mt-1 ${
              isFullyUnconfigured ? "text-red-700" : "text-amber-700"
            }`}
          >
            {isFullyUnconfigured
              ? "Tests will fail because no API keys are configured. Please add API keys to your environment."
              : "Some models may fail during testing due to missing API keys."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {status.missingKeys.map((key) => (
              <span
                key={key}
                className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${
                  isFullyUnconfigured
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {key}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Add these environment variables in your Vercel dashboard or local{" "}
            <code className="bg-slate-200 px-1 rounded">.env.local</code> file.
            <span className="mx-1">•</span>
            <span className="font-medium">Mock Mode</span> works without API keys for testing.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={`p-1 rounded hover:bg-opacity-50 ${
            isFullyUnconfigured ? "hover:bg-red-200" : "hover:bg-amber-200"
          }`}
        >
          <svg
            className={`w-4 h-4 ${
              isFullyUnconfigured ? "text-red-500" : "text-amber-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
