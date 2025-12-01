import React from 'react';
import Link from 'next/link';
import { CostDisplay } from './CostDisplay';

const Logo: React.FC = () => (
  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg transform -rotate-12">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 6.75l4.5 4.5m0-4.5l-4.5 4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12.75l4.5 4.5m0-4.5l-4.5 4.5" />
    </svg>
  </div>
);


export const Header: React.FC = () => {
  return (
    <header className="text-center relative">
      <div className="absolute top-0 right-0 flex items-center gap-4">
        <Link
          href="/brand-check"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Brand Check
        </Link>
        <Link
          href="/council"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <svg
            className="w-4 h-4"
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
          LLM Council
        </Link>
        <CostDisplay />
      </div>
      <div className="flex justify-center mb-4">
        <Logo />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        E-commerce Prompt Generator
      </h1>
      <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
        Discover how customers search in the age of AI. Test your website's visibility across different AI-powered search personas to improve your Answer Engine Optimization (AEO).
      </p>
    </header>
  );
};
