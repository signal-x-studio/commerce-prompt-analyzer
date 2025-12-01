import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { testPromptWithOpenAI } from "../../../services/openAIService";
import {
  testPromptRequestSchema,
  ValidationError,
} from "../../../lib/security/validators";
import { validateUrlForSSRF } from "../../../lib/security/ssrf-guard";
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

// Helper function for exponential backoff
async function generateWithRetry(
  model: any,
  params: any,
  retries = 3,
  delay = 2000
) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(params);
    } catch (error: any) {
      if (
        error?.status === 429 ||
        error?.response?.status === 429 ||
        error?.message?.includes("429")
      ) {
        if (i === retries - 1) throw error; // Throw on last attempt
        console.warn(
          `Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Throw other errors immediately
      }
    }
  }
}

export async function POST(request: Request) {
  let prompt = "";
  try {
    // Parse and validate request body
    const body = await request.json();

    // Validate with Zod schema
    const parseResult = testPromptRequestSchema.safeParse(body);
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

    const { prompt: validatedPrompt, userUrl, engine, mock } = parseResult.data;
    prompt = validatedPrompt;

    // Additional SSRF validation for userUrl
    const ssrfCheck = validateUrlForSSRF(userUrl);
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
      if (engine.id === "gpt4o") {
        const result = await testPromptWithOpenAI(prompt, userUrl, engine, true);
        return NextResponse.json(result);
      }
      // Existing Gemini mock logic
      const { MOCK_TEST_RESULT } = await import("../../../data/mockData");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Randomize rank slightly for realism
      const rank = Math.random() > 0.5 ? 3 : 1;
      return NextResponse.json({ ...MOCK_TEST_RESULT, rank });
    }

    if (engine.id === "gpt4o") {
      const result = await testPromptWithOpenAI(prompt, userUrl, engine, false);
      return NextResponse.json(result);
    }

    // Existing Gemini Logic
    const aiClient = getAI();
    const fullPrompt = `${engine.systemInstruction}\n\nUser Query: "${prompt}"`;

    // 1. Generate Answer with Grounding (with Retry)
    const response = await generateWithRetry(aiClient.models, {
      model: "gemini-2.0-flash",
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const answerText = response.text ? response.text : "";
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (!groundingChunks || groundingChunks.length === 0) {
      return NextResponse.json({
        status: "not-found",
        sources: [],
        sentiment: "neutral",
        rank: null,
        usage: response.usageMetadata,
      });
    }

    const getRealDomain = (uri: string): string | null => {
      try {
        const url = new URL(uri);
        let hostname = url.hostname;

        // Handle Google/Vertex redirects
        if (
          hostname.includes("google") ||
          hostname.includes("vertexaisearch")
        ) {
          const redirectUrl =
            url.searchParams.get("url") || url.searchParams.get("q");
          if (redirectUrl) {
            try {
              return new URL(redirectUrl).hostname.replace(/^www\./, "");
            } catch {
              // If redirect URL is invalid, fall through to return null for internal domains
            }
          }
        }

        // Filter out internal/useless domains
        if (
          hostname.endsWith("google.com") ||
          hostname.endsWith("vertexaisearch.cloud.google.com") ||
          hostname === "localhost"
        ) {
          return null;
        }

        return hostname.replace(/^www\./, "");
      } catch {
        return null;
      }
    };

    const userDomain = new URL(userUrl).hostname.replace(/^www\./, "");

    // 2. Process Sources & Rank
    const sources = groundingChunks
      .map((chunk: any, index: number) => {
        const uri = chunk.web?.uri || "";
        const title = chunk.web?.title || "Untitled";
        const domain = getRealDomain(uri);

        return {
          uri,
          title,
          domain,
          rank: index + 1,
        };
      })
      .filter((source: any) => source.uri && source.domain);

    // Find User Rank
    const userSource = sources.find(
      (source: any) => source.domain === userDomain
    );

    const found = !!userSource;
    const rank = userSource ? userSource.rank : null;

    // 3. Sentiment Analysis
    let sentiment = "neutral";
    if (found && answerText) {
      try {
        const sentimentPrompt = `
                Analyze the sentiment of the following text specifically regarding the brand/domain "${userDomain}".
                Text: "${answerText}"
                Return ONLY one word: "positive", "negative", or "neutral".
            `;
        const sentimentResponse = await aiClient.models.generateContent({
          model: "gemini-2.0-flash",
          contents: sentimentPrompt,
        });
        const sentimentText = sentimentResponse.text
          ? sentimentResponse.text.trim().toLowerCase()
          : "";
        if (["positive", "negative", "neutral"].includes(sentimentText)) {
          sentiment = sentimentText;
        }
      } catch (e) {
        console.error("Error analyzing sentiment:", e);
      }
    }

    return NextResponse.json({
      status: found ? "found" : "not-found",
      rank,
      sentiment,
      answerText,
      sources,
    });
  } catch (error: any) {
    console.error(`Error testing prompt "${prompt}":`, error);

    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    const status =
      error?.status === 429 ||
      error?.response?.status === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("RESOURCE_EXHAUSTED")
        ? 429
        : 500;

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status }
    );
  }
}
