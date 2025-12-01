'use client';

import React, { useState } from 'react';
import { useCost } from '../context/CostContext';

export const CostDisplay: React.FC = () => {
  const {
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    budgetLimit,
    budgetStatus,
    budgetRemaining,
    budgetPercentUsed,
    setBudgetLimit,
    resetCost,
  } = useCost();

  const [showSettings, setShowSettings] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetLimit.toString());

  const statusColors = {
    ok: 'text-green-400',
    warning: 'text-amber-400',
    exceeded: 'text-red-400',
  };

  const statusBgColors = {
    ok: 'bg-green-500',
    warning: 'bg-amber-500',
    exceeded: 'bg-red-500',
  };

  return (
    <div className="relative">
      {/* Main Display */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center space-x-3 bg-slate-800 text-slate-200 px-3 py-2 rounded-lg text-xs font-mono border border-slate-700 hover:border-slate-600 transition-colors"
      >
        {/* Budget Progress */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Budget</span>
            {budgetStatus === 'warning' && (
              <span className="text-amber-400 text-[10px] animate-pulse">⚠️ 80%+</span>
            )}
            {budgetStatus === 'exceeded' && (
              <span className="text-red-400 text-[10px] animate-pulse">🛑 Exceeded</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${statusColors[budgetStatus]}`}>
              ${totalCost.toFixed(4)}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">${budgetLimit.toFixed(2)}</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${statusBgColors[budgetStatus]}`}
              style={{ width: `${Math.min(100, budgetPercentUsed)}%` }}
            />
          </div>
        </div>

        <div className="h-8 w-px bg-slate-600"></div>

        {/* Token counts */}
        <div className="flex flex-col items-start leading-tight text-[10px] text-slate-400">
          <span>In: {(totalInputTokens / 1000).toFixed(1)}k</span>
          <span>Out: {(totalOutputTokens / 1000).toFixed(1)}k</span>
        </div>

        {/* Settings icon */}
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Budget Settings</h3>

          {/* Budget Limit Input */}
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1">Session Budget Limit</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.10"
                  min="0.01"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  const value = parseFloat(tempBudget);
                  if (!isNaN(value) && value > 0) {
                    setBudgetLimit(value);
                  }
                }}
                className="px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
              >
                Set
              </button>
            </div>
          </div>

          {/* Quick Budget Presets */}
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-2">Quick Presets</label>
            <div className="flex gap-2">
              {[0.25, 0.50, 1.00, 5.00].map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setBudgetLimit(amount);
                    setTempBudget(amount.toString());
                  }}
                  className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                    budgetLimit === amount
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  ${amount.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Status */}
          <div className="mb-4 p-3 bg-slate-700/50 rounded">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Used</span>
              <span className={statusColors[budgetStatus]}>${totalCost.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Remaining</span>
              <span className="text-slate-300">${budgetRemaining.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Progress</span>
              <span className={statusColors[budgetStatus]}>{budgetPercentUsed.toFixed(1)}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetCost();
                setShowSettings(false);
              }}
              className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600 transition-colors"
            >
              Reset Session
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-3 py-2 text-slate-400 text-sm hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
