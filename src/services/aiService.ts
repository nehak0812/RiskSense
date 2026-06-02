import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const tavilyApiKey = process.env.TAVILY_API_KEY || "";

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Cosine similarity in TypeScript
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 1. Tavily Web Search API
export async function searchWeb(query: string): Promise<any[]> {
  if (!tavilyApiKey) {
    console.warn("TAVILY_API_KEY not found. Returning mock search results.");
    return getMockSearchResults(query);
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query,
        search_depth: "advanced",
        max_results: 6,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily search API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error calling Tavily Search API:", error);
    return getMockSearchResults(query);
  }
}

// 2. Gemini Text Embeddings
export async function getEmbedding(text: string): Promise<number[]> {
  if (!genAI) {
    // Generate a simple pseudo-random embedding vector of 1536 dims (e.g. hash-based)
    const mockEmbedding = Array.from({ length: 1536 }, (_, idx) => {
      // Deterministic based on text content
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
      }
      return Math.sin(hash + idx) * 0.1;
    });
    return mockEmbedding;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating Gemini embedding:", error);
    return Array.from({ length: 1536 }, () => Math.random() * 0.1);
  }
}

interface EnrichedSignal {
  domain: string;
  sentiment: string;
  impact: string;
  summary: string;
  whyItMatters: string;
  entities: string[];
  regulations: string[];
  geographies: string[];
  suggestedKRIs: string[];
  suggestedActions: string[];
  confidence: number;
}

// 3. Gemini Enrichment & Classification
export async function classifyAndEnrichSignal(
  title: string,
  body: string,
  source: string
): Promise<EnrichedSignal> {
  const defaultPayload: EnrichedSignal = {
    domain: "Industry-specific",
    sentiment: "Concern",
    impact: "Medium",
    summary: title,
    whyItMatters: "External market dynamics that may affect operational efficiency or regulatory adherence.",
    entities: [],
    regulations: [],
    geographies: ["Global"],
    suggestedKRIs: ["KRI-01: Frequency of related news reports"],
    suggestedActions: ["Review internal protocols and benchmark peer response"],
    confidence: 0.8,
  };

  if (!genAI) {
    return defaultPayload;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      Analyze the following external risk signal (title, content, and source) and enrich it into structured JSON.
      
      Signal Title: "${title}"
      Signal Content: "${body}"
      Signal Source: "${source}"

      Respond strictly with JSON matching this structure:
      {
        "domain": "Geopolitical" | "Regulatory" | "Technology & AI" | "Environmental" | "Macro & Economic" | "Industry-specific" | "Supply chain" | "Financial",
        "sentiment": "Alarm" | "Concern" | "Watch" | "Stable" | "Easing",
        "impact": "High" | "Medium" | "Low",
        "summary": "Concise summary (max 2 sentences)",
        "whyItMatters": "Explains why this is a risk for target companies in this sector (max 2 sentences)",
        "entities": ["list of company names, organizations, or countries mentioned"],
        "regulations": ["list of regulations or acts mentioned, e.g., CSDDD, AI Act"],
        "geographies": ["list of geographies affected, e.g., US, EU, Global"],
        "suggestedKRIs": ["list of 1 or 2 suggested KRIs to monitor"],
        "suggestedActions": ["list of 1 or 2 suggested management actions"],
        "confidence": 0.85
      }
    `;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    const cleanJson = JSON.parse(responseText.trim());
    return { ...defaultPayload, ...cleanJson };
  } catch (error) {
    console.error("Error enriching signal with Gemini:", error);
    return defaultPayload;
  }
}

// 4. Summarize Board Pack Executive Summary
export async function generateBoardSummary(
  orgName: string,
  peers: string[],
  prioritisedRisks: any[]
): Promise<string> {
  const defaultSummary = `Emerging risk activity for ${orgName} has heightened overall exposure to Elevated. Key drivers include regulatory implementation pressure (e.g. EU AI Act, CSDDD) and geopolitical impacts on supply chains. Benchmarking against peers (${peers.join(", ")}) reveals critical alignment gaps, particularly in technology governance and climate disclosures. Executive priority is directed towards establishing KRIs and stabilizing key material actions.`;

  if (!genAI) {
    return defaultSummary;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      Write an Executive Summary (one paragraph, about 4-5 sentences) for a Board emerging-risk report.
      Target Company: ${orgName}
      Peers: ${peers.join(", ")}
      Prioritised Risks Data: ${JSON.stringify(
        prioritisedRisks.map((r) => ({
          title: r.title,
          score: r.score,
          appetiteStatus: r.appetiteStatus,
          category: r.category,
        }))
      )}
      
      Requirements:
      1. Write in a formal, board-ready, and analytical tone.
      2. Highlight the most pressing risks (specifically mentioning high-score or breached items).
      3. Reference the peer benchmark comparison.
      4. Synthesize overall risk posture.
    `;

    const response = await model.generateContent(prompt);
    return response.response.text().trim();
  } catch (error) {
    console.error("Error generating board summary with Gemini:", error);
    return defaultSummary;
  }
}

// Mock Search Results Helper
function getMockSearchResults(query: string): any[] {
  const q = query.toLowerCase();
  
  if (q.includes("unilever") || q.includes("fmcg") || q.includes("nestle") || q.includes("danone") || q.includes("reckitt")) {
    return [
      {
        title: "Deforestation rules under EU CSDDD and EUDR trigger supply chain concerns for FMCG companies",
        url: "https://www.reuters.com/business/sustainable-business/fmcg-deforestation-rules-eudr-2026",
        content: "Major FMCG companies, including Unilever and Nestlé, are facing compliance bottlenecks due to the impending EUDR (EU Deforestation Regulation) deadlines. Supply chains for palm oil, cocoa, and coffee are being restructured to enable farm-to-fork traceability. Companies lacking verification face significant penalty fines and import blockades.",
        score: 0.92,
      },
      {
        title: "Consumer watchdog flags greenwashing risks in ESG disclosures by major household brands",
        url: "https://www.ft.com/content/consumer-brands-greenwash-reporting-watchdog-esg",
        content: "A European regulatory audit of corporate sustainability statements highlights gaps between net-zero pledges and actual greenhouse gas reduction tracking. Companies are warned to standardize scope 3 emission calculations under CSRD/ESRS or risk public enforcement actions.",
        score: 0.87,
      },
      {
        title: "Water scarcity threats escalate across packaging manufacturing sites in Southern Europe",
        url: "https://www.bloomberg.com/news/articles/water-scarcity-packaging-production-sites-europe",
        content: "Drought levels in Italy and Spain are impacting water-heavy container production facilities. FMCG groups are looking to diversify packaging suppliers to avoid bottleneck risks in product distribution channels.",
        score: 0.81,
      },
      {
        title: "FMCG giants step up AI integration in demand planning but security audits reveal vulnerabilities",
        url: "https://www.techcrunch.com/fmcg-ai-planning-security-vulnerabilities",
        content: "Retail and consumer package groups are rapidly rolling out generative AI models for market forecast prediction. However, a third-party audit reports that proprietary database integrations do not conform to upcoming EU AI Act security requirements for high-risk applications.",
        score: 0.79,
      },
      {
        title: "Global logistics bottlenecks ease slightly, but shipping routes remain highly volatile",
        url: "https://www.wsj.com/articles/global-logistics-shipping-route-volatility-2026",
        content: "Maritime container rates have stabilized from Q1 peaks, but ongoing geopolitical friction in shipping channels forces companies to maintain higher safety stock buffers, impacting working capital turnover ratios.",
        score: 0.74,
      }
    ];
  }

  // Generic Mock Signals
  return [
    {
      title: `Emerging trends and regulatory impacts in ${query}`,
      url: "https://www.reuters.com/business/regulatory-updates-industry-2026",
      content: `A review of recent policy updates shows tightening rules for operational transparency and cybersecurity audits. Organizations are advised to map critical assets and perform peer disclosure gap analysis to ensure compliance before official audit cycles begin.`,
      score: 0.85,
    },
    {
      title: `Global supply chain re-routing and cost implications`,
      url: "https://www.bloomberg.com/supply-chain-insights",
      content: `Geopolitical friction points are forcing firms to localized supplier sourcing. While nearshoring reduces transport delay volatility, it introduces cost pressures and vendor-capacity bottlenecks that are squeezing gross profit margins.`,
      score: 0.80,
    }
  ];
}
