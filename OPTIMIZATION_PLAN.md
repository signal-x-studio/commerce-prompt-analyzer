# LLM Brand Visibility Analyzer - Optimization Plan

## Current State Analysis

### Performance Issues

1. **Sequential Execution (Critical)**
   - Current: Nested for-loops run queries one at a time
   - Impact: 10 queries × 4 models = 40 sequential API calls
   - At ~2s per call = **80 seconds total**
   - Parallel potential: ~4-8 seconds (10-20x faster)

2. **Unused Parallel Infrastructure**
   - `queryModelsParallel()` in `openRouterService.ts` exists but unused
   - `testModelsParallel()` in `visibilityService.ts` exists but unused
   - API route ignores these, runs sequential loops instead

3. **SSE Streaming Tradeoff**
   - Current design sends per-model updates for UI feedback
   - This forces sequential execution to maintain update order
   - User sees progress but waits much longer

---

## Optimization Plan

### Phase 1: Parallel Model Execution (High Impact)

**Goal:** Run all models for a single query in parallel

**Changes:**
```
Current:  for query → for model → await test (sequential)
Proposed: for query → await Promise.all(models.map(test)) (parallel per query)
```

**Implementation:**
1. Update `/api/visibility/test/route.ts`:
   - Replace inner model loop with `testModelsParallel()`
   - Send batch `models_complete` event instead of individual events
   - Maintain per-query SSE updates for progress visibility

**Expected improvement:** 4-6x faster (models run in parallel)

**SSE Event Changes:**
```typescript
// Before: Per-model events
{ type: "model_start", modelId: "gemini-flash" }
{ type: "model_complete", modelId: "gemini-flash", result: {...} }
{ type: "model_start", modelId: "gpt4o-mini" }
// ... one at a time

// After: Batch events per query
{ type: "query_start", queryId: "q1", models: ["gemini-flash", "gpt4o-mini", ...] }
{ type: "query_complete", queryId: "q1", results: { "gemini-flash": {...}, "gpt4o-mini": {...} } }
```

---

### Phase 2: Parallel Query Execution (Maximum Speed)

**Goal:** Run multiple queries concurrently with rate limiting

**Implementation:**
1. Use a concurrency pool (e.g., p-limit or custom semaphore)
2. Process 3-5 queries simultaneously
3. Each query runs its models in parallel (from Phase 1)

**Configuration:**
```typescript
const CONCURRENCY_LIMIT = 5; // Max simultaneous queries
const MODEL_CONCURRENCY = 10; // Max simultaneous model calls total
```

**Expected improvement:** Additional 3-5x on top of Phase 1

**Considerations:**
- OpenRouter rate limits (typically generous)
- Gemini API rate limits (may need throttling)
- Error isolation per query

---

### Phase 3: Execution Mode Optimizations

**Goal:** Smart batching based on execution mode

| Mode | Optimization Strategy |
|------|----------------------|
| All × All | Batch by query (Phase 1+2) |
| All × One | Single model, max query parallelism |
| One × All | Single batch, all models parallel |

**Implementation:**
```typescript
switch (executionMode) {
  case "one-query-all-models":
    // Single parallel batch - fastest possible
    return await testModelsParallel(models, query, brandUrl);

  case "all-queries-one-model":
    // Max query parallelism, single model
    return await Promise.all(queries.map(q =>
      testModelVisibility(selectedModel, q.text, brandUrl)
    ));

  case "all-queries-all-models":
    // Chunked parallel with rate limiting
    return await executeWithConcurrencyLimit(queries, models, LIMIT);
}
```

---

### Phase 4: Caching Layer

**Goal:** Avoid redundant API calls

**Implementation:**
1. Cache key: `hash(query + model + brandUrl)`
2. TTL: 24 hours (AI responses don't change frequently)
3. Storage: Redis or in-memory LRU cache

**Cache Strategy:**
```typescript
async function testWithCache(modelId, query, brandUrl) {
  const cacheKey = createCacheKey(modelId, query, brandUrl);
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const result = await testModelVisibility(modelId, query, brandUrl);
  await cache.set(cacheKey, result, TTL_24H);
  return result;
}
```

**Benefits:**
- Repeated tests are instant
- Re-running same queries for different analysis is free
- Reduces API costs

---

### Phase 5: UI/UX Improvements

**Goal:** Better feedback during parallel execution

1. **Progress Indicator Redesign**
   - Show "Testing X queries across Y models" instead of per-model
   - Progress bar based on completed queries, not individual calls
   - Estimated time remaining based on actual latency

2. **Streaming Results**
   - Show results as they complete (not wait for all)
   - Query cards appear one by one with results
   - Each card shows all model results together

3. **Background Execution Option**
   - "Run in background" for large test matrices
   - Notification when complete
   - Results saved to session storage

---

### Phase 6: Cost Optimization

**Goal:** Reduce API costs without sacrificing quality

1. **Smart Model Selection**
   - Start with budget models
   - Only escalate to premium if budget models disagree
   - "Confidence threshold" to skip redundant calls

2. **Response Truncation**
   - Request shorter responses when full text not needed
   - `max_tokens: 500` for detection-only mode

3. **Batch Pricing**
   - Track cumulative costs in real-time
   - Warn user before expensive operations
   - "Budget mode" that stops at cost threshold

---

## Implementation Priority

| Phase | Impact | Effort | Priority |
|-------|--------|--------|----------|
| 1. Parallel Models | High | Low | **P0 - Do First** |
| 2. Parallel Queries | High | Medium | P1 |
| 3. Mode Optimization | Medium | Low | P1 |
| 5. UI Updates | Medium | Medium | P2 |
| 4. Caching | Medium | High | P2 |
| 6. Cost Optimization | Low | Medium | P3 |

---

## Technical Implementation Details

### Phase 1 Code Changes

**File: `/src/app/api/visibility/test/route.ts`**

```typescript
// BEFORE (sequential)
for (const query of queriesToTest) {
  for (const modelId of modelsToTest) {
    const result = await testModelVisibility(modelId, query.text, brandUrl);
    // send SSE event per model
  }
}

// AFTER (parallel per query)
for (const query of queriesToTest) {
  sendEvent("query_start", { queryId: query.id, queryText: query.text });

  // Run all models in parallel
  const results = await testModelsParallel(modelsToTest, query.text, brandUrl, brandName);

  // Send batch result
  sendEvent("query_complete", {
    queryId: query.id,
    modelResults: results,
    // ... metrics
  });
}
```

**File: `/src/hooks/useVisibilityTest.ts`**

Update event handler to process batch results:
```typescript
case "query_complete": {
  const { queryId, modelResults, citationRate, ... } = event.data;

  setState(prev => ({
    ...prev,
    queryResults: {
      ...prev.queryResults,
      [queryId]: {
        queryId,
        queryText: prev.currentQuery,
        modelResults, // All models at once
        citationRate,
        ...
      }
    }
  }));
}
```

---

## Metrics to Track

After implementation, measure:

1. **Total execution time** (target: 80% reduction)
2. **Time to first result** (target: <3s)
3. **API error rate** (should stay same or decrease)
4. **Cost per test** (should stay same)
5. **User-perceived responsiveness** (qualitative)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Rate limiting from providers | Implement backoff, reduce concurrency |
| Memory pressure from parallel | Stream results, don't buffer all |
| Error cascading | Use `Promise.allSettled`, isolate failures |
| SSE connection timeout | Heartbeat events, reconnection logic |
| Cost runaway | Real-time cost tracking, hard limits |
