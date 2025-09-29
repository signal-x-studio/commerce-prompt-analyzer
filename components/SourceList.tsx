import React from 'react';
import { GroundingSource } from '../types';

interface SourceListProps {
  sources: GroundingSource[];
  userUrl: string;
}

const getDomain = (uri: string): string | null => {
  try {
    const url = new URL(uri);
    // Check for Google's grounding and search redirect URLs
    if (url.hostname === 'vertexaisearch.cloud.google.com' || url.hostname === 'www.google.com') {
      const redirectUrl = url.searchParams.get('url') || url.searchParams.get('q');
      if (redirectUrl) {
        // If a redirect URL is found in query params, parse its domain instead
        return new URL(redirectUrl).hostname.replace(/^www\./, '');
      }
    }
    // Otherwise, use the original URL's domain
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

export const SourceList: React.FC<SourceListProps> = ({ sources, userUrl }) => {
  const userDomain = getDomain(userUrl);

  if (sources.length === 0) {
    return (
      <div className="p-4 text-sm text-center text-slate-500 bg-slate-50 border-t border-slate-200">
        The AI did not cite any web sources for this prompt.
      </div>
    );
  }

  return (
    <div className="bg-slate-100/70 border-t border-slate-200 max-h-48 overflow-y-auto">
      <ul className="p-2 space-y-1">
        {sources.map((source, index) => {
          const sourceDomain = getDomain(source.uri);
          const isMatch = userDomain && sourceDomain === userDomain;
          return (
            <li 
              key={index} 
              className={`p-2 rounded-md transition-colors ${isMatch ? 'bg-green-100 border border-green-300' : 'bg-white'}`}
            >
              <a 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group block text-xs"
              >
                <p className={`font-semibold truncate group-hover:underline ${isMatch ? 'text-green-800' : 'text-slate-800'}`}>
                  {isMatch && <span className="font-bold text-green-600">[MATCH] </span>}
                  {source.title || 'Untitled Source'}
                </p>
                <p className={`text-slate-500 truncate ${isMatch ? 'text-green-700/80' : 'text-slate-500'}`}>
                  {source.uri}
                </p>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};