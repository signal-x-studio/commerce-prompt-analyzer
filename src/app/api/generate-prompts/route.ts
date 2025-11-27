import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function POST(req: Request) {
  try {
    const { structure, mock } = await req.json();
    if (mock) {
        const { MOCK_PROMPTS } = await import('../../../data/mockData');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return NextResponse.json(MOCK_PROMPTS);
    }
    if (!structure) return NextResponse.json({ error: 'Structure is required' }, { status: 400 });

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

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
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

    const jsonText = response.text ? response.text.trim() : '{}';
    return NextResponse.json({
        ...JSON.parse(jsonText),
        usage: response.usageMetadata
    });
  } catch (error) {
    console.error("Error generating prompts:", error);
    return NextResponse.json({ error: "Failed to generate prompts." }, { status: 500 });
  }
}
