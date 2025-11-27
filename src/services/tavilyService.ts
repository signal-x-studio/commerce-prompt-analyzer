import { DiagnosisResult } from '../types';

const TAVILY_API_URL = 'https://api.tavily.com/search';

interface TavilySearchResult {
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
  answer?: string;
}

export async function searchTavily(query: string, apiKey: string): Promise<TavilyResponse> {
  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic", // 'advanced' is more expensive, basic is fine for diagnostics
      include_domains: [],
      exclude_domains: [],
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function diagnoseGap(query: string, userUrl: string, apiKey: string): Promise<DiagnosisResult> {
  try {
    const userDomain = new URL(userUrl).hostname.replace(/^www\./, '');
    const response = await searchTavily(query, apiKey);
    
    const foundIndex = response.results.findIndex(result => {
        try {
            return new URL(result.url).hostname.replace(/^www\./, '').includes(userDomain);
        } catch {
            return false;
        }
    });

    if (foundIndex === -1) {
        return {
            status: 'INVISIBLE',
            message: 'Your brand was NOT found in the top search results. This indicates a content or ranking gap.',
        };
    }

    return {
        status: 'FILTERED',
        message: `Your brand was found at position #${foundIndex + 1} in raw search results, but the AI did not select it. This suggests an Authority, Trust, or Sentiment issue.`,
        searchRank: foundIndex + 1,
        foundUrl: response.results[foundIndex].url
    };

  } catch (error) {
    console.error('Error in diagnoseGap:', error);
    return {
        status: 'ERROR',
        message: 'Failed to run diagnosis. Please check your API key or try again later.'
    };
  }
}
