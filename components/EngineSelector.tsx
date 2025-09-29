import React from 'react';
import { ENGINES, Engine, EngineId } from '../types';

interface EngineSelectorProps {
  selectedEngines: Set<EngineId>;
  onEngineChange: (engineId: EngineId) => void;
  disabled: boolean;
}

const EngineCard: React.FC<{ engine: Engine; isSelected: boolean; onChange: () => void; disabled: boolean; }> = ({ engine, isSelected, onChange, disabled }) => (
  <label
    className={`
      flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200
      ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-white border-slate-300 hover:border-slate-400'}
      ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}
    `}
  >
    <input
      type="checkbox"
      checked={isSelected}
      onChange={onChange}
      disabled={disabled}
      className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
    />
    <div className="ml-3 text-sm">
      <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-800'} ${disabled ? 'text-slate-500' : ''}`}>
        {engine.name}
      </span>
      <p className={` ${isSelected ? 'text-indigo-700' : 'text-slate-500'} ${disabled ? 'text-slate-400' : ''}`}>
        {engine.description}
      </p>
    </div>
  </label>
);


export const EngineSelector: React.FC<EngineSelectorProps> = ({ selectedEngines, onEngineChange, disabled }) => {
  return (
    <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Select Test Engines</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(ENGINES).map(engine => (
                <EngineCard
                    key={engine.id}
                    engine={engine}
                    isSelected={selectedEngines.has(engine.id)}
                    onChange={() => onEngineChange(engine.id)}
                    disabled={disabled}
                />
            ))}
        </div>
    </div>
  );
};
