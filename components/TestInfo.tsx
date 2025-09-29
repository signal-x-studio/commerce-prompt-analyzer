
import React from 'react';

export const TestInfo: React.FC = () => {
    return (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-lg mt-4 text-sm">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="font-bold">How the Answerability Test Works (Technical Details)</h3>
                    <div className="mt-1 space-y-1">
                        <p>This is a direct simulation of a third-party answer engine, not an extrapolation from a standard search.</p>
                        <p>Each prompt is sent to the Gemini AI with a specific instruction: to use Google Search as a <strong className="font-semibold">"tool"</strong> to find real-time information. This process is called <strong className="font-semibold">grounding</strong>.</p>
                        <p>The AI then analyzes the web results and provides its answer along with the <strong className="font-semibold">exact sources (citations)</strong> it used. We programmatically check those citations to see if your domain is listed. This directly measures if the AI considers your site an authoritative source for that query.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};