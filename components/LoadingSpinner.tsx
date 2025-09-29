
import React from 'react';

interface LoadingSpinnerProps {
  message: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="mt-12 flex flex-col items-center justify-center text-center p-8 bg-slate-100/50 rounded-lg">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-md font-medium text-slate-600">{message}</p>
    </div>
  );
};
