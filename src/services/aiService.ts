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
export async function searchWeb(query: string, timeRange?: string): Promise<any[]> {
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
        time_range: timeRange || undefined,
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

interface CompanyInfo {
  name: string;
  industry: string;
  geographies: string[];
  peers: string[];
}

export async function fetchCompanyInfo(companyName: string, description: string = ""): Promise<CompanyInfo> {
  const normName = companyName.toLowerCase();
  
  // High-fidelity fallback dictionary mapping names to precise industries, country-level geographies, and peers
  const COMPANY_DICTIONARY: Record<string, Omit<CompanyInfo, "name">> = {
    "astrazeneca": {
      industry: "Pharmaceuticals",
      geographies: ["United Kingdom", "Sweden", "United States", "Germany"],
      peers: ["GSK", "Pfizer", "Novartis", "Roche", "Sanofi"]
    },
    "apple": {
      industry: "Technology & Telecom",
      geographies: ["United States", "China", "Taiwan", "Ireland"],
      peers: ["Microsoft", "Google", "Samsung", "Sony"]
    },
    "microsoft": {
      industry: "Technology & Telecom",
      geographies: ["United States", "United Kingdom", "Germany", "Ireland"],
      peers: ["Apple", "Google", "Amazon", "Oracle"]
    },
    "google": {
      industry: "Technology & Telecom",
      geographies: ["United States", "United Kingdom", "Germany", "Ireland"],
      peers: ["Microsoft", "Apple", "Amazon", "Meta"]
    },
    "alphabet": {
      industry: "Technology & Telecom",
      geographies: ["United States", "United Kingdom", "Germany", "Ireland"],
      peers: ["Microsoft", "Apple", "Amazon", "Meta"]
    },
    "meta": {
      industry: "Technology & Telecom",
      geographies: ["United States", "United Kingdom", "Germany", "Ireland"],
      peers: ["Google", "ByteDance", "Snap", "Apple"]
    },
    "amazon": {
      industry: "Retail & E-commerce",
      geographies: ["United States", "United Kingdom", "Germany", "Japan"],
      peers: ["Walmart", "Target", "eBay", "Alibaba"]
    },
    "jpmorgan": {
      industry: "Banking & Financial Services",
      geographies: ["United States", "United Kingdom", "Japan", "Singapore"],
      peers: ["Bank of America", "Citigroup", "Goldman Sachs", "Morgan Stanley"]
    },
    "goldman sachs": {
      industry: "Banking & Financial Services",
      geographies: ["United States", "United Kingdom", "Japan", "Singapore"],
      peers: ["Morgan Stanley", "JPMorgan Chase", "Citigroup", "Barclays"]
    },
    "aramco": {
      industry: "Integrated Energy",
      geographies: ["Saudi Arabia", "United States", "China", "Japan"],
      peers: ["Shell", "ExxonMobil", "Chevron", "BP"]
    },
    "shell": {
      industry: "Integrated Energy",
      geographies: ["United Kingdom", "Netherlands", "United States", "Singapore"],
      peers: ["Saudi Aramco", "ExxonMobil", "BP", "Chevron"]
    },
    "exxon": {
      industry: "Integrated Energy",
      geographies: ["United States", "United Kingdom", "Singapore", "Japan"],
      peers: ["Chevron", "Shell", "BP", "Saudi Aramco"]
    },
    "bp plc": {
      industry: "Integrated Energy",
      geographies: ["United Kingdom", "United States", "Germany"],
      peers: ["Shell", "ExxonMobil", "Chevron", "Saudi Aramco"]
    },
    "bp p.l.c.": {
      industry: "Integrated Energy",
      geographies: ["United Kingdom", "United States", "Germany"],
      peers: ["Shell", "ExxonMobil", "Chevron", "Saudi Aramco"]
    },
    "unilever": {
      industry: "Consumer Health & FMCG",
      geographies: ["United Kingdom", "Netherlands", "United States", "India"],
      peers: ["Nestlé", "Procter & Gamble", "Reckitt", "Danone"]
    },
    "nestle": {
      industry: "Consumer Health & FMCG",
      geographies: ["Switzerland", "United States", "France", "Germany"],
      peers: ["Unilever", "Procter & Gamble", "Danone", "Mondelēz"]
    },
    "nestlé": {
      industry: "Consumer Health & FMCG",
      geographies: ["Switzerland", "United States", "France", "Germany"],
      peers: ["Unilever", "Procter & Gamble", "Danone", "Mondelēz"]
    },
    "novartis": {
      industry: "Pharmaceuticals",
      geographies: ["Switzerland", "United States", "Germany", "Japan"],
      peers: ["Roche", "Pfizer", "Merck", "AstraZeneca"]
    },
    "brightwell": {
      industry: "Consumer Health & FMCG",
      geographies: ["United Kingdom", "United States", "Germany"],
      peers: ["Reckitt", "Haleon", "Unilever"]
    },
    "caldera": {
      industry: "Integrated Energy",
      geographies: ["United Kingdom", "Norway"],
      peers: ["BP", "Shell", "TotalEnergies"]
    },
    "northwind": {
      industry: "Transport & Logistics",
      geographies: ["United Kingdom", "Germany", "France"],
      peers: ["DHL", "FedEx", "DSV"]
    },
    "veridian": {
      industry: "Pharmaceuticals",
      geographies: ["United Kingdom", "United States"],
      peers: ["GSK", "AstraZeneca", "Pfizer"]
    },
    "aboukir": {
      industry: "Diversified Industrials",
      geographies: ["United Kingdom", "Egypt"],
      peers: ["Siemens", "General Electric", "Honeywell"]
    },
    "lvmh": {
      industry: "Consumer Health & FMCG",
      geographies: ["France", "United States", "Italy", "Japan"],
      peers: ["Kering", "Richemont", "Hermès", "Chanel"]
    },
    "toyota": {
      industry: "Automotive & Manufacturing",
      geographies: ["Japan", "United States", "China", "Germany"],
      peers: ["Volkswagen", "Ford", "General Motors", "Honda"]
    },
    "volkswagen": {
      industry: "Automotive & Manufacturing",
      geographies: ["Germany", "China", "United States", "Brazil"],
      peers: ["Toyota", "Ford", "Stellantis", "BMW"]
    },
    "siemens": {
      industry: "Diversified Industrials",
      geographies: ["Germany", "United States", "China", "India"],
      peers: ["General Electric", "ABB", "Schneider Electric", "Honeywell"]
    },
    "gsk": {
      industry: "Pharmaceuticals",
      geographies: ["United Kingdom", "United States", "Belgium", "Germany"],
      peers: ["AstraZeneca", "Pfizer", "Sanofi", "Novartis"]
    },
    "glaxosmithkline": {
      industry: "Pharmaceuticals",
      geographies: ["United Kingdom", "United States", "Belgium", "Germany"],
      peers: ["AstraZeneca", "Pfizer", "Sanofi", "Novartis"]
    },
    "barclays": {
      industry: "Banking & Financial Services",
      geographies: ["United Kingdom", "United States", "Singapore", "Japan"],
      peers: ["HSBC", "Lloyds", "NatWest", "Standard Chartered"]
    },
    "hsbc": {
      industry: "Banking & Financial Services",
      geographies: ["United Kingdom", "Hong Kong", "United States", "Singapore"],
      peers: ["Citigroup", "Standard Chartered", "Barclays", "BNP Paribas"]
    },
    "tesco": {
      industry: "Consumer Health & FMCG",
      geographies: ["United Kingdom", "Ireland"],
      peers: ["Sainsbury's", "Asda", "Morrisons", "Aldi"]
    }
  };

  // 1. Try to find match in local dictionary first (covers standard cases instantly and accurately)
  const dictKey = Object.keys(COMPANY_DICTIONARY).find(k => normName.includes(k));
  let defaultPayload: CompanyInfo;

  if (dictKey) {
    const dictValue = COMPANY_DICTIONARY[dictKey];
    defaultPayload = {
      name: companyName,
      ...dictValue
    };
  } else {
    // Determine default industry based on Wikidata description keywords
    let detectedIndustry = "Consumer Health & FMCG";
    let detectedPeers = ["Competitor A", "Competitor B", "Competitor C"];
    const descText = (description || "").toLowerCase();

    if (descText.includes("bank") || descText.includes("financ") || descText.includes("insurance") || descText.includes("investment")) {
      detectedIndustry = "Banking & Financial Services";
      detectedPeers = ["JPMorgan Chase", "HSBC", "Goldman Sachs", "Bank of America"];
    } else if (descText.includes("pharma") || descText.includes("drug") || descText.includes("biotech") || descText.includes("medical") || descText.includes("health")) {
      detectedIndustry = "Pharmaceuticals";
      detectedPeers = ["AstraZeneca", "GSK", "Pfizer", "Novartis", "Roche"];
    } else if (descText.includes("oil") || descText.includes("gas") || descText.includes("petroleum") || descText.includes("energy") || descText.includes("power")) {
      detectedIndustry = "Integrated Energy";
      detectedPeers = ["Shell", "ExxonMobil", "Chevron", "BP", "Saudi Aramco"];
    } else if (descText.includes("logistic") || descText.includes("shipping") || descText.includes("transport") || descText.includes("delivery") || descText.includes("cargo")) {
      detectedIndustry = "Transport & Logistics";
      detectedPeers = ["DHL", "FedEx", "DSV", "UPS", "Maersk"];
    } else if (descText.includes("manufactur") || descText.includes("industrial") || descText.includes("steel") || descText.includes("machinery") || descText.includes("engine")) {
      detectedIndustry = "Diversified Industrials";
      detectedPeers = ["Siemens", "General Electric", "ABB", "Honeywell"];
    } else if (descText.includes("software") || descText.includes("tech") || descText.includes("internet") || descText.includes("comput") || descText.includes("digital")) {
      detectedIndustry = "Technology & Telecom";
      detectedPeers = ["Microsoft", "Google", "Apple", "Meta", "Amazon"];
    } else if (descText.includes("retail") || descText.includes("shop") || descText.includes("commerce") || descText.includes("store") || descText.includes("supermarket")) {
      detectedIndustry = "Retail & E-commerce";
      detectedPeers = ["Amazon", "Walmart", "Target", "Costco", "Alibaba"];
    } else if (descText.includes("car") || descText.includes("automotive") || descText.includes("vehicle") || descText.includes("motor")) {
      detectedIndustry = "Automotive & Manufacturing";
      detectedPeers = ["Toyota", "Volkswagen", "Ford", "General Motors", "Honda"];
    }

    // Try to extract country from description
    const geographies: string[] = [];
    if (descText.includes("american") || descText.includes("u.s.") || descText.includes("united states")) {
      geographies.push("United States");
    }
    if (descText.includes("british") || descText.includes("u.k.") || descText.includes("united kingdom")) {
      geographies.push("United Kingdom");
    }
    if (descText.includes("german") || descText.includes("germany")) {
      geographies.push("Germany");
    }
    if (descText.includes("french") || descText.includes("france")) {
      geographies.push("France");
    }
    if (descText.includes("swiss") || descText.includes("switzerland")) {
      geographies.push("Switzerland");
    }
    if (descText.includes("japanese") || descText.includes("japan")) {
      geographies.push("Japan");
    }
    if (descText.includes("chinese") || descText.includes("china")) {
      geographies.push("China");
    }
    if (descText.includes("swedish") || descText.includes("sweden")) {
      geographies.push("Sweden");
    }

    if (geographies.length === 0) {
      geographies.push("United States", "United Kingdom");
    }

    defaultPayload = {
      name: companyName,
      industry: detectedIndustry,
      geographies,
      peers: detectedPeers,
    };
  }

  // 2. Tavily Search for background context
  let context = "";
  try {
    const query = `"${companyName}" corporate headquarters industry main competitors`;
    const searchResults = await searchWeb(query);
    if (searchResults && searchResults.length > 0) {
      context = searchResults.map(r => `Title: ${r.title}\nContent: ${r.content}`).join("\n\n");
    }
  } catch (err) {
    console.error("Error during company info search:", err);
  }

  if (!genAI) {
    console.warn("Gemini AI API Key not configured. Returning custom/dictionary default company details.");
    return defaultPayload;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      Retrieve the corporate profile details for: "${companyName}".
      Use the following search context if available:
      ${context}

      Extract the following information:
      1. Industry Classification: Map to exactly one of the standard classifications below:
         - "Consumer Health & FMCG"
         - "Banking & Financial Services"
         - "Integrated Energy"
         - "Transport & Logistics"
         - "Pharmaceuticals"
         - "Diversified Industrials"
         - "Technology & Telecom"
         - "Retail & E-commerce"
         - "Automotive & Manufacturing"
         - If it doesn't fit any of the above, map it to a similar high-level clean industry name.
      2. Primary Geographies: List of 2 to 4 major countries of operation (e.g. ["United States", "United Kingdom", "Germany", "Japan"]). AVOID broad regional codes like "EU" or "Asia" — specify actual countries.
      3. Peer Benchmark Group: List of 3 to 5 top direct competitor company names (do not use generic terms like "Competitor A").

      Format the response strictly as a JSON object matching this structure:
      {
        "name": "${companyName}",
        "industry": "Industry classification",
        "geographies": ["Geographies"],
        "peers": ["Competitors"]
      }
    `;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    const cleanJson = JSON.parse(responseText.trim());
    return {
      name: cleanJson.name || companyName,
      industry: cleanJson.industry || defaultPayload.industry,
      geographies: Array.isArray(cleanJson.geographies) ? cleanJson.geographies : defaultPayload.geographies,
      peers: Array.isArray(cleanJson.peers) ? cleanJson.peers : defaultPayload.peers,
    };
  } catch (error) {
    console.error("Error getting company info with Gemini:", error);
    return defaultPayload;
  }
}
