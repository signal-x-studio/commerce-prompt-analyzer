# LLM Brand Visibility Analyzer

Measure how AI-powered platforms mention, recommend, and cite your brand in generated responses. Test across ChatGPT, Claude, Gemini, Perplexity, and Meta AI to understand your brand's visibility in the age of conversational AI.

## Why This Matters

As consumers increasingly use AI assistants to research purchases, traditional SEO metrics don't capture the full picture. This tool answers:

- When someone asks AI "What's the best [product]?", does your brand appear?
- Which AI platforms mention your brand most frequently?
- What sentiment surrounds your brand in AI responses?
- How do you compare to competitors in AI recommendations?

## Features

- **Multi-Platform Testing** - Test across 10 AI models (Gemini, GPT-4o, Claude, Perplexity, Llama)
- **Grounded Detection** - URL citation matching for search platforms
- **Text-Match Detection** - Brand mention detection for chat platforms
- **Sentiment Analysis** - Positive/neutral/negative classification
- **Competitor Tracking** - See which competitors appear alongside your brand
- **Budget Controls** - Set spending limits with real-time cost tracking
- **Parallel Execution** - 6-10x faster with concurrent API calls
- **Mock Mode** - Test workflows without API costs

## Quick Start

### Prerequisites

- Node.js 18+
- API keys for at least one provider (see [Environment Variables](#environment-variables))

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Required: At least one API key
GEMINI_API_KEY=your_gemini_key

# Optional: Additional providers
OPENROUTER_API_KEY=your_openrouter_key
OPENAI_API_KEY=your_openai_key

# Optional: Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000/visibility](http://localhost:3000/visibility)

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── generate-structure/ # Brand info extraction
│   │   └── test-prompt/        # Visibility testing endpoint
│   ├── docs/                   # In-app documentation
│   └── visibility/             # Main application UI
├── components/
│   ├── visibility/             # Visibility-specific components
│   └── ui/                     # Shared UI components
├── context/
│   └── CostContext.tsx         # Budget & cost tracking
├── hooks/                      # Custom React hooks
├── services/
│   ├── geminiService.ts        # Google Gemini API
│   ├── openAIService.ts        # OpenAI API
│   ├── openRouterService.ts    # OpenRouter (multi-model)
│   ├── queryDiscoveryService.ts# Query generation
│   └── visibilityService.ts    # Brand detection logic
├── lib/                        # Utilities
└── types.ts                    # TypeScript definitions
```

## Architecture

### Detection Methods

**Grounded Detection** (Search Platforms)
- Used for: Gemini, Perplexity
- Extracts URLs from citation metadata
- Matches your domain against cited sources
- Provides rank position in citations

**Text-Match Detection** (Chat Platforms)
- Used for: ChatGPT, Claude, Meta AI
- Searches response text for brand mentions
- Checks multiple name variations
- Extracts surrounding context for sentiment

### Supported Models

| Platform | Models | Detection |
|----------|--------|-----------|
| Google Gemini | Flash, Pro | Grounded |
| Perplexity | Sonar, Sonar Pro | Grounded |
| OpenAI | GPT-4o Mini, GPT-4o | Text-Match |
| Anthropic | Claude Haiku, Sonnet | Text-Match |
| Meta | Llama 3.1 70B | Text-Match |

### Metrics Calculated

- **Citation Rate**: % of models that mentioned your brand
- **Sentiment**: Positive/neutral/negative based on keyword analysis
- **Confidence Score**: 0-100% based on match quality
- **Rank Position**: Position in citation/recommendation lists

## API Routes

### POST `/api/test-prompt`

Test brand visibility across AI platforms.

```typescript
{
  prompt: string;           // The query to test
  siteUrl: string;          // Your brand's URL
  brandName?: string;       // Optional brand name
  selectedModels: string[]; // Model IDs to test
  mockMode?: boolean;       // Skip real API calls
}
```

### POST `/api/generate-structure`

Extract brand information from a URL.

```typescript
{
  url: string;  // Website URL to analyze
}
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI Providers**: Google Gemini, OpenAI, OpenRouter
- **Rate Limiting**: Upstash Redis (optional)
- **Validation**: Zod

## Documentation

In-app documentation is available at `/docs` when running the application. It covers:

- Core concepts (LLM visibility vs traditional SEO)
- Metrics and scoring methodology
- Detection logic details
- Platform comparisons
- Budget management
- Result interpretation

## License

Private - All rights reserved.
