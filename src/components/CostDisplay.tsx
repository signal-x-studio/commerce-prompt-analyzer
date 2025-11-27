import React from 'react';
import { useCost } from '../context/CostContext';

export const CostDisplay: React.FC = () => {
  const { totalCost, totalInputTokens, totalOutputTokens } = useCost();

  if (totalCost === 0) return null;

  return (
    <div className="flex items-center space-x-4 bg-slate-800 text-slate-200 px-3 py-1.5 rounded-md text-xs font-mono border border-slate-700">
      <div className="flex flex-col items-end leading-tight">
        <span className="text-slate-400 text-[10px] uppercase tracking-wider">Session Cost</span>
        <span className="text-green-400 font-bold">${totalCost.toFixed(4)}</span>
      </div>
      <div className="h-6 w-px bg-slate-600 mx-2"></div>
      <div className="flex flex-col items-start leading-tight text-[10px] text-slate-400">
        <span>In: {(totalInputTokens / 1000).toFixed(1)}k</span>
        <span>Out: {(totalOutputTokens / 1000).toFixed(1)}k</span>
      </div>
    </div>
  );
};
