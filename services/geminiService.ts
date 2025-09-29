import { GoogleGenAI, Type } from "@google/genai";
import { CatalogStructure, GenerationResult, TestResult, GroundingSource, Engine } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateCatalogStructure = async (url: string): Promise<CatalogStructure> => {
  const prompt = `
    As an e-commerce expert, analyze the following category landing page URL and infer its likely catalog structure.
    Consider potential subcategories, product types, and common filtering facets (e.g., brand, size, color, material, price range).
    Return this structure as a JSON object.
    URL: ${url}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as CatalogStructure;
  } catch (error) {
    console.error("Error generating catalog structure:", error);
    throw new Error("Failed to analyze the website structure with Gemini.");
  }
};

const generateCustomerPrompts = async (structure: CatalogStructure): Promise<GenerationResult> => {
  const prompt = `
    You are a digital marketing strategist and consumer trend analyst with deep expertise in conversational AI and e-commerce search patterns.
    Your task is to generate sophisticated, conversational search prompts for the given e-commerce catalog structure.
    These prompts must reflect what real customers would type into advanced answer engines like Google Gemini or ChatGPT.

    **Quality Mandate: AVOID BASIC KEYWORD SEARCHES.**
    The goal is to move far beyond simple phrases like "women's shoes" or "red running sneakers". Every prompt must represent a genuine, complex human query that seeks a nuanced answer, recommendation, or comparison. Think in terms of full sentences and questions. If a prompt could be answered by a simple product grid filter, it is not sophisticated enough.

    To do this, synthesize your knowledge of public search analytics, "People Also Ask" data, and common consumer pain points for this product category.

    Generate a diverse list of 15-20 prompts, ensuring a mix of the following user intents:
    1.  **Problem/Solution-Based:** "My current hiking boots give me blisters. What are the best lightweight, breathable options for long day hikes?"
    2.  **Comparative Analysis:** "Compare durability and price for leather vs. synthetic material messenger bags for daily commuting."
    3.  **Lifestyle/Scenario-Driven:** "I'm looking for a classy, minimalist watch under $500 that I can wear to the office and on weekends."
    4.  **Feature-Specific Inquiry:** "Show me 4K TVs that have at least three HDMI 2.1 ports and support for Dolby Vision."
    5.  **Trend-Aware Discovery:** "What are the most popular styles of sustainable sneakers for 2024?"
    6.  **High-Intent/Transactional:** "Where can I find the best deals on a new Sony a7 IV camera body online?"

    Group the final prompts by the subcategory they most closely relate to.
    
    Finally, provide a 'thinking' process that explains your reasoning and a 'sources' section that describes the types of data you conceptually drew upon.

    Return the result as a single JSON object with three keys: 'promptsByCategory', 'thinking', and 'sources'.

    Catalog Structure:
    ${JSON.stringify(structure, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            promptsByCategory: {
              type: Type.ARRAY,
              description: "The list of prompts, grouped by subcategory.",
              items: {
                type: Type.OBJECT,
                properties: {
                  subcategory: {
                    type: Type.STRING,
                    description: "The subcategory the prompts belong to."
                  },
                  prompts: {
                    type: Type.ARRAY,
                    description: "A list of customer search prompts.",
                    items: { type: Type.STRING }
                  }
                },
                required: ["subcategory", "prompts"]
              }
            },
            thinking: {
              type: Type.STRING,
              description: "A step-by-step explanation of the reasoning used to generate the prompts, including how different user intents were addressed."
            },
            sources: {
              type: Type.STRING,
              description: "A summary of the types of public analytics, trend data, or consumer insights that informed the prompt generation."
            }
          },
          required: ["promptsByCategory", "thinking", "sources"]
        }
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as GenerationResult;
  } catch (error) {
    console.error("Error generating customer prompts:", error);
    throw new Error("Failed to generate customer prompts with Gemini.");
  }
};


export const generatePromptsFromUrl = async (url: string, onStepChange: (step: string) => void): Promise<GenerationResult> => {
  onStepChange('Step 1/2: Analyzing category structure...');
  const catalogStructure = await generateCatalogStructure(url);

  onStepChange('Step 2/2: Generating advanced customer prompts...');
  const prompts = await generateCustomerPrompts(catalogStructure);

  return prompts;
};

const getRealDomain = (uri: string): string | null => {
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

export const testPromptAnswerability = async (prompt: string, userUrl: string, engine: Engine): Promise<TestResult> => {
    try {
        const userDomain = new URL(userUrl).hostname.replace(/^www\./, '');
        
        const fullPrompt = `${engine.systemInstruction}\n\nUser Query: "${prompt}"`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (!groundingChunks || groundingChunks.length === 0) {
            return { status: 'not-found', sources: [] };
        }

        const sources: GroundingSource[] = groundingChunks.map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Untitled',
        })).filter(source => source.uri);

        const found = sources.some(source => {
            const sourceDomain = getRealDomain(source.uri);
            return sourceDomain === userDomain;
        });

        return {
            status: found ? 'found' : 'not-found',
            sources,
        };

    } catch (error) {
        console.error(`Error testing prompt "${prompt}" with engine "${engine.id}":`, error);
        return { status: 'error' };
    }
};