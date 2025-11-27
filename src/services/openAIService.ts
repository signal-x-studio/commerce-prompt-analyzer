import OpenAI from 'openai';
import { TestResult, Engine, UsageMetadata } from '../types';

export async function testPromptWithOpenAI(
  prompt: string, 
  userUrl: string, 
  engine: Engine, 
  mock: boolean = false
): Promise<TestResult & { usage?: UsageMetadata }> {
  
  if (mock) {
    // Return mock data if requested
    return {
      status: 'found',
      rank: 1,
      sentiment: 'positive',
      answerText: "This is a mock response from OpenAI (GPT-4o). It simulates a positive recommendation.",
      sources: [],
      usage: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150
      }
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
      console.error("Missing OPENAI_API_KEY");
      return { status: 'error', answerText: "Error: OPENAI_API_KEY is not set in environment variables." };
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    const systemPrompt = `You are a helpful assistant. The user is asking: "${prompt}". 
    Please answer the question naturally. 
    After answering, determine if the website "${userUrl}" is mentioned or recommended in your response.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
      model: 'gpt-4o',
    });

    const answer = completion.choices[0].message.content || '';
    const usage = completion.usage;

    // Simple heuristic to check if URL is mentioned
    // In a real implementation, we might ask the model to output JSON with this info
    const isMentioned = answer.toLowerCase().includes(userUrl.toLowerCase());
    
    // Determine sentiment (mock logic for now, or use another LLM call)
    const sentiment = isMentioned ? 'positive' : 'neutral';

    return {
      status: isMentioned ? 'found' : 'not-found',
      rank: isMentioned ? 1 : undefined, // Hard to determine rank in a single chat response
      sentiment: sentiment,
      answerText: answer,
      sources: [], // OpenAI chat doesn't return sources like Gemini Grounding
      usage: {
        promptTokenCount: usage?.prompt_tokens || 0,
        candidatesTokenCount: usage?.completion_tokens || 0,
        totalTokenCount: usage?.total_tokens || 0
      }
    };

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return { status: 'error' };
  }
}
