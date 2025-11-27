export interface CatalogStructure {
  mainCategory: string;
  subcategories: string[];
  facets: { name: string; options: string[] }[];
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface CategoryPrompts {
  subcategory: string;
  prompts: string[];
  usage?: UsageMetadata;
}

export interface GenerationResult {
  promptsByCategory: CategoryPrompts[];
  thinking: string;
  sources: string;
}

// Types for Answerability Testing
export type TestStatus = 'untested' | 'testing' | 'found' | 'not-found' | 'error';

export interface GroundingSource {
  uri: string;
  title: string;
  rank?: number;
}

export interface TestResult {
  status: TestStatus;
  sources?: GroundingSource[];
  rank?: number | null;
  sentiment?: 'positive' | 'negative' | 'neutral';
  answerText?: string;
}

export type EngineId = 'gemini_grounded' | 'competitor_ai' | 'gpt4o' | 'technical_ai';

export interface Engine {
  id: EngineId;
  name: string;
  description: string;
  systemInstruction: string;
}

export const ENGINES: Record<EngineId, Engine> = {
  gemini_grounded: {
    id: 'gemini_grounded',
    name: 'Gemini Grounded Search',
    description: 'Standard, balanced search grounding.',
    systemInstruction: 'You are a helpful assistant. Use Google Search to find the answer.',
  },
  competitor_ai: {
    id: 'competitor_ai',
    name: 'Competitor Research AI',
    description: 'Focuses on finding direct competitors and review sites.',
    systemInstruction: 'You are a market researcher. Identify top competitors and review sites.',
  },
  gpt4o: {
    id: 'gpt4o',
    name: 'OpenAI GPT-4o',
    description: 'General purpose reasoning model (no live search).',
    systemInstruction: 'You are a helpful assistant.',
  },
  technical_ai: {
    id: 'technical_ai',
    name: 'Technical Deep-Dive AI',
    description: 'Prioritizes forums, blogs, and technical documentation.',
    systemInstruction: 'You are a technical researcher. Use Google Search to find technical specifications, expert blogs, forums (like Reddit, Stack Overflow), and documentation related to the user\'s query. Prioritize informational and community-driven sources.',
  },
};

export interface DiagnosisResult {
  status: 'INVISIBLE' | 'FILTERED' | 'FOUND_IN_SEARCH' | 'ERROR';
  message: string;
  searchRank?: number;
  foundUrl?: string;
}
