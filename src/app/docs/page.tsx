"use client";

import React, { useState } from "react";
import Link from "next/link";

// ============================================
// Documentation Sections
// ============================================

const sections = [
  { id: "overview", title: "Overview" },
  { id: "concepts", title: "Core Concepts" },
  { id: "metrics", title: "Metrics & Scoring" },
  { id: "detection", title: "Detection Logic" },
  { id: "platforms", title: "AI Platforms" },
  { id: "execution", title: "Execution Modes" },
  { id: "budget", title: "Budget & Costs" },
  { id: "interpreting", title: "Interpreting Results" },
  { id: "faq", title: "FAQ" },
];

// ============================================
// Main Documentation Page
// ============================================

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/visibility" className="text-indigo-600 hover:text-indigo-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-slate-800">Documentation</h1>
            </div>
            <Link
              href="/visibility"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Launch Tool
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-indigo-100 text-indigo-700 font-medium"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              {/* Overview Section */}
              <section id="overview" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                  LLM Brand Visibility Analyzer
                </h2>
                <p className="text-slate-600 mb-4">
                  This tool measures how often AI-powered platforms mention, recommend, or cite your brand
                  when users ask product-related questions. As consumers increasingly use AI assistants
                  like ChatGPT, Perplexity, and Google&apos;s AI Overviews to research purchases, understanding
                  your brand&apos;s visibility in these responses is crucial.
                </p>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-indigo-800 mb-2">What This Tool Answers</h3>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• When someone asks AI &quot;What&apos;s the best [product]?&quot;, does your brand appear?</li>
                    <li>• Which AI platforms mention your brand most frequently?</li>
                    <li>• What sentiment surrounds your brand in AI responses?</li>
                    <li>• How do you compare to competitors in AI recommendations?</li>
                  </ul>
                </div>

                <h3 className="text-lg font-semibold text-slate-800 mb-3">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { step: "1", title: "Enter Brand", desc: "Provide your website URL and optional brand name" },
                    { step: "2", title: "Generate Queries", desc: "AI suggests realistic purchase-intent questions" },
                    { step: "3", title: "Select Platforms", desc: "Choose which AI models to test against" },
                    { step: "4", title: "Analyze Results", desc: "See citation rates, sentiment, and recommendations" },
                  ].map((item) => (
                    <div key={item.step} className="bg-slate-50 rounded-lg p-4">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm mb-2">
                        {item.step}
                      </div>
                      <h4 className="font-medium text-slate-800">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Core Concepts Section */}
              <section id="concepts" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Core Concepts</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Brand Visibility vs. Traditional SEO</h3>
                    <p className="text-slate-600 mb-3">
                      Traditional SEO measures your ranking in search engine results pages (SERPs).
                      <strong> LLM Brand Visibility</strong> measures something different: whether AI systems
                      mention your brand in their generated responses.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-medium text-slate-700 mb-2">Traditional SEO</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Your website appears in search results</li>
                          <li>• Users click through to your site</li>
                          <li>• Based on crawled web pages</li>
                          <li>• You control your ranking factors</li>
                        </ul>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <h4 className="font-medium text-indigo-700 mb-2">LLM Visibility</h4>
                        <ul className="text-sm text-indigo-600 space-y-1">
                          <li>• AI mentions your brand in responses</li>
                          <li>• Users may not click—they get the answer directly</li>
                          <li>• Based on training data + real-time search</li>
                          <li>• You have limited direct control</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Search Platforms vs. Chat Platforms</h3>
                    <p className="text-slate-600 mb-3">
                      AI platforms fall into two categories, each with different implications for your brand:
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-3 font-semibold text-slate-700">Aspect</th>
                            <th className="text-left py-2 px-3 font-semibold text-green-700">Search Platforms</th>
                            <th className="text-left py-2 px-3 font-semibold text-blue-700">Chat Platforms</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600">
                          <tr className="border-b border-slate-100">
                            <td className="py-2 px-3 font-medium">Examples</td>
                            <td className="py-2 px-3">Perplexity, Google AI Overviews, Gemini</td>
                            <td className="py-2 px-3">ChatGPT, Claude, Meta AI</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-2 px-3 font-medium">Data Source</td>
                            <td className="py-2 px-3">Real-time web search + training data</td>
                            <td className="py-2 px-3">Training data only (knowledge cutoff)</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-2 px-3 font-medium">Citations</td>
                            <td className="py-2 px-3">Provides clickable source URLs</td>
                            <td className="py-2 px-3">No source links (usually)</td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-2 px-3 font-medium">Business Impact</td>
                            <td className="py-2 px-3 text-green-700 font-medium">Drives direct traffic</td>
                            <td className="py-2 px-3 text-blue-700 font-medium">Builds brand awareness</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-medium">Detection Method</td>
                            <td className="py-2 px-3">Grounded (URL matching)</td>
                            <td className="py-2 px-3">Text-match (keyword search)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Detection Methods</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">Grounded Detection</h4>
                        <p className="text-sm text-green-700 mb-2">
                          Used for search platforms that return actual source URLs.
                        </p>
                        <ul className="text-xs text-green-600 space-y-1">
                          <li>• Extracts URLs from citation metadata</li>
                          <li>• Matches your domain against cited sources</li>
                          <li>• High confidence (actual link to your site)</li>
                          <li>• Provides rank position in citations</li>
                        </ul>
                      </div>
                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Text-Match Detection</h4>
                        <p className="text-sm text-blue-700 mb-2">
                          Used for chat platforms without structured citations.
                        </p>
                        <ul className="text-xs text-blue-600 space-y-1">
                          <li>• Searches response text for brand mentions</li>
                          <li>• Checks multiple name variations</li>
                          <li>• Medium confidence (may miss/false-positive)</li>
                          <li>• Extracts surrounding context</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Metrics Section */}
              <section id="metrics" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Metrics & Scoring</h2>

                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Citation Rate</h3>
                    <p className="text-slate-600 mb-3">
                      The percentage of AI platforms that mentioned your brand in their response.
                    </p>
                    <div className="bg-white rounded border border-slate-200 p-4 font-mono text-sm">
                      <p className="text-slate-500 mb-1"># Formula:</p>
                      <p className="text-indigo-700">Citation Rate = (Models that found brand / Total models tested) × 100</p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      <div className="bg-green-100 rounded p-2">
                        <p className="text-2xl font-bold text-green-700">70%+</p>
                        <p className="text-xs text-green-600">Strong visibility</p>
                      </div>
                      <div className="bg-amber-100 rounded p-2">
                        <p className="text-2xl font-bold text-amber-700">30-70%</p>
                        <p className="text-xs text-amber-600">Moderate visibility</p>
                      </div>
                      <div className="bg-red-100 rounded p-2">
                        <p className="text-2xl font-bold text-red-700">&lt;30%</p>
                        <p className="text-xs text-red-600">Low visibility</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Sentiment Analysis</h3>
                    <p className="text-slate-600 mb-3">
                      Analyzes the tone of text surrounding your brand mention using keyword detection.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <h4 className="font-medium text-green-800 text-sm mb-1">Positive Indicators</h4>
                        <p className="text-xs text-green-600">
                          recommend, best, top, excellent, quality, trusted, reliable, leading, popular, preferred
                        </p>
                      </div>
                      <div className="bg-slate-100 border border-slate-200 rounded p-3">
                        <h4 className="font-medium text-slate-700 text-sm mb-1">Neutral</h4>
                        <p className="text-xs text-slate-500">
                          No strong positive or negative signals detected in surrounding context
                        </p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <h4 className="font-medium text-red-800 text-sm mb-1">Negative Indicators</h4>
                        <p className="text-xs text-red-600">
                          avoid, poor, worst, unreliable, expensive, disappointing, issues, problems, complaints
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded border border-slate-200 p-4 font-mono text-sm">
                      <p className="text-slate-500 mb-1"># Scoring Logic:</p>
                      <p className="text-slate-700">if (positiveCount &gt; negativeCount + 1) → <span className="text-green-600">&quot;positive&quot;</span></p>
                      <p className="text-slate-700">else if (negativeCount &gt; positiveCount + 1) → <span className="text-red-600">&quot;negative&quot;</span></p>
                      <p className="text-slate-700">else → <span className="text-slate-500">&quot;neutral&quot;</span></p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Confidence Score</h3>
                    <p className="text-slate-600 mb-3">
                      A 0-100% score indicating how certain the detection is. Higher confidence means
                      stronger evidence of an intentional brand mention.
                    </p>
                    <div className="bg-white rounded border border-slate-200 p-4">
                      <p className="font-medium text-slate-700 mb-2">Score Components:</p>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li><span className="font-mono bg-slate-100 px-1 rounded">+50%</span> Base score when brand is found</li>
                        <li><span className="font-mono bg-slate-100 px-1 rounded">+10%</span> For each matching identifier (URL, domain, name) up to +30%</li>
                        <li><span className="font-mono bg-slate-100 px-1 rounded">+10%</span> For each additional mention (up to +30%)</li>
                        <li><span className="font-mono bg-slate-100 px-1 rounded">+5%</span> For recommendation context words (&quot;recommend&quot;, &quot;try&quot;, &quot;visit&quot;) up to +30%</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Rank Position</h3>
                    <p className="text-slate-600 mb-3">
                      For search platforms, this indicates your position in the citation list.
                      For chat platforms, it&apos;s extracted from numbered recommendation lists.
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                        <span className="text-sm text-slate-600">Top recommendation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                        <span className="text-sm text-slate-600">Mid-tier mention</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-red-400 text-white rounded-full flex items-center justify-center font-bold">5+</span>
                        <span className="text-sm text-slate-600">Lower visibility</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Detection Logic Section */}
              <section id="detection" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Detection Logic</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">How Brand Detection Works</h3>
                    <p className="text-slate-600 mb-4">
                      The tool searches for your brand using multiple name variations to catch different
                      ways AI might reference you.
                    </p>

                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-slate-700 mb-2">Brand Variations Generated</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        For URL <code className="bg-slate-200 px-1 rounded">https://www.bestbuy.com</code> with name &quot;Best Buy&quot;:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["bestbuy", "best buy", "best-buy", "bestbuy.com", "Best Buy", "BestBuy"].map((v) => (
                          <span key={v} className="px-2 py-1 bg-white border border-slate-200 rounded text-sm font-mono">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <h4 className="font-medium text-slate-700 mb-3">Detection Process</h4>
                      <ol className="space-y-2 text-sm text-slate-600">
                        <li className="flex gap-3">
                          <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                          <span>Extract domain from your URL (e.g., &quot;bestbuy&quot; from bestbuy.com)</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                          <span>Generate variations: spaces, hyphens, camelCase, full URL, etc.</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                          <span>Search the AI response for any variation (case-insensitive)</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                          <span>Extract ~100 characters of context around the mention</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                          <span>Analyze sentiment and calculate confidence score</span>
                        </li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">Competitor Detection</h3>
                    <p className="text-slate-600 mb-3">
                      The tool also identifies competitors mentioned alongside your brand, helping you
                      understand the competitive landscape in AI responses.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2">Known Brands Tracked</h4>
                      <p className="text-sm text-amber-700 mb-2">
                        40+ brands across categories: Electronics, Fashion, Jewelry, Home, Watches
                      </p>
                      <p className="text-xs text-amber-600">
                        Examples: Amazon, Best Buy, Walmart, Nordstrom, Tiffany, Wayfair, IKEA, etc.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Platforms Section */}
              <section id="platforms" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">AI Platforms</h2>

                <p className="text-slate-600 mb-4">
                  The tool tests your brand against 10 AI platforms, representing the major consumer
                  AI services people use for product research.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      Search Platforms (Grounded)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { name: "Gemini 2.0 Flash", product: "Google AI / Search", tier: "budget", cost: "$0.075/1M" },
                        { name: "Gemini 2.0 Pro", product: "Gemini Advanced", tier: "premium", cost: "$1.25/1M" },
                        { name: "Perplexity Sonar", product: "Perplexity Free", tier: "budget", cost: "$1.00/1M" },
                        { name: "Perplexity Sonar Pro", product: "Perplexity Pro", tier: "premium", cost: "$3.00/1M" },
                      ].map((m) => (
                        <div key={m.name} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-green-800">{m.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              m.tier === "premium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                            }`}>
                              {m.tier}
                            </span>
                          </div>
                          <p className="text-xs text-green-600">{m.product} • {m.cost} input</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      Chat Platforms (Text-Match)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { name: "GPT-4o Mini", product: "ChatGPT Free", tier: "budget", cost: "$0.15/1M" },
                        { name: "GPT-4o", product: "ChatGPT Plus", tier: "premium", cost: "$2.50/1M" },
                        { name: "Claude 3.5 Haiku", product: "Claude Free", tier: "budget", cost: "$0.80/1M" },
                        { name: "Claude 3.5 Sonnet", product: "Claude Pro", tier: "premium", cost: "$3.00/1M" },
                        { name: "Llama 3.1 70B", product: "Meta AI", tier: "budget", cost: "$0.52/1M" },
                      ].map((m) => (
                        <div key={m.name} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-blue-800">{m.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              m.tier === "premium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {m.tier}
                            </span>
                          </div>
                          <p className="text-xs text-blue-600">{m.product} • {m.cost} input</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-slate-700 mb-2">Model Presets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="bg-white rounded border border-slate-200 p-3">
                        <h5 className="font-medium text-slate-800">Quick Check</h5>
                        <p className="text-xs text-slate-500">2 models, ~$0.01/query</p>
                        <p className="text-xs text-slate-600 mt-1">Gemini Flash + GPT-4o Mini</p>
                      </div>
                      <div className="bg-white rounded border border-slate-200 p-3">
                        <h5 className="font-medium text-slate-800">Balanced</h5>
                        <p className="text-xs text-slate-500">4 models, ~$0.02/query</p>
                        <p className="text-xs text-slate-600 mt-1">+ Perplexity + Claude Haiku</p>
                      </div>
                      <div className="bg-white rounded border border-slate-200 p-3">
                        <h5 className="font-medium text-slate-800">Comprehensive</h5>
                        <p className="text-xs text-slate-500">6 models, ~$0.05/query</p>
                        <p className="text-xs text-slate-600 mt-1">+ GPT-4o + Llama</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Execution Modes Section */}
              <section id="execution" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Execution Modes</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4">
                      <h3 className="font-semibold text-indigo-800 mb-2">All Queries × All Models</h3>
                      <p className="text-sm text-indigo-700 mb-2">Complete visibility matrix</p>
                      <p className="text-xs text-indigo-600">
                        Tests every query against every selected model. Most comprehensive but highest cost.
                      </p>
                      <p className="text-xs text-indigo-500 mt-2 font-mono">
                        Tests = queries × models
                      </p>
                    </div>
                    <div className="border border-slate-200 bg-slate-50 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">All Queries × One Model</h3>
                      <p className="text-sm text-slate-600 mb-2">Deep dive on a single platform</p>
                      <p className="text-xs text-slate-500">
                        Tests all queries against one chosen model. Good for platform-specific analysis.
                      </p>
                      <p className="text-xs text-slate-400 mt-2 font-mono">
                        Tests = queries × 1
                      </p>
                    </div>
                    <div className="border border-slate-200 bg-slate-50 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-800 mb-2">One Query × All Models</h3>
                      <p className="text-sm text-slate-600 mb-2">Quick spot check</p>
                      <p className="text-xs text-slate-500">
                        Tests one query across all models. Fast way to compare platforms.
                      </p>
                      <p className="text-xs text-slate-400 mt-2 font-mono">
                        Tests = 1 × models
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Parallel Execution</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Tests run in parallel for faster results:
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• <strong>Query-level:</strong> Up to 3 queries run simultaneously</li>
                      <li>• <strong>Model-level:</strong> All models for a query run in parallel</li>
                      <li>• <strong>Result:</strong> 6-10x faster than sequential execution</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Budget Section */}
              <section id="budget" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Budget & Costs</h2>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">How Costs Are Calculated</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Each API call costs based on tokens used (roughly, words processed):
                    </p>
                    <div className="bg-white rounded border border-slate-200 p-3 font-mono text-sm">
                      <p className="text-slate-600">Cost = (input_tokens / 1M × input_rate) + (output_tokens / 1M × output_rate)</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Typical test: ~500 input tokens, ~300 output tokens per query per model
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Budget Controls</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Click the budget display in the header to set spending limits:
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• <strong>Default limit:</strong> $1.00 per session</li>
                      <li>• <strong>Warning:</strong> Shown at 80% of budget</li>
                      <li>• <strong>Presets:</strong> $0.25, $0.50, $1.00, $5.00</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Mock Mode</h3>
                    <p className="text-sm text-green-700">
                      Enable Mock Mode to test the full workflow without any API costs.
                      Generates realistic fake results for testing and demonstration.
                    </p>
                  </div>
                </div>
              </section>

              {/* Interpreting Results Section */}
              <section id="interpreting" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Interpreting Results</h2>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">What Good Results Look Like</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-right font-medium text-green-700">70%+</span>
                        <span className="text-slate-600">Citation rate: Strong AI visibility</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-right font-medium text-green-700">Positive</span>
                        <span className="text-slate-600">Sentiment: AI recommends your brand favorably</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-right font-medium text-green-700">#1-3</span>
                        <span className="text-slate-600">Rank: Top recommendation position</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-16 text-right font-medium text-green-700">80%+</span>
                        <span className="text-slate-600">Confidence: Strong, clear mentions</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-800 mb-2">Common Issues & Solutions</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-amber-700">Low citation rate (&lt;30%)</p>
                        <p className="text-amber-600">Your brand may lack presence in AI training data. Focus on creating high-quality content that AI systems can reference.</p>
                      </div>
                      <div>
                        <p className="font-medium text-amber-700">Negative sentiment</p>
                        <p className="text-amber-600">AI may have learned from negative reviews or press. Address underlying issues and encourage positive reviews.</p>
                      </div>
                      <div>
                        <p className="font-medium text-amber-700">High competitors</p>
                        <p className="text-amber-600">AI often mentions multiple brands. Differentiate your value proposition clearly.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Viewing Full Results</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      Click any query result card to expand it and see:
                    </p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Full AI response text with brand highlights</li>
                      <li>• Detection details (what terms were searched)</li>
                      <li>• Competitors mentioned in that response</li>
                      <li>• Source citations (for search platforms)</li>
                      <li>• Cost and latency for that specific test</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section id="faq" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Frequently Asked Questions</h2>

                <div className="space-y-4">
                  {[
                    {
                      q: "Why might my brand not be found even though it's well-known?",
                      a: "AI models have training data cutoffs and may not know recent information. They also might reference your brand differently than expected. Try adding your brand name explicitly (not just URL) and check the detection details to see what variations were searched."
                    },
                    {
                      q: "What's the difference between 'found' and 'cited'?",
                      a: "For search platforms, being 'cited' means your actual URL appears in the sources. For chat platforms, being 'found' means your brand name was mentioned in the text. Citations drive traffic; mentions drive awareness."
                    },
                    {
                      q: "How accurate is sentiment analysis?",
                      a: "Sentiment analysis uses keyword detection and is approximately 70-80% accurate. It may miss nuanced sentiment or sarcasm. Always review the actual response text for important decisions."
                    },
                    {
                      q: "Why do different models give different results?",
                      a: "Each AI model has different training data, knowledge cutoffs, and response styles. This is exactly why testing across multiple platforms is valuable—it shows where your brand has visibility gaps."
                    },
                    {
                      q: "How often should I run visibility tests?",
                      a: "Monthly testing is a good baseline. Run additional tests after major marketing campaigns, PR events, or product launches to track impact on AI visibility."
                    },
                    {
                      q: "Can I improve my brand's AI visibility?",
                      a: "Yes! Focus on: (1) Creating high-quality, authoritative content that AI systems can learn from, (2) Getting mentioned on well-indexed sites, (3) Building a strong online presence with consistent branding, (4) Encouraging authentic positive reviews."
                    },
                  ].map((faq, i) => (
                    <details key={i} className="bg-slate-50 rounded-lg">
                      <summary className="p-4 font-medium text-slate-800 cursor-pointer hover:bg-slate-100 rounded-lg">
                        {faq.q}
                      </summary>
                      <p className="px-4 pb-4 text-sm text-slate-600">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </section>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-6 mt-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Need help? Check the{" "}
                    <a href="#faq" className="text-indigo-600 hover:underline">FAQ</a> or{" "}
                    <a href="#concepts" className="text-indigo-600 hover:underline">Core Concepts</a>.
                  </p>
                  <Link
                    href="/visibility"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Launch Tool
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
