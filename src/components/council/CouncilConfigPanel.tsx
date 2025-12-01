"use client";

import React from "react";
import { COUNCIL_ENGINES, type CouncilConfig, type CouncilEngineId } from "../../types";

interface CouncilConfigPanelProps {
  config: CouncilConfig;
  onConfigChange: (updates: Partial<CouncilConfig>) => void;
  onEngineToggle: (engineId: CouncilEngineId) => void;
  disabled?: boolean;
}

const ENGINE_ORDER: CouncilEngineId[] = ["gemini", "gpt4o", "claude", "llama"];

const ENGINE_COLORS: Record<CouncilEngineId, { bg: string; border: string; text: string }> = {
  gemini: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
  },
  gpt4o: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-700",
  },
  claude: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-700",
  },
  llama: {
    bg: "bg-purple-50",
    border: "border-purple-300",
    text: "text-purple-700",
  },
};

export const CouncilConfigPanel: React.FC<CouncilConfigPanelProps> = ({
  config,
  onConfigChange,
  onEngineToggle,
  disabled,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Select Models (min 2)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ENGINE_ORDER.map((engineId) => {
            const engine = COUNCIL_ENGINES[engineId];
            const isSelected = config.engines.includes(engineId);
            const colors = ENGINE_COLORS[engineId];

            return (
              <button
                key={engineId}
                type="button"
                onClick={() => onEngineToggle(engineId)}
                disabled={disabled || (isSelected && config.engines.length <= 2)}
                className={`
                  relative p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected
                    ? `${colors.bg} ${colors.border} ${colors.text}`
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className="font-semibold text-sm">{engine.name}</div>
                <div className="text-xs mt-1 opacity-75">{engine.provider}</div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <svg
                      className={`w-5 h-5 ${colors.text}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Judge Model
          </label>
          <select
            value={config.judgeEngine}
            onChange={(e) => onConfigChange({ judgeEngine: e.target.value as CouncilEngineId })}
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
          >
            {config.engines.map((engineId) => (
              <option key={engineId} value={engineId}>
                {COUNCIL_ENGINES[engineId].name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Evaluates and ranks responses from other models
          </p>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Options
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableSynthesis}
              onChange={(e) => onConfigChange({ enableSynthesis: e.target.checked })}
              disabled={disabled}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            <span className="ms-3 text-sm font-medium text-slate-700">
              Enable Response Synthesis
            </span>
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Creates an optimal combined response from ranked outputs
          </p>
        </div>
      </div>
    </div>
  );
};
