# Contributing

Development guidelines for the LLM Brand Visibility Analyzer.

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

## Code Organization

### Services (`src/services/`)

Core business logic for AI provider integration and visibility detection.

| File | Responsibility |
|------|----------------|
| `visibilityService.ts` | Brand detection, sentiment analysis, confidence scoring |
| `queryDiscoveryService.ts` | AI-powered query generation |
| `geminiService.ts` | Google Gemini API integration |
| `openRouterService.ts` | OpenRouter multi-model API |
| `openAIService.ts` | Direct OpenAI API |

### Components (`src/components/`)

- `visibility/` - Feature-specific components for the visibility tool
- `ui/` - Reusable UI primitives

### Hooks (`src/hooks/`)

Custom React hooks for shared stateful logic.

### Context (`src/context/`)

- `CostContext.tsx` - Global cost tracking and budget management

## Adding a New AI Model

1. **Define the model** in `src/types.ts`:

```typescript
// Add to MODEL_CONFIGS
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // ...existing models
  "new-model-id": {
    id: "new-model-id",
    name: "New Model Name",
    provider: "provider-name",
    tier: "budget" | "premium",
    supportsCitations: boolean,
    inputCostPer1M: number,
    outputCostPer1M: number,
    description: "Model description",
    productEquivalent: "Consumer product name",
    platformType: "search" | "chat",
  },
};
```

2. **Add API integration** in the appropriate service file or create a new one.

3. **Update the test endpoint** in `src/app/api/test-prompt/route.ts` if needed.

## Detection Logic

### Brand Variations

The system generates multiple variations of a brand name to catch different formats:

```
bestbuy.com → ["bestbuy", "best buy", "best-buy", "bestbuy.com", "BestBuy"]
```

### Confidence Scoring

```
Base: 50% (when brand found)
+10% per matching identifier (up to +30%)
+10% per additional mention (up to +30%)
+5% per recommendation word (up to +30%)
Max: 100%
```

### Sentiment Keywords

**Positive**: recommend, best, top, excellent, quality, trusted, reliable, leading, popular, preferred

**Negative**: avoid, poor, worst, unreliable, expensive, disappointing, issues, problems, complaints

## API Design

### Request/Response Types

All API routes use Zod for validation. Types are defined in `src/types.ts`.

### Error Handling

Return consistent error responses:

```typescript
return NextResponse.json(
  { error: "Error message" },
  { status: 400 | 500 }
);
```

### Cost Tracking

All API responses should include cost information:

```typescript
{
  // ... response data
  costs: {
    inputTokens: number,
    outputTokens: number,
    totalCost: number
  }
}
```

## Testing

### Mock Mode

Enable mock mode in the UI to test without API costs. Mock responses are generated in the API routes.

### Manual Testing

1. Use mock mode for UI/UX testing
2. Use "Quick Check" preset for minimal API usage
3. Test with a known brand (e.g., apple.com) for predictable results

## Type Safety

- All function parameters and returns should be typed
- Use Zod schemas for runtime validation of API inputs
- Model configurations are type-checked against `ModelConfig`

## Performance

- API calls run in parallel using `Promise.allSettled`
- Query-level parallelism is limited to 3 concurrent queries
- Model-level calls within a query run fully parallel
