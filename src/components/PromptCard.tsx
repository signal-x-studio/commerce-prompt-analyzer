import React, { useState } from "react";
import { DiagnosisResult, EngineId, ENGINES, TestResult } from "../types";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/Card";

interface PromptCardProps {
  prompt: string;
  promptTestResults?: Partial<Record<EngineId, TestResult>>;
  userUrl: string;
  testedEngineIds: EngineId[];
  onRunSingleTest: (prompt: string) => void;
  isTestingThisCard: boolean;
  isGlobalTesting: boolean;
  onViewDetails: (engineId: EngineId, result: TestResult) => void;
}

const getStatusIcon = (status: TestResult["status"]) => {
  switch (status) {
    case "testing":
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100">
          <svg
            className="animate-spin h-4 w-4 text-slate-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      );
    case "found":
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-green-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    case "not-found":
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      );
    default:
      return <div className="w-6 h-6" />;
  }
};

const EngineResultRow: React.FC<{
  engineId: EngineId;
  result?: TestResult;
  userUrl: string;
  onViewDetails: () => void;
  onDiagnose: () => void;
  isDiagnosing: boolean;
  diagnosisResult?: DiagnosisResult | null;
}> = ({
  engineId,
  result,
  userUrl,
  onViewDetails,
  onDiagnose,
  isDiagnosing,
  diagnosisResult,
}) => {
  const engine = ENGINES[engineId];
  const status = result?.status || "untested";

  if (status === "untested") return null;

  const hasSources = result?.sources && result.sources.length > 0;
  const hasAnswer = !!result?.answerText;
  const isClickable =
    (hasSources || hasAnswer) && (status === "found" || status === "not-found");

  const getSentimentColor = (s?: string) => {
    if (s === "positive") return "text-green-700 bg-green-50 border-green-200";
    if (s === "negative") return "text-red-700 bg-red-50 border-red-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  return (
    <div className="mb-3 last:mb-0">
      <div
        onClick={isClickable ? onViewDetails : undefined}
        className={`
                    flex items-center p-3 rounded-lg border border-slate-100 bg-white shadow-sm transition-all
                    ${
                      isClickable
                        ? "hover:border-indigo-200 hover:shadow-md cursor-pointer"
                        : ""
                    }
                `}
      >
        <div className="mr-3 shrink-0">{getStatusIcon(status)}</div>

        <div className="grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-700 text-sm truncate">
              {engine.name}
            </span>
            {status === "found" && result?.rank && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                #{result.rank}
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {status === "error" && result?.error && (
              <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {result.error}
              </span>
            )}

            {result?.sentiment && (
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded border uppercase tracking-wide ${getSentimentColor(
                  result.sentiment
                )}`}
              >
                {result.sentiment}
              </span>
            )}

            {status === "not-found" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDiagnose();
                }}
                disabled={isDiagnosing}
                className="text-[10px] font-medium text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
              >
                {isDiagnosing ? "Diagnosing..." : "Diagnose Gap"}
              </button>
            )}
          </div>
        </div>

        {isClickable && (
          <div className="ml-2 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        )}
      </div>

      {diagnosisResult && (
        <div
          className={`mt-2 ml-4 p-3 rounded-md text-xs border-l-4 shadow-sm ${
            diagnosisResult.status === "INVISIBLE"
              ? "bg-red-50 border-red-400 text-red-800"
              : diagnosisResult.status === "FILTERED"
              ? "bg-amber-50 border-amber-400 text-amber-800"
              : "bg-slate-50 border-slate-400 text-slate-800"
          }`}
        >
          <strong className="block mb-1 font-semibold">
            Diagnosis Result:
          </strong>
          {diagnosisResult.message}
        </div>
      )}
    </div>
  );
};

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  promptTestResults,
  userUrl,
  testedEngineIds,
  onRunSingleTest,
  isTestingThisCard,
  isGlobalTesting,
  onViewDetails,
}) => {
  const [copied, setCopied] = useState(false);
  const [diagnosingEngines, setDiagnosingEngines] = useState<Set<EngineId>>(
    new Set()
  );
  const [diagnosisResults, setDiagnosisResults] = useState<
    Partial<Record<EngineId, DiagnosisResult | null>>
  >({});

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDiagnose = async (engineId: EngineId) => {
    setDiagnosingEngines((prev) => new Set(prev).add(engineId));
    try {
      const response = await fetch("/api/diagnose-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt, userUrl }),
      });
      const result = await response.json();
      setDiagnosisResults((prev) => ({ ...prev, [engineId]: result }));
    } catch (error) {
      console.error("Diagnosis failed", error);
      setDiagnosisResults((prev) => ({
        ...prev,
        [engineId]: { status: "ERROR", message: "Diagnosis failed." },
      }));
    } finally {
      setDiagnosingEngines((prev) => {
        const next = new Set(prev);
        next.delete(engineId);
        return next;
      });
    }
  };

  const hasResults =
    promptTestResults && Object.keys(promptTestResults).length > 0;

  return (
    <Card className="h-full flex flex-col hover:border-indigo-300 transition-colors duration-300">
      <CardHeader className="relative pb-2">
        <div className="pr-8">
          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {prompt}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
          aria-label="Copy prompt"
        >
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </CardHeader>

      <CardContent className="grow bg-slate-50/50 pt-4">
        {hasResults ? (
          <div className="space-y-2">
            {testedEngineIds.map((engineId) => (
              <EngineResultRow
                key={engineId}
                engineId={engineId}
                result={promptTestResults?.[engineId]}
                userUrl={userUrl}
                onViewDetails={() => {
                  const result = promptTestResults?.[engineId];
                  if (result) onViewDetails(engineId, result);
                }}
                onDiagnose={() => handleDiagnose(engineId)}
                isDiagnosing={diagnosingEngines.has(engineId)}
                diagnosisResult={diagnosisResults[engineId]}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center min-h-[100px] text-slate-400 text-sm italic">
            Ready to test
          </div>
        )}
      </CardContent>

      {!hasResults && (
        <CardFooter className="bg-white border-t-0 pt-0 pb-4 px-6">
          <button
            onClick={() => onRunSingleTest(prompt)}
            disabled={isTestingThisCard || isGlobalTesting}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-wait transition-all shadow-sm hover:shadow"
          >
            {isTestingThisCard ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Testing...
              </>
            ) : (
              <>Test This Prompt</>
            )}
          </button>
        </CardFooter>
      )}
    </Card>
  );
};
