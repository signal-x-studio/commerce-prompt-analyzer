import { CatalogStructure, GenerationResult, TestResult, Engine, UsageMetadata } from '../types';

export async function generateCatalogStructure(url: string, mock: boolean = false, trackUsage?: (usage?: UsageMetadata) => void): Promise<any> {
  const response = await fetch('/api/generate-structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, mock }),
  });
  if (!response.ok) throw new Error('Failed to generate structure');
  const data = await response.json();
  if (trackUsage) trackUsage(data.usage);
  return data;
}

export async function generateCustomerPrompts(structure: any, mock: boolean = false, trackUsage?: (usage?: UsageMetadata) => void): Promise<GenerationResult> {
  const response = await fetch('/api/generate-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structure, mock }),
  });
  if (!response.ok) throw new Error('Failed to generate prompts');
  const data = await response.json();
  if (trackUsage) trackUsage(data.usage);
  return data;
}

export async function generatePromptsFromUrl(url: string, onProgress: (step: string) => void, mock: boolean = false, trackUsage?: (usage?: UsageMetadata) => void): Promise<GenerationResult> {
  onProgress('Analyzing category structure...');
  const structure = await generateCatalogStructure(url, mock, trackUsage);
  
  onProgress('Generating customer personas & prompts...');
  const prompts = await generateCustomerPrompts(structure, mock, trackUsage);
  
  return prompts;
};

export async function testPromptAnswerability(prompt: string, userUrl: string, engine: Engine, mock: boolean = false, trackUsage?: (usage?: UsageMetadata) => void): Promise<TestResult> {
    try {
        const response = await fetch('/api/test-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, userUrl, engine, mock }),
        });

        if (!response.ok) {
             // Handle 500s or other errors gracefully
             console.error(`API Error testing prompt: ${response.statusText}`);
             return { status: 'error' };
        }

        const data = await response.json();
        if (trackUsage) trackUsage(data.usage);
        return data;

    } catch (error) {
        console.error(`Error testing prompt "${prompt}" with engine "${engine.id}":`, error);
        return { status: 'error' };
    }
};