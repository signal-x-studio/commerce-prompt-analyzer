"use client";

import React from "react";
import type { CouncilSessionStatus } from "../../types";

interface CouncilProgressProps {
  status: CouncilSessionStatus;
  currentStage: number;
  stageName: string;
}

const STAGES = [
  { id: 1, name: "Query", description: "Querying AI models" },
  { id: 2, name: "Evaluate", description: "Evaluating responses" },
  { id: 3, name: "Synthesize", description: "Synthesizing optimal answer" },
];

export const CouncilProgress: React.FC<CouncilProgressProps> = ({
  status,
  currentStage,
  stageName,
}) => {
  const isComplete = status === "complete";
  const isError = status === "error";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">Progress</h3>
        {!isComplete && !isError && (
          <span className="text-sm text-indigo-600 font-medium animate-pulse">
            {stageName || "Processing..."}
          </span>
        )}
        {isComplete && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Complete
          </span>
        )}
        {isError && (
          <span className="text-sm text-red-600 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            Error
          </span>
        )}
      </div>

      <div className="flex items-center">
        {STAGES.map((stage, index) => {
          const isActive = currentStage === stage.id;
          const isPast = currentStage > stage.id || isComplete;
          const isFuture = currentStage < stage.id && !isComplete;

          return (
            <React.Fragment key={stage.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300
                    ${isPast
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-200"
                        : "bg-slate-200 text-slate-500"
                    }
                  `}
                >
                  {isPast ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stage.id
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${isPast ? "text-green-600" : isActive ? "text-indigo-600" : "text-slate-400"}
                  `}
                >
                  {stage.name}
                </span>
              </div>

              {index < STAGES.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={`
                      h-1 rounded-full transition-all duration-500
                      ${isPast ? "bg-green-500" : "bg-slate-200"}
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
