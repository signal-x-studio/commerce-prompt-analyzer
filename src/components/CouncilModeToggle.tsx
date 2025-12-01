"use client";

import React from "react";
import type { CouncilEngineId } from "../types";

interface CouncilModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  selectedEngines: CouncilEngineId[];
  onEngineToggle: (engineId: CouncilEngineId) => void;
  disabled?: boolean;
}

const ENGINE_OPTIONS: { id: CouncilEngineId; name: string; color: string }[] = [
  { id: "gemini", name: "Gemini 2.0", color: "bg-blue-500" },
  { id: "gpt4o", name: "GPT-4o", color: "bg-green-500" },
  { id: "claude", name: "Claude 3.5", color: "bg-orange-500" },
  { id: "llama", name: "Llama 3.1", color: "bg-purple-500" },
];

export const CouncilModeToggle: React.FC<CouncilModeToggleProps> = ({
  enabled,
  onToggle,
  selectedEngines,
  onEngineToggle,
  disabled = false,
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border transition-all duration-300
        ${enabled ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"}
      `}
    >
      {/* Toggle Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
              p-2 rounded-lg transition-colors
              ${enabled ? "bg-indigo-100" : "bg-slate-100"}
            `}
          >
            <svg
              className={`w-5 h-5 ${enabled ? "text-indigo-600" : "text-slate-400"}`}
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
          </div>
          <div>
            <h3 className="font-medium text-slate-800">Council Mode</h3>
            <p className="text-xs text-slate-500">
              Test prompts across multiple AI models for brand visibility analysis
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            disabled={disabled}
          />
          <div
            className={`
              w-11 h-6 bg-slate-200 rounded-full peer
              peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300
              peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
              peer-checked:after:border-white
              after:content-[''] after:absolute after:top-[2px] after:start-[2px]
              after:bg-white after:border-slate-300 after:border after:rounded-full
              after:h-5 after:w-5 after:transition-all
              peer-checked:bg-indigo-600
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
        </label>
      </div>

      {/* Engine Selection (shown when enabled) */}
      {enabled && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-3">Select AI models to query:</p>
          <div className="flex flex-wrap gap-2">
            {ENGINE_OPTIONS.map((engine) => {
              const isSelected = selectedEngines.includes(engine.id);
              const canDeselect = selectedEngines.length > 2;

              return (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => onEngineToggle(engine.id)}
                  disabled={disabled || (isSelected && !canDeselect)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    flex items-center gap-2
                    ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }
                    ${disabled || (isSelected && !canDeselect) ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-white" : engine.color
                    }`}
                  />
                  {engine.name}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {selectedEngines.length} models selected (min 2)
          </p>
        </div>
      )}

      {/* Info Banner */}
      {enabled && (
        <div className="px-4 pb-4">
          <div className="bg-indigo-50 rounded-lg p-3 text-xs text-indigo-700">
            <strong>Council Mode:</strong> Each prompt will be tested across{" "}
            {selectedEngines.length} AI models. Results will show brand visibility
            scores, citation rates, and consensus analysis.
          </div>
        </div>
      )}
    </div>
  );
};
