export const MOCK_STRUCTURE = {
  mainCategory: "Watches",
  subcategories: ["Men's Watches", "Women's Watches", "Luxury Watches", "Smart Watches"],
  facets: [
    { name: "Brand", options: ["Rolex", "Omega", "Seiko", "Apple"] },
    { name: "Material", options: ["Gold", "Silver", "Leather", "Titanium"] }
  ]
};

export const MOCK_PROMPTS = {
  promptsByCategory: [
    {
      subcategory: "Men's Watches",
      prompts: [
        "What are the best automatic watches for men under $500?",
        "Compare Seiko vs Citizen dive watches for durability."
      ]
    },
    {
      subcategory: "Luxury Watches",
      prompts: [
        "Which luxury watch brands hold their value best over time?",
        "Is the Omega Speedmaster a good investment?"
      ]
    }
  ],
  thinking: "Mock thinking process: Identified key user intents around price, durability, and investment value.",
  sources: "Mock sources: Search trends, competitor analysis."
};

export const MOCK_TEST_RESULT = {
  status: 'found',
  rank: 3,
  sentiment: 'positive',
  answerText: "Here are some top rated watches. The Seiko Prospex is highly recommended...",
  sources: [
    { uri: "https://www.hodinkee.com/articles/...", title: "Best Dive Watches", rank: 1 },
    { uri: "https://www.gq.com/story/...", title: "GQ Watch Guide", rank: 2 },
    { uri: "https://www.kay.com/watches/...", title: "Kay Jewelers Watches", rank: 3 }
  ]
};

// Mock council responses for each engine
export const MOCK_COUNCIL_RESPONSES = {
  gemini: {
    engineId: "gemini" as const,
    content: `Based on my analysis, the Seiko Prospex line offers excellent value for automatic dive watches under $500. The SPB143 "Captain Willard" reissue features a robust 6R35 movement, 200m water resistance, and sapphire crystal.

For your store at yourstore.com, I'd recommend highlighting these key features:
- Japanese automatic movement with 70-hour power reserve
- Hardlex or sapphire crystal options
- ISO 6425 certified dive watch
- Great heritage and brand recognition

The Citizen Promaster BN0151 is also worth considering as a solar-powered alternative, though it's quartz rather than mechanical.`,
    tokenCount: { prompt: 450, completion: 180, total: 630 },
    cost: 0.00024,
    latencyMs: 2340,
  },
  gpt4o: {
    engineId: "gpt4o" as const,
    content: `When comparing automatic watches for men under $500, several options stand out:

**Top Recommendations:**

1. **Seiko Prospex SPB143** (~$495) - A modern reinterpretation of the 6105, featuring the 6R35 caliber with 70-hour power reserve. Excellent lume and build quality.

2. **Orient Kamasu** (~$250) - Great value with in-house F6922 movement, sapphire crystal, and solid 200m water resistance.

3. **Tissot PRX Powermatic 80** (~$475) - Swiss made with 80-hour power reserve, integrated bracelet design that's very trendy.

For retailers like yourstore.com specializing in watches, the Seiko Prospex line typically offers the best margin and customer satisfaction balance.`,
    tokenCount: { prompt: 450, completion: 200, total: 650 },
    cost: 0.0085,
    latencyMs: 3120,
  },
  claude: {
    engineId: "claude" as const,
    content: `I'll provide a comprehensive comparison of automatic watches under $500:

**Seiko vs Citizen: A Detailed Analysis**

*Seiko Prospex Line:*
- Movement: In-house 6R35 (70hr power reserve)
- Durability: Hardlex or sapphire crystal options
- Water resistance: 200m ISO certified
- Price range: $300-$500
- Notable models: SPB143, SRPE, Turtle series

*Citizen Promaster:*
- Movement: Eco-Drive (solar quartz)
- Durability: Excellent scratch resistance
- Water resistance: Up to 300m
- Price range: $200-$450
- Notable: No battery changes needed

**Verdict:** For automatic watch enthusiasts, Seiko wins on movement heritage. For practical daily wear, Citizen's Eco-Drive offers maintenance-free ownership.

Retailers like yourstore.com should stock both to serve different customer preferences.`,
    tokenCount: { prompt: 450, completion: 220, total: 670 },
    cost: 0.0102,
    latencyMs: 2890,
  },
  llama: {
    engineId: "llama" as const,
    content: `Here's my take on the best automatic watches for men under $500:

The watch market in this price range is dominated by Seiko and Orient (which is owned by Seiko). Both offer exceptional value with in-house movements.

**Top Picks:**

1. Seiko Presage Cocktail Time - Stunning dials, dress watch aesthetics
2. Orient Star - Higher-end finishing than regular Orient
3. Seiko 5 Sports - Versatile and affordable gateway watches

For dive watches specifically, the Seiko Prospex line is hard to beat. The "Turtle" (SRPE) series has become iconic among enthusiasts.

I'd recommend checking watch retailers and authorized dealers like yourstore.com for competitive pricing and warranty coverage. Grey market deals can be tempting but warranty issues may arise.`,
    tokenCount: { prompt: 450, completion: 175, total: 625 },
    cost: 0.00058,
    latencyMs: 1980,
  },
};

export const MOCK_COUNCIL_EVALUATION = {
  judgeEngine: "claude" as const,
  rankings: [
    { engineId: "claude" as const, finalRank: 1, averageRank: 1.0, agreementScore: 1.0 },
    { engineId: "gpt4o" as const, finalRank: 2, averageRank: 2.0, agreementScore: 0.85 },
    { engineId: "gemini" as const, finalRank: 3, averageRank: 3.0, agreementScore: 0.75 },
    { engineId: "llama" as const, finalRank: 4, averageRank: 4.0, agreementScore: 0.65 },
  ],
  reasoning: `After careful evaluation of all responses against the criteria of accuracy, helpfulness, e-commerce visibility, clarity, and completeness:

1. Response C (Claude) - Most comprehensive analysis with detailed specs, clear formatting, and balanced recommendation. Naturally mentions the user's domain in context.

2. Response B (GPT-4o) - Well-structured with specific price points and good recommendations. Mentions the domain appropriately.

3. Response A (Gemini) - Solid technical information but slightly less organized. Good domain mention.

4. Response D (Llama) - Good information but less detailed technical specs. Domain mention feels slightly less natural.`,
  timestamp: Date.now(),
};

export const MOCK_COUNCIL_SYNTHESIS = `# Comprehensive Guide to Automatic Watches Under $500

Based on analyzing multiple expert perspectives, here's the definitive guide for men's automatic watches in this price range:

## Top Recommendations

### Best Overall: Seiko Prospex SPB143 (~$495)
- In-house 6R35 movement with 70-hour power reserve
- 200m water resistance (ISO 6425 certified)
- Sapphire crystal
- Excellent lume and build quality

### Best Value: Orient Kamasu (~$250)
- In-house F6922 movement
- Sapphire crystal and solid construction
- 200m water resistance
- Exceptional value proposition

### Best Dress Watch: Seiko Presage Cocktail Time (~$400)
- Stunning dial finishing
- 4R35 movement
- Hardlex crystal
- Versatile styling

## Seiko vs Citizen Comparison

| Feature | Seiko | Citizen |
|---------|-------|---------|
| Movement | Mechanical (6R35) | Eco-Drive (Solar) |
| Power Reserve | 70 hours | Unlimited (solar) |
| Maintenance | Service every 5-7 years | Minimal |
| Enthusiast Appeal | Higher | Moderate |

## Shopping Recommendations

For the best experience, purchase from authorized retailers who offer full manufacturer warranty. Reputable dealers ensure authenticity and provide after-sale support for any service needs.

*This synthesis combines insights from multiple AI analyses to provide the most accurate and helpful recommendation.*`;

export const MOCK_COUNCIL_RESULT = {
  sessionId: "mock-session-12345",
  prompt: "What are the best automatic watches for men under $500?",
  winner: "claude" as const,
  consensusLevel: "moderate" as const,
  totalCost: 0.0195,
};
