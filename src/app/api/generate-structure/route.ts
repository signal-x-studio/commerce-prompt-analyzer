import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function POST(req: Request) {
  try {
    const { url, mock } = await req.json();
    if (mock) {
        // Dynamic import to avoid loading mock data in production if not needed, 
        // though for this size it doesn't matter much.
        const { MOCK_STRUCTURE } = await import('../../../data/mockData');
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        return NextResponse.json(MOCK_STRUCTURE);
    }
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const prompt = `
      As an e-commerce expert, analyze the following category landing page URL and infer its likely catalog structure.
      Consider potential subcategories, product types, and common filtering facets (e.g., brand, size, color, material, price range).
      Return this structure as a JSON object.
      URL: ${url}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainCategory: { type: Type.STRING, description: "The main category derived from the URL." },
            subcategories: {
              type: Type.ARRAY,
              description: "A list of likely subcategories.",
              items: { type: Type.STRING }
            },
            facets: {
              type: Type.ARRAY,
              description: "A list of common filtering facets for this category.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "The name of the facet (e.g., 'Brand', 'Color')." },
                  options: {
                    type: Type.ARRAY,
                    description: "Example options for the facet.",
                    items: { type: Type.STRING }
                  }
                },
                required: ["name", "options"]
              }
            }
          },
          required: ["mainCategory", "subcategories", "facets"]
        }
      }
    });

    const jsonText = response.text ? response.text.trim() : '{}';
    return NextResponse.json({
        ...JSON.parse(jsonText),
        usage: response.usageMetadata
    });
  } catch (error) {
    console.error("Error generating catalog structure:", error);
    return NextResponse.json({ error: "Failed to analyze website structure." }, { status: 500 });
  }
}
