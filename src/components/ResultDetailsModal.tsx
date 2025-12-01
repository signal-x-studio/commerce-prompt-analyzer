import React from "react";
import { EngineId, ENGINES, TestResult } from "../types";
import { SourceList } from "./SourceList";

interface ResultDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  engineId: EngineId;
  result: TestResult;
  userUrl: string;
}

export const ResultDetailsModal: React.FC<ResultDetailsModalProps> = ({
  isOpen,
  onClose,
  prompt,
  engineId,
  result,
  userUrl,
}) => {
  if (!isOpen) return null;

  const engine = ENGINES[engineId];

  if (!engine || !result) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3
                  className="text-lg leading-6 font-medium text-slate-900"
                  id="modal-title"
                >
                  Analysis Details
                </h3>

                <div className="mt-4 space-y-6">
                  {/* Prompt Section */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Prompt
                    </h4>
                    <p className="mt-1 text-sm text-slate-800 bg-slate-50 p-3 rounded border border-slate-200">
                      {prompt}
                    </p>
                  </div>

                  {/* Engine & Status Section */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                        Engine
                      </h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        {engine.name}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                        Rank
                      </h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          result.rank
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {result.rank ? `#${result.rank}` : "Not Ranked"}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                        Sentiment
                      </h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 capitalize ${
                          result.sentiment === "positive"
                            ? "bg-green-100 text-green-800"
                            : result.sentiment === "negative"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {result.sentiment || "Neutral"}
                      </span>
                    </div>
                  </div>

                  {/* Answer Section */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Full AI Response
                    </h4>
                    <div className="mt-1 text-sm text-slate-700 bg-slate-50 p-4 rounded border border-slate-200 max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {result.answerText || "No answer text available."}
                    </div>
                  </div>

                  {/* Sources Section */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Citations & Sources
                    </h4>
                    <SourceList
                      sources={result.sources || []}
                      userUrl={userUrl}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
