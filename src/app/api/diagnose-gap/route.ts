import { NextResponse } from 'next/server';
import { diagnoseGap } from '../../../services/tavilyService';

export async function POST(request: Request) {
  try {
    const { query, userUrl } = await request.json();

    if (!query || !userUrl) {
      return NextResponse.json({ error: 'Missing query or userUrl' }, { status: 400 });
    }

    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
       // Graceful fallback if no key is configured
       return NextResponse.json({ 
           status: 'ERROR', 
           message: 'Tavily API Key is missing. Please add TAVILY_API_KEY to your .env file.' 
       });
    }

    const result = await diagnoseGap(query, userUrl, apiKey);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in /api/diagnose-gap:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
