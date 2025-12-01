import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { generateStructureRequestSchema } from "../../../lib/security/validators";
import {
  validateUrlForSSRF,
  sanitizeUrlForPrompt,
} from "../../../lib/security/ssrf-guard";
import { getGeminiKey } from "../../../lib/security/api-keys";

// Lazy initialization of AI client
let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = getGeminiKey();
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request with Zod schema
    const parseResult = generateStructureRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Invalid request",
          details: errors,
        },
        { status: 400 }
      );
    }

    const { url, mock } = parseResult.data;

    // Additional SSRF validation
    const ssrfCheck = validateUrlForSSRF(url);
    if (!ssrfCheck.valid) {
      return NextResponse.json(
        {
          error: "URL Validation Error",
          message: ssrfCheck.error,
        },
        { status: 400 }
      );
    }

    if (mock) {
      const { MOCK_STRUCTURE } = await import("../../../data/mockData");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return NextResponse.json(MOCK_STRUCTURE);
    }

    // Sanitize URL before embedding in prompt (removes query params, etc.)
    const sanitizedUrl = sanitizeUrlForPrompt(url);

    const prompt = `
      As an e-commerce expert, analyze the following category landing page URL and infer its likely catalog structure.
      Consider potential subcategories, product types, and common filtering facets (e.g., brand, size, color, material, price range).
      Return this structure as a JSON object.
      URL: ${sanitizedUrl}
    `;

    const aiClient = getAI();
    const response = await aiClient.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainCategory: {
              type: Type.STRING,
              description: "The main category derived from the URL.",
            },
            subcategories: {
              type: Type.ARRAY,
              description: "A list of likely subcategories.",
              items: { type: Type.STRING },
            },
            facets: {
              type: Type.ARRAY,
              description: "A list of common filtering facets for this category.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "The name of the facet (e.g., 'Brand', 'Color').",
                  },
                  options: {
                    type: Type.ARRAY,
                    description: "Example options for the facet.",
                    items: { type: Type.STRING },
                  },
                },
                required: ["name", "options"],
              },
            },
          },
          required: ["mainCategory", "subcategories", "facets"],
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : "{}";
    return NextResponse.json({
      ...JSON.parse(jsonText),
      usage: response.usageMetadata,
    });
  } catch (error: any) {
    console.error("Error generating catalog structure:", error);
    const message = error?.message || "Failed to analyze website structure.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
