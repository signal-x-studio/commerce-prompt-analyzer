import React from 'react';

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
    <header className="text-center">
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
