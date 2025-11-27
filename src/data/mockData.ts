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
