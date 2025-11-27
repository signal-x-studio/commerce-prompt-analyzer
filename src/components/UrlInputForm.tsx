
import React from 'react';

interface UrlInputFormProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export const UrlInputForm: React.FC<UrlInputFormProps> = ({ url, setUrl, onSubmit, isLoading }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-grow w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute top-1/2 left-4 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://example.com/category/womens-shoes"
                className="w-full h-12 pl-12 pr-4 text-slate-900 placeholder-slate-400 bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                disabled={isLoading}
                required
            />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto h-12 px-8 flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Generate Prompts'}
        </button>
      </form>
    </div>
  );
};
