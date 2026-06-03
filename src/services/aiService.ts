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
export async function searchWeb(query: string, timeRange?: string, topic: "general" | "news" = "general"): Promise<any[]> {
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
        topic: topic,
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
    const lowercase = text.toLowerCase();
    const bias = [0, 0, 0, 0, 0, 0];
    
    // Categorize using key phrases to build domain bias
    if (lowercase.includes("geopol") || lowercase.includes("tariff") || lowercase.includes("sanction") || lowercase.includes("border") || lowercase.includes("national security") || lowercase.includes("polic") || lowercase.includes("suez") || lowercase.includes("panama") || lowercase.includes("war ") || lowercase.includes("conflict")) {
      bias[0] = 1.0;
    }
    if (lowercase.includes("regul") || lowercase.includes("complian") || lowercase.includes("law") || lowercase.includes("act") || lowercase.includes("commission") || lowercase.includes("standard") || lowercase.includes("audit") || lowercase.includes("legal") || lowercase.includes("court") || lowercase.includes("non-compliance") || lowercase.includes("approval") || lowercase.includes("trial") || lowercase.includes("patent")) {
      bias[1] = 1.0;
    }
    if (lowercase.includes("techno") || lowercase.includes("ai") || lowercase.includes("cyber") || lowercase.includes("hack") || lowercase.includes("software") || lowercase.includes("server") || lowercase.includes("ransomware") || lowercase.includes("digital") || lowercase.includes("gpu") || lowercase.includes("data center") || lowercase.includes("ciso") || lowercase.includes("information security")) {
      bias[2] = 1.0;
    }
    if (lowercase.includes("supply") || lowercase.includes("logist") || lowercase.includes("ship") || lowercase.includes("deliver") || lowercase.includes("cargo") || lowercase.includes("port") || lowercase.includes("warehouse") || lowercase.includes("procure") || lowercase.includes("transit") || lowercase.includes("route") || lowercase.includes("bottleneck") || lowercase.includes("truck")) {
      bias[3] = 1.0;
    }
    if (lowercase.includes("climate") || lowercase.includes("water") || lowercase.includes("carbon") || lowercase.includes("environment") || lowercase.includes("nature") || lowercase.includes("sustainab") || lowercase.includes("drought") || lowercase.includes("flood") || lowercase.includes("emiss") || lowercase.includes("deforest") || lowercase.includes("waste")) {
      bias[4] = 1.0;
    }
    if (lowercase.includes("financial") || lowercase.includes("inflation") || lowercase.includes("interest") || lowercase.includes("budget") || lowercase.includes("market") || lowercase.includes("cost") || lowercase.includes("revenue") || lowercase.includes("rate") || lowercase.includes("margin") || lowercase.includes("commodity") || lowercase.includes("price") || lowercase.includes("squeeze")) {
      bias[5] = 1.0;
    }

    // Seeded deterministic random generation
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    let seed = Math.abs(hash) || 7;

    const mockEmbedding = Array.from({ length: 1536 }, (_, idx) => {
      if (idx < 6) {
        return bias[idx] * 2.5; // Amplify domain bias coordinate
      }
      seed = (seed * 9301 + 49297) % 233280;
      return (seed / 233280) - 0.5; // Noise between -0.5 and 0.5
    });

    const magnitude = Math.sqrt(mockEmbedding.reduce((sum, val) => sum + val * val, 0));
    return mockEmbedding.map(val => val / (magnitude || 1));
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
      industry: "Life Sciences & Healthcare",
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
      industry: "Consumer & FMCG",
      geographies: ["United Kingdom", "Netherlands", "United States", "India"],
      peers: ["Nestlé", "Procter & Gamble", "Reckitt", "Danone"]
    },
    "nestle": {
      industry: "Consumer & FMCG",
      geographies: ["Switzerland", "United States", "France", "Germany"],
      peers: ["Unilever", "Procter & Gamble", "Danone", "Mondelēz"]
    },
    "nestlé": {
      industry: "Consumer & FMCG",
      geographies: ["Switzerland", "United States", "France", "Germany"],
      peers: ["Unilever", "Procter & Gamble", "Danone", "Mondelēz"]
    },
    "novartis": {
      industry: "Life Sciences & Healthcare",
      geographies: ["Switzerland", "United States", "Germany", "Japan"],
      peers: ["Roche", "Pfizer", "Merck", "AstraZeneca"]
    },
    "brightwell": {
      industry: "Consumer & FMCG",
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
      industry: "Life Sciences & Healthcare",
      geographies: ["United Kingdom", "United States"],
      peers: ["GSK", "AstraZeneca", "Pfizer"]
    },
    "aboukir": {
      industry: "Diversified Industrials",
      geographies: ["United Kingdom", "Egypt"],
      peers: ["Siemens", "General Electric", "Honeywell"]
    },
    "lvmh": {
      industry: "Consumer & FMCG",
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
      industry: "Life Sciences & Healthcare",
      geographies: ["United Kingdom", "United States", "Belgium", "Germany"],
      peers: ["AstraZeneca", "Pfizer", "Sanofi", "Novartis"]
    },
    "glaxosmithkline": {
      industry: "Life Sciences & Healthcare",
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
      industry: "Consumer & FMCG",
      geographies: ["United Kingdom", "Ireland"],
      peers: ["Sainsbury's", "Asda", "Morrisons", "Aldi"]
    },
    "mondelez": {
      industry: "Consumer & FMCG",
      geographies: ["United States", "Switzerland", "United Kingdom", "Canada"],
      peers: ["Nestlé", "PepsiCo", "The Hershey Company", "Mars", "Unilever"]
    },
    "pepsico": {
      industry: "Consumer & FMCG",
      geographies: ["United States", "United Kingdom", "Mexico", "Canada"],
      peers: ["Coca-Cola", "Keurig Dr Pepper", "Nestlé", "Mondelez International"]
    },
    "coca-cola": {
      industry: "Consumer & FMCG",
      geographies: ["United States", "United Kingdom", "Germany", "Mexico"],
      peers: ["PepsiCo", "Keurig Dr Pepper", "Nestlé", "Danone"]
    },
    "nike": {
      industry: "Consumer & FMCG",
      geographies: ["United States", "China", "Vietnam", "Netherlands"],
      peers: ["Adidas", "Puma", "Under Armour", "Lululemon"]
    },
    "adidas": {
      industry: "Consumer & FMCG",
      geographies: ["Germany", "United States", "China", "Vietnam"],
      peers: ["Nike", "Puma", "Under Armour", "Lululemon"]
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
    let detectedIndustry = "Consumer & FMCG";
    let detectedPeers = ["Nestlé", "Unilever", "Procter & Gamble", "Danone"];
    const descText = (description || "").toLowerCase();

    if (descText.includes("bank") || descText.includes("financ") || descText.includes("insurance") || descText.includes("investment")) {
      detectedIndustry = "Banking & Financial Services";
      detectedPeers = ["JPMorgan Chase", "HSBC", "Goldman Sachs", "Bank of America"];
    } else if (descText.includes("consulting") || descText.includes("advisory") || descText.includes("audit") || descText.includes("accounting") || descText.includes("professional services") || descText.includes("law firm")) {
      detectedIndustry = "Professional Services";
      detectedPeers = ["Accenture", "Deloitte", "PwC", "EY", "KPMG", "McKinsey", "Boston Consulting Group"];
    } else if (descText.includes("media") || descText.includes("entertainment") || descText.includes("streaming") || descText.includes("movie") || descText.includes("film") || descText.includes("music") || descText.includes("television")) {
      detectedIndustry = "Media & Entertainment";
      detectedPeers = ["The Walt Disney Company", "Netflix", "Warner Bros. Discovery", "Paramount Global", "Sony Pictures"];
    } else if (descText.includes("pharma") || descText.includes("drug") || descText.includes("biotech") || descText.includes("medical") || descText.includes("health")) {
      detectedIndustry = "Life Sciences & Healthcare";
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
         - "Consumer & FMCG"
         - "Banking & Financial Services"
         - "Integrated Energy"
         - "Transport & Logistics"
         - "Life Sciences & Healthcare"
         - "Diversified Industrials"
         - "Technology & Telecom"
         - "Retail & E-commerce"
         - "Automotive & Manufacturing"
         - "Professional Services"
         - "Media & Entertainment"
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

export interface RiskTemplate {
  code: string;
  title: string;
  category: string;
  ownerRole: string;
  ownerName: string;
  inherentRating: string;
  controlEffectiveness: string;
  residualRating: string;
  appetiteStatus: string;
  score: number;
  trendDirection: string;
  trendValue: number;
  horizon: string;
  isPrincipal: boolean;
  peerGap: boolean;
}

export const INDUSTRY_RISK_TEMPLATES: Record<string, Omit<RiskTemplate, "lastReviewedAt" | "nextReviewAt">[]> = {
  "Consumer & FMCG": [
    { code: "RR-01", title: "Regulatory Non-Compliance (EUDR & CSRD)", category: "Regulatory", ownerRole: "Chief Risk Officer", ownerName: "S. Rahman", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.8, trendDirection: "Up", trendValue: 1.4, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-02", title: "Generative AI Systems Governance Gaps", category: "Technology & AI", ownerRole: "Chief Technology Officer", ownerName: "M. Chen", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.5, trendDirection: "Up", trendValue: 1.8, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-03", title: "Suez/Rotterdam Shipping Lane Bottlenecks", category: "Geopolitical", ownerRole: "Head of Global Supply Chain", ownerName: "V. Dupont", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.9, trendDirection: "Stable", trendValue: 0.0, horizon: "med", isPrincipal: true, peerGap: false },
    { code: "RR-04", title: "Resource Supply Scarcity (Cocoa, Oil Palm)", category: "Supply chain", ownerRole: "Director of Procurement", ownerName: "J. Kovacs", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.2, trendDirection: "Up", trendValue: 0.5, horizon: "med", isPrincipal: false, peerGap: true },
    { code: "RR-05", title: "Southern European Water Scarcity Risks", category: "Climate & nature", ownerRole: "Head of Environmental Sustainability", ownerName: "A. Lindstrom", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Low", appetiteStatus: "Within", score: 6.3, trendDirection: "Stable", trendValue: 0.0, horizon: "long", isPrincipal: true, peerGap: true },
    { code: "RR-06", title: "Global Inflationary Commodity Margin Squeeze", category: "Financial & macro", ownerRole: "Chief Financial Officer", ownerName: "K. Patel", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 5.7, trendDirection: "Down", trendValue: -0.6, horizon: "med", isPrincipal: false, peerGap: false }
  ],
  "Banking & Financial Services": [
    { code: "RR-01", title: "ESG Disclosures & SFDR Regulatory Compliance", category: "Regulatory", ownerRole: "Chief Compliance Officer", ownerName: "E. Jenkins", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.2, trendDirection: "Up", trendValue: 0.4, horizon: "near", isPrincipal: true, peerGap: false },
    { code: "RR-02", title: "Ransomware & Core Banking Cyber Disruption", category: "Technology & AI", ownerRole: "Chief Information Security Officer", ownerName: "A. Vance", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.4, trendDirection: "Up", trendValue: 1.2, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-03", title: "Cross-Border Sanctions & Asset Freezing Mandates", category: "Geopolitical", ownerRole: "Head of Financial Crime Compliance", ownerName: "L. Zhang", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.5, trendDirection: "Stable", trendValue: 0.0, horizon: "near", isPrincipal: true, peerGap: false },
    { code: "RR-04", title: "Third-Party Cloud Hosting Concentration Risks", category: "Supply chain", ownerRole: "Head of Vendor Risk Management", ownerName: "M. Albright", inherentRating: "Medium", controlEffectiveness: "Partial", residualRating: "Medium", appetiteStatus: "At tolerance", score: 6.8, trendDirection: "Up", trendValue: 0.5, horizon: "med", isPrincipal: false, peerGap: true },
    { code: "RR-05", title: "Climate Stress-Testing & Fossil Loan Exposure", category: "Climate & nature", ownerRole: "Head of Sustainable Finance", ownerName: "H. Giraud", inherentRating: "High", controlEffectiveness: "Limited", residualRating: "High", appetiteStatus: "Breach", score: 8.1, trendDirection: "Up", trendValue: 1.5, horizon: "long", isPrincipal: true, peerGap: true },
    { code: "RR-06", title: "Interest Rate Spikes & Liquidity Mismatch", category: "Financial & macro", ownerRole: "Chief Financial Officer", ownerName: "R. Mehta", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 5.9, trendDirection: "Down", trendValue: -0.8, horizon: "med", isPrincipal: true, peerGap: false }
  ],
  "Technology & Telecom": [
    { code: "RR-01", title: "EU AI Act Transparency & Model Compliance", category: "Regulatory", ownerRole: "VP of Regulatory Affairs", ownerName: "C. Fletcher", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.6, trendDirection: "Up", trendValue: 1.5, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-02", title: "Data Center Outages & API Infrastructure Failure", category: "Technology & AI", ownerRole: "Chief Technology Officer", ownerName: "S. Wozniak", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.4, trendDirection: "Stable", trendValue: 0.0, horizon: "near", isPrincipal: true, peerGap: false },
    { code: "RR-03", title: "US-China Semiconductor Export Restrictions", category: "Geopolitical", ownerRole: "Head of Government Relations", ownerName: "K. Tanaka", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.9, trendDirection: "Up", trendValue: 1.7, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-04", title: "GPU Chip Supply Bottlenecks & Hardware Shortage", category: "Supply chain", ownerRole: "Director of Global Sourcing", ownerName: "L. de Souza", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.8, trendDirection: "Up", trendValue: 0.8, horizon: "med", isPrincipal: false, peerGap: true },
    { code: "RR-05", title: "Server Site Power Grid Overloads & Water-Cooling", category: "Climate & nature", ownerRole: "Director of Sustainability", ownerName: "O. Nielsen", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Low", appetiteStatus: "Within", score: 5.5, trendDirection: "Stable", trendValue: 0.0, horizon: "long", isPrincipal: false, peerGap: false },
    { code: "RR-06", title: "AI Infrastructure Over-Investment vs Yield Squeeze", category: "Financial & macro", ownerRole: "Chief Financial Officer", ownerName: "P. Croft", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.2, trendDirection: "Up", trendValue: 0.9, horizon: "med", isPrincipal: true, peerGap: true }
  ],
  "Life Sciences & Healthcare": [
    { code: "RR-01", title: "Drug Approval Delays & Patent Cliff Compliance", category: "Regulatory", ownerRole: "Head of Regulatory Science", ownerName: "Dr. A. Carter", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.8, trendDirection: "Stable", trendValue: 0.0, horizon: "med", isPrincipal: true, peerGap: false },
    { code: "RR-02", title: "AI Drug Discovery IP Theft & Lab Leaks", category: "Technology & AI", ownerRole: "Chief Digital Officer", ownerName: "P. Tremblay", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.3, trendDirection: "Up", trendValue: 1.1, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-03", title: "Critical API Export Blockades & Trade Tariffs", category: "Geopolitical", ownerRole: "Head of Trade & Supply Compliance", ownerName: "M. Al-Mutawa", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.7, trendDirection: "Up", trendValue: 1.6, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-04", title: "Cold-Chain Logistics Bottlenecks & Raw Ingredient", category: "Supply chain", ownerRole: "VP of Global Supply Chain", ownerName: "F. Bianchi", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.1, trendDirection: "Up", trendValue: 0.4, horizon: "med", isPrincipal: false, peerGap: false },
    { code: "RR-05", title: "Chemical Effluent Regulations & Water Discharges", category: "Climate & nature", ownerRole: "Director of Environmental Health", ownerName: "J. Hansen", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Low", appetiteStatus: "Within", score: 5.9, trendDirection: "Stable", trendValue: 0.0, horizon: "long", isPrincipal: false, peerGap: true },
    { code: "RR-06", title: "Drug Price Cap Controls & Medicare Cap Impact", category: "Financial & macro", ownerRole: "VP of Commercial Finance", ownerName: "S. O'Connor", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.4, trendDirection: "Up", trendValue: 0.7, horizon: "near", isPrincipal: true, peerGap: true }
  ],
  "Integrated Energy": [
    { code: "RR-01", title: "Transition Regulations & Carbon Tax Liabilities", category: "Regulatory", ownerRole: "VP of Climate Strategy", ownerName: "K. Lindqvist", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.5, trendDirection: "Up", trendValue: 1.3, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-02", title: "SCADA/ICS Industrial System Cyber Vulnerability", category: "Technology & AI", ownerRole: "Chief Security Officer", ownerName: "J. Rinaldi", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.7, trendDirection: "Stable", trendValue: 0.0, horizon: "near", isPrincipal: true, peerGap: false },
    { code: "RR-03", title: "Strait of Hormuz Shipping Lane Blockades", category: "Geopolitical", ownerRole: "Director of Global Trade Security", ownerName: "A. Gromyko", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.8, trendDirection: "Up", trendValue: 1.5, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-04", title: "Deepwater Drilling Rig Scarcity & Sourcing Delay", category: "Supply chain", ownerRole: "Head of Offshore Procurement", ownerName: "B. Mikkelsen", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.0, trendDirection: "Up", trendValue: 0.3, horizon: "med", isPrincipal: false, peerGap: false },
    { code: "RR-05", title: "Stranded Oil & Gas Reserves under Net-Zero 2050", category: "Climate & nature", ownerRole: "Head of ESG Risk", ownerName: "F. Dubois", inherentRating: "High", controlEffectiveness: "Limited", residualRating: "High", appetiteStatus: "Breach", score: 8.2, trendDirection: "Up", trendValue: 1.1, horizon: "long", isPrincipal: true, peerGap: true },
    { code: "RR-06", title: "Crude Oil Price Volatility & Green Finance Cost", category: "Financial & macro", ownerRole: "Chief Financial Officer", ownerName: "M. Ross", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.1, trendDirection: "Down", trendValue: -0.9, horizon: "med", isPrincipal: false, peerGap: false }
  ],
  "Transport & Logistics": [
    { code: "RR-01", title: "IMO Carbon Offset Tariffs & Decarbonization Mandates", category: "Regulatory", ownerRole: "Head of Regulatory & Policy", ownerName: "J. van der Berg", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.5, trendDirection: "Up", trendValue: 0.4, horizon: "med", isPrincipal: true, peerGap: false },
    { code: "RR-02", title: "Autonomous Routing Network API Failures & Hacks", category: "Technology & AI", ownerRole: "Chief Technology Officer", ownerName: "D. Miller", inherentRating: "Medium", controlEffectiveness: "Partial", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.2, trendDirection: "Up", trendValue: 0.8, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-03", title: "Panama & Suez Canal Blockages & Re-routing Frictions", category: "Geopolitical", ownerRole: "Chief Operating Officer", ownerName: "L. Sterling", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.6, trendDirection: "Up", trendValue: 1.4, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-04", title: "Port Warehouse Capacity Crunches & Cargo Backlogs", category: "Supply chain", ownerRole: "VP of Global Operations", ownerName: "T. Takahashi", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.7, trendDirection: "Up", trendValue: 0.6, horizon: "med", isPrincipal: false, peerGap: true },
    { code: "RR-05", title: "Extreme Flooding Damaging Coastal Port Facilities", category: "Climate & nature", ownerRole: "Director of Infrastructure Resilience", ownerName: "M. Kowalski", inherentRating: "High", controlEffectiveness: "Limited", residualRating: "High", appetiteStatus: "Breach", score: 8.3, trendDirection: "Up", trendValue: 1.2, horizon: "long", isPrincipal: true, peerGap: true },
    { code: "RR-06", title: "Fuel Price Spikes & Container Rate Volatility", category: "Financial & macro", ownerRole: "VP of Commercial Finance", ownerName: "C. Campbell", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 5.8, trendDirection: "Down", trendValue: -0.7, horizon: "med", isPrincipal: false, peerGap: false }
  ],
  "Diversified Industrials": [
    { code: "RR-01", title: "Supply Chain Due Diligence Act (CSDDD) Penalties", category: "Regulatory", ownerRole: "Chief Compliance Officer", ownerName: "A. Schmidt", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.4, trendDirection: "Up", trendValue: 1.2, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-02", title: "SCADA Industrial Networks Ransomware Disruptions", category: "Technology & AI", ownerRole: "Chief Information Officer", ownerName: "R. Davies", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.6, trendDirection: "Stable", trendValue: 0.0, horizon: "near", isPrincipal: true, peerGap: false },
    { code: "RR-03", title: "Steel & Aluminium Trade Tariffs & Protectionism", category: "Geopolitical", ownerRole: "Head of Government & Trade Relations", ownerName: "Y. Sato", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.7, trendDirection: "Up", trendValue: 1.4, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-04", title: "Critical Mineral Sourcing Delays (Cobalt, Lithium)", category: "Supply chain", ownerRole: "VP of Strategic Procurement", ownerName: "J. Ramos", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.5, trendDirection: "Up", trendValue: 0.6, horizon: "med", isPrincipal: false, peerGap: true },
    { code: "RR-05", title: "Manufacturing Site Drought Restrictions & Water Crunches", category: "Climate & nature", ownerRole: "Director of Environmental Compliance", ownerName: "E. Larsson", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Low", appetiteStatus: "Within", score: 6.0, trendDirection: "Stable", trendValue: 0.0, horizon: "long", isPrincipal: false, peerGap: false },
    { code: "RR-06", title: "Raw Material Inflation & Energy Squeeze margins", category: "Financial & macro", ownerRole: "Chief Financial Officer", ownerName: "M. Patel", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.2, trendDirection: "Down", trendValue: -0.5, horizon: "med", isPrincipal: true, peerGap: false }
  ],
  "Retail & E-commerce": [
    { code: "RR-01", title: "EPR Packaging Waste & Circular Economy Penalties", category: "Regulatory", ownerRole: "Head of Sustainability & Policy", ownerName: "G. Bernard", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.1, trendDirection: "Up", trendValue: 0.3, horizon: "med", isPrincipal: true, peerGap: false },
    { code: "RR-02", title: "Payment Gateway Cyber Frauds & API Network Downtime", category: "Technology & AI", ownerRole: "VP of Digital Engineering", ownerName: "K. Gupta", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.3, trendDirection: "Up", trendValue: 1.1, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-03", title: "Cross-Border Customs Tariffs & Border Restrictions", category: "Geopolitical", ownerRole: "Head of International Trade", ownerName: "S. Ocampo", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.5, trendDirection: "Up", trendValue: 1.3, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-04", title: "Warehouse Labor Crunches & Last-Mile Delays", category: "Supply chain", ownerRole: "VP of Fulfillment & Logistics", ownerName: "M. Taylor", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.0, trendDirection: "Up", trendValue: 0.4, horizon: "med", isPrincipal: false, peerGap: false },
    { code: "RR-05", title: "Scope 3 Carbon Tracking Mandates for Suppliers", category: "Climate & nature", ownerRole: "Director of ESG Compliance", ownerName: "A. de Vries", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Low", appetiteStatus: "Within", score: 5.8, trendDirection: "Stable", trendValue: 0.0, horizon: "long", isPrincipal: false, peerGap: true },
    { code: "RR-06", title: "Consumer Purchasing Power Decline & Margin Squeeze", category: "Financial & macro", ownerRole: "VP of Corporate Finance", ownerName: "D. Cooper", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.3, trendDirection: "Up", trendValue: 0.8, horizon: "near", isPrincipal: true, peerGap: true }
  ],
  "Automotive & Manufacturing": [
    { code: "RR-01", title: "Fleet CO2 Emission Mandates & EV Shift Penalties", category: "Regulatory", ownerRole: "Director of Government & Policy", ownerName: "M. Weber", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.6, trendDirection: "Up", trendValue: 1.4, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-02", title: "Connected Vehicle OTA (Over-the-Air) Hack Vulnerability", category: "Technology & AI", ownerRole: "Chief Cyber Security Architect", ownerName: "F. Wagner", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.8, trendDirection: "Stable", trendValue: 0.0, horizon: "near", isPrincipal: true, peerGap: false },
    { code: "RR-03", title: "Rare Earth Supply Designations & Sino-US Trade Tariffs", category: "Geopolitical", ownerRole: "Head of Sourcing Risk", ownerName: "T. Nguyen", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.8, trendDirection: "Up", trendValue: 1.6, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-04", title: "Battery Cell & Semiconductor OEM Supply Blockades", category: "Supply chain", ownerRole: "Director of Logistics & Operations", ownerName: "P. Santos", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.2, trendDirection: "Up", trendValue: 0.5, horizon: "med", isPrincipal: false, peerGap: false },
    { code: "RR-05", title: "Plant Hydropower Outages & Casting Site Water Scarcity", category: "Climate & nature", ownerRole: "Director of Environmental Strategy", ownerName: "S. Nilsson", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Low", appetiteStatus: "Within", score: 6.2, trendDirection: "Stable", trendValue: 0.0, horizon: "long", isPrincipal: false, peerGap: true },
    { code: "RR-06", title: "High Capital Cost of EV Re-tooling & Metal Prices", category: "Financial & macro", ownerRole: "Chief Financial Officer", ownerName: "G. Rossi", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.5, trendDirection: "Up", trendValue: 0.9, horizon: "med", isPrincipal: true, peerGap: true }
  ],
  "Professional Services": [
    { code: "RR-01", title: "Auditing & Advisory Independence Compliance (SEC/PCAOB rules)", category: "Regulatory", ownerRole: "Chief Compliance Officer", ownerName: "E. Jenkins", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.5, trendDirection: "Stable", trendValue: 0.0, horizon: "near", isPrincipal: true, peerGap: false },
    { code: "RR-02", title: "Proprietary GenAI Model Leakage & Client Data Breach", category: "Technology & AI", ownerRole: "Chief Technology Officer", ownerName: "M. Chen", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.5, trendDirection: "Up", trendValue: 1.2, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-03", title: "Geopolitical Tensions Limiting Offshoring Delivery Centers", category: "Geopolitical", ownerRole: "Head of Global Operations", ownerName: "A. Carter", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.4, trendDirection: "Up", trendValue: 0.4, horizon: "med", isPrincipal: true, peerGap: true },
    { code: "RR-04", title: "Key Talent Sourcing Bottlenecks & Subcontractor Delivery Delays", category: "Supply chain", ownerRole: "Director of Procurement", ownerName: "J. Kovacs", inherentRating: "Medium", controlEffectiveness: "Partial", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.0, trendDirection: "Up", trendValue: 0.5, horizon: "near", isPrincipal: false, peerGap: true },
    { code: "RR-05", title: "Scope 3 Travel Emission Penalties & Offsetting Liabilities", category: "Climate & nature", ownerRole: "Director of ESG Strategy", ownerName: "A. Lindstrom", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Low", appetiteStatus: "Within", score: 5.8, trendDirection: "Stable", trendValue: 0.0, horizon: "long", isPrincipal: false, peerGap: false },
    { code: "RR-06", title: "Consulting Budget Cuts & Corporate Cost Reduction Margin Squeeze", category: "Financial & macro", ownerRole: "Chief Financial Officer", ownerName: "K. Patel", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.2, trendDirection: "Up", trendValue: 0.7, horizon: "near", isPrincipal: true, peerGap: true }
  ],
  "Media & Entertainment": [
    { code: "RR-01", title: "Digital Markets Act (DMA) & Copyright Licensing Compliance", category: "Regulatory", ownerRole: "VP of Legal Affairs", ownerName: "C. Fletcher", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "Within", score: 6.3, trendDirection: "Stable", trendValue: 0.0, horizon: "med", isPrincipal: true, peerGap: false },
    { code: "RR-02", title: "AI-Generated Content Copyright Disputes & Streaming Cybersecurity", category: "Technology & AI", ownerRole: "Chief Security Officer", ownerName: "J. Rinaldi", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.4, trendDirection: "Up", trendValue: 1.5, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-03", title: "Cross-Border Content Censorship & Regional Access Limits", category: "Geopolitical", ownerRole: "Head of Government Relations", ownerName: "K. Tanaka", inherentRating: "High", controlEffectiveness: "Partial", residualRating: "High", appetiteStatus: "Breach", score: 8.2, trendDirection: "Up", trendValue: 1.1, horizon: "near", isPrincipal: true, peerGap: true },
    { code: "RR-04", title: "Production Studio Strike Disruption & Distribution Supply Bottlenecks", category: "Supply chain", ownerRole: "VP of Global Supply Chain", ownerName: "F. Bianchi", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.1, trendDirection: "Up", trendValue: 0.4, horizon: "med", isPrincipal: false, peerGap: false },
    { code: "RR-05", title: "Film Set Greenhouse Gas Restrictions & Eco Production Rules", category: "Climate & nature", ownerRole: "Head of Sustainability", ownerName: "O. Nielsen", inherentRating: "Medium", controlEffectiveness: "Adequate", residualRating: "Low", appetiteStatus: "Within", score: 5.5, trendDirection: "Stable", trendValue: 0.0, horizon: "long", isPrincipal: false, peerGap: true },
    { code: "RR-06", title: "Ad-Spend Contraction & High Production Cost Capital Squeeze", category: "Financial & macro", ownerRole: "Chief Financial Officer", ownerName: "P. Croft", inherentRating: "High", controlEffectiveness: "Adequate", residualRating: "Medium", appetiteStatus: "At tolerance", score: 7.6, trendDirection: "Up", trendValue: 0.8, horizon: "near", isPrincipal: true, peerGap: true }
  ]
};

export async function fetchRisksForCompany(
  companyName: string,
  industry: string,
  geographies: string[],
  peers: string[]
): Promise<Omit<RiskTemplate, "lastReviewedAt" | "nextReviewAt">[]> {
  const defaultPayload = INDUSTRY_RISK_TEMPLATES[industry] || INDUSTRY_RISK_TEMPLATES["Consumer & FMCG"];

  if (!genAI) {
    console.warn("Gemini AI API Key not configured. Returning static fallback industry risk templates.");
    return defaultPayload;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      You are an expert enterprise risk analyst. Generate a list of exactly 6 principal risks for the following company:
      Company: "${companyName}"
      Industry: "${industry}"
      Geographies: ${JSON.stringify(geographies)}
      Peers: ${JSON.stringify(peers)}

      The 6 risks must map to the following categories (exactly one risk per category):
      1. "Regulatory"
      2. "Technology & AI"
      3. "Geopolitical"
      4. "Supply chain"
      5. "Climate & nature"
      6. "Financial & macro"

      For each risk, provide the following details:
      - code: "RR-01" to "RR-06"
      - title: A specific, realistic enterprise risk title tailored to this company and industry (e.g. EU AI Act compliance for tech, oil price volatility for energy, credit risk for banks, cold-chain logistics for pharma).
      - category: The exact category name from the list above.
      - ownerRole: A realistic executive owner role (e.g. "Chief Risk Officer", "Chief Technology Officer", "Head of Supply Chain").
      - ownerName: A realistic name of the owner (e.g. "S. Rahman", "M. Chen", "K. Patel").
      - inherentRating: "High" or "Medium" or "Low"
      - controlEffectiveness: "Adequate" or "Partial" or "Limited"
      - residualRating: "High" or "Medium" or "Low"
      - appetiteStatus: "Within" or "At tolerance" or "Breach"
      - score: A float between 0.0 and 10.0 representing the current exposure score.
      - trendDirection: "Up" or "Down" or "Stable"
      - trendValue: A float representing recent change (e.g. 0.5, -0.6, 0.0)
      - horizon: "near" or "med" or "long"
      - isPrincipal: true or false (at least 3 should be true)
      - peerGap: true or false (at least 2 should be true)

      Format the response strictly as a JSON array of 6 objects matching this structure:
      [
        {
          "code": "RR-01",
          "title": "Risk Title",
          "category": "Regulatory",
          "ownerRole": "Role",
          "ownerName": "Name",
          "inherentRating": "High",
          "controlEffectiveness": "Partial",
          "residualRating": "High",
          "appetiteStatus": "Breach",
          "score": 8.8,
          "trendDirection": "Up",
          "trendValue": 1.4,
          "horizon": "near",
          "isPrincipal": true,
          "peerGap": true
        },
        ...
      ]
    `;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    const cleanJson = JSON.parse(responseText.trim());
    
    if (Array.isArray(cleanJson) && cleanJson.length === 6) {
      return cleanJson;
    }
    return defaultPayload;
  } catch (error) {
    console.error("Error generating risks with Gemini:", error);
    return defaultPayload;
  }
}

export interface SignalRelevance {
  relevant: boolean;
  relevanceScore: number;
  rationale: string;
  linkedRiskCode: string;
}

export function isSignalRelevantMock(
  companyName: string,
  industry: string,
  geographies: string[],
  peers: string[],
  title: string,
  summary: string,
  category: string
): SignalRelevance {
  const titleLower = title.toLowerCase();
  const summaryLower = summary.toLowerCase();
  const indLower = industry.toLowerCase();
  
  // Default is not relevant
  let relevant = false;
  let score = 0;
  let rationale = "";
  let linkedRiskCode = "RR-01";

  // Check categories and keywords
  if (indLower.includes("transport") || indLower.includes("logistics")) {
    if (titleLower.includes("shipping") || titleLower.includes("canal") || titleLower.includes("suez") || titleLower.includes("panama") || titleLower.includes("port") || titleLower.includes("route") || titleLower.includes("logistics") || titleLower.includes("container") || titleLower.includes("fuel") || titleLower.includes("carbon") || titleLower.includes("emission") || titleLower.includes("transit") || titleLower.includes("truck") || titleLower.includes("freight")) {
      relevant = true;
      score = 8.2;
      linkedRiskCode = titleLower.includes("canal") || titleLower.includes("suez") || titleLower.includes("panama") ? "RR-03" : (titleLower.includes("carbon") || titleLower.includes("emission") ? "RR-01" : "RR-04");
      
      if (titleLower.includes("canal") || titleLower.includes("suez") || titleLower.includes("panama")) {
        rationale = `Geopolitical shipping lane bottlenecks directly impact global routing schedules and inventory turnover for ${companyName}'s logistics operations.`;
      } else if (titleLower.includes("carbon") || titleLower.includes("emission")) {
        rationale = `Tighter transport emission standards increase operating compliance costs and accelerate fleet modernization pressures for ${companyName}.`;
      } else {
        rationale = `Operational supply chain disruptions or port congestion directly threaten ${companyName}'s core logistics performance and customer SLA commitments.`;
      }
    }
  } else if (indLower.includes("consumer") || indLower.includes("fmcg") || indLower.includes("retail")) {
    if (titleLower.includes("deforest") || titleLower.includes("eudr") || titleLower.includes("supply chain") || titleLower.includes("cocoa") || titleLower.includes("palm") || titleLower.includes("inflation") || titleLower.includes("consumer") || titleLower.includes("waste") || titleLower.includes("package") || titleLower.includes("carbon") || titleLower.includes("water") || titleLower.includes("drought")) {
      relevant = true;
      score = 7.9;
      linkedRiskCode = titleLower.includes("deforest") || titleLower.includes("eudr") ? "RR-01" : (titleLower.includes("water") || titleLower.includes("drought") ? "RR-05" : "RR-04");
      
      if (titleLower.includes("deforest") || titleLower.includes("eudr")) {
        rationale = `Impending deforestation regulations enforce strict supplier audits and raw material trace requirements on ${companyName}'s consumer product supply chains.`;
      } else if (titleLower.includes("water") || titleLower.includes("drought")) {
        rationale = `Extreme water stress in manufacturing regions raises raw material production volatility and packaging supply chain delays for ${companyName}.`;
      } else {
        rationale = `Macro inflation and consumer demand shifts directly pressure operating margins and retail distribution channels for ${companyName}.`;
      }
    }
  } else if (indLower.includes("tech") || indLower.includes("telecom")) {
    if (titleLower.includes("ai act") || titleLower.includes("cyber") || titleLower.includes("hack") || titleLower.includes("outage") || titleLower.includes("server") || titleLower.includes("chip") || titleLower.includes("semiconductor") || titleLower.includes("gpu") || titleLower.includes("data center")) {
      relevant = true;
      score = 8.5;
      linkedRiskCode = titleLower.includes("ai act") ? "RR-01" : (titleLower.includes("cyber") || titleLower.includes("hack") || titleLower.includes("outage") ? "RR-02" : "RR-04");
      
      if (titleLower.includes("ai act")) {
        rationale = `Tightening AI safety and transparency rules directly affect model training requirements and regulatory overhead for ${companyName}.`;
      } else if (titleLower.includes("cyber") || titleLower.includes("hack") || titleLower.includes("outage")) {
        rationale = `Infrastructural disruption or data breach threats compromise customer reliability and violate SLA commitments on ${companyName}'s digital platforms.`;
      } else {
        rationale = `Hardware supply bottlenecks or chip export rules directly limit scale-out capacity and cloud infrastructure expansion for ${companyName}.`;
      }
    }
  } else if (indLower.includes("banking") || indLower.includes("financial")) {
    if (titleLower.includes("interest rate") || titleLower.includes("inflation") || titleLower.includes("liquidity") || titleLower.includes("cyber") || titleLower.includes("ranso") || titleLower.includes("esg") || titleLower.includes("disclosure") || titleLower.includes("sanction")) {
      relevant = true;
      score = 8.0;
      linkedRiskCode = titleLower.includes("cyber") || titleLower.includes("ranso") ? "RR-02" : (titleLower.includes("interest") || titleLower.includes("liquidity") ? "RR-06" : "RR-01");
      
      if (titleLower.includes("cyber") || titleLower.includes("ranso")) {
        rationale = `Systemic cyber attacks threaten secure transaction processing systems and database integrity for ${companyName}'s banking operations.`;
      } else if (titleLower.includes("interest") || titleLower.includes("liquidity")) {
        rationale = `Rate volatility and credit exposure pressure interest margins and test liquidity reserves for ${companyName}.`;
      } else {
        rationale = `Compliance with cross-border sanctions and reporting mandates increases risk management overhead and auditor oversight for ${companyName}.`;
      }
    }
  } else if (indLower.includes("life sciences") || indLower.includes("healthcare") || indLower.includes("pharmaceuticals")) {
    if (titleLower.includes("drug") || titleLower.includes("trial") || titleLower.includes("patent") || titleLower.includes("clinical") || titleLower.includes("fda") || titleLower.includes("ema") || titleLower.includes("healthcare") || titleLower.includes("medical") || titleLower.includes("cyber")) {
      relevant = true;
      score = 8.3;
      linkedRiskCode = titleLower.includes("cyber") ? "RR-02" : (titleLower.includes("drug") || titleLower.includes("trial") || titleLower.includes("clinical") ? "RR-01" : "RR-04");
      
      if (titleLower.includes("drug") || titleLower.includes("trial") || titleLower.includes("clinical")) {
        rationale = `Regulatory reviews and clinical trial requirements govern patent timelines and product pipeline approvals for ${companyName}.`;
      } else {
        rationale = `IP security and digital supply chain integrity are critical to protecting ${companyName}'s proprietary biotech models.`;
      }
    }
  }

  // General fallback relevance check
  if (!relevant) {
    // If the signal matches the industry name or has keywords
    const keywords = [companyName.toLowerCase(), ...peers.map(p => p.toLowerCase())];
    const matchesKeyword = keywords.some(k => titleLower.includes(k) || summaryLower.includes(k));
    
    if (matchesKeyword) {
      relevant = true;
      score = 7.5;
      rationale = `Direct mention of ${companyName} or its competitors highlights immediate competitive, operational, or brand impact.`;
      linkedRiskCode = "RR-06";
    }
  }

  return { relevant, relevanceScore: score, rationale, linkedRiskCode };
}

export async function evaluateSignalRelevance(
  companyName: string,
  industry: string,
  geographies: string[],
  peers: string[],
  signalTitle: string,
  signalSummary: string,
  signalCategory: string
): Promise<SignalRelevance> {
  if (!genAI) {
    return isSignalRelevantMock(companyName, industry, geographies, peers, signalTitle, signalSummary, signalCategory);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      You are an expert enterprise risk analyst. Evaluate the relevance of the following external event/news signal to the company:
      Company: "${companyName}"
      Industry: "${industry}"
      Geographies: ${JSON.stringify(geographies)}
      Peers: ${JSON.stringify(peers)}

      Signal Details:
      - Title: "${signalTitle}"
      - Summary/Content: "${signalSummary}"
      - Original Category: "${signalCategory}"

      Assess:
      1. Is this signal relevant to this company? (Set relevant to true if it impacts their operations, supply chain, regulatory environment, macroeconomics, or peer group, and false otherwise).
      2. Relevance score: A float between 0.0 and 10.0 (where 10.0 is critical direct impact and 0.0 is completely irrelevant).
      3. Rationale: A specific, custom 1-2 sentence explanation of *exactly* why this matters to "${companyName}" based on their specific industry, geographies, or peers. Avoid generic placeholders. Do NOT use generic text like "Material regulatory requirements". Connect the signal facts to the company's specific business model context.
      4. Linked Risk Code: Select the most appropriate risk code from the company's register (RR-01 to RR-06) that this signal impacts. Map it to one of:
         - "RR-01" (Regulatory)
         - "RR-02" (Technology & AI)
         - "RR-03" (Geopolitical)
         - "RR-04" (Supply chain)
         - "RR-05" (Climate & nature)
         - "RR-06" (Financial & macro)

      Format the response strictly as a JSON object matching this structure:
      {
        "relevant": true,
        "relevanceScore": 8.5,
        "rationale": "Your detailed custom rationale here",
        "linkedRiskCode": "RR-04"
      }
    `;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    const cleanJson = JSON.parse(responseText.trim());
    return {
      relevant: typeof cleanJson.relevant === "boolean" ? cleanJson.relevant : true,
      relevanceScore: typeof cleanJson.relevanceScore === "number" ? cleanJson.relevanceScore : 7.0,
      rationale: cleanJson.rationale || "Relevant regulatory event impacting operations.",
      linkedRiskCode: cleanJson.linkedRiskCode || "RR-01"
    };
  } catch (error) {
    console.error("Error evaluating signal relevance with Gemini:", error);
    return isSignalRelevantMock(companyName, industry, geographies, peers, signalTitle, signalSummary, signalCategory);
  }
}

