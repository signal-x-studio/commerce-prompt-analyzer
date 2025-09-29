export interface CatalogStructure {
  mainCategory: string;
  subcategories: string[];
  facets: { name: string; options: string[] }[];
}

export interface CategoryPrompts {
  subcategory: string;
  prompts: string[];
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
}

export interface TestResult {
  status: TestStatus;
  sources?: GroundingSource[];
}

export type EngineId = 'gemini_grounded' | 'competitor_ai' | 'technical_ai';

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
    systemInstruction: 'You are an AI assistant. Use Google Search to find sources that directly answer the user\'s query and list them.',
  },
  competitor_ai: {
    id: 'competitor_ai',
    name: 'Competitor Research AI',
    description: 'Focuses on finding direct competitors and review sites.',
    systemInstruction: 'You are a competitive market analyst. Use Google Search to find e-commerce websites and product review platforms that are relevant to the user\'s query. Prioritize commercial and review-oriented sources.',
  },
  technical_ai: {
    id: 'technical_ai',
    name: 'Technical Deep-Dive AI',
    description: 'Prioritizes forums, blogs, and technical documentation.',
    systemInstruction: 'You are a technical researcher. Use Google Search to find technical specifications, expert blogs, forums (like Reddit, Stack Overflow), and documentation related to the user\'s query. Prioritize informational and community-driven sources.',
  },
};
