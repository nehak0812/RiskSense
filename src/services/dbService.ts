import { PrismaClient } from "@prisma/client";
import {
  searchWeb,
  getEmbedding,
  classifyAndEnrichSignal,
  cosineSimilarity,
  generateBoardSummary,
} from "./aiService";

// Prisma client initialization
const prisma = new PrismaClient();

export { prisma };

// Helper to seed initial global signal feed if empty
export async function seedGlobalSignalsIfEmpty() {
  const count = await prisma.signal.count();
  if (count > 0) return;

  console.log("Seeding initial global signal feed...");
  const initialSignals = [
    {
      source: "Reuters",
      url: "https://www.reuters.com/business/retail-consumer/eu-rules-deforestation-compliance-2026",
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      title: "EU deforestation rules raise compliance costs for major chocolate and palm oil buyers",
      summary: "Impending traceability requirements under EUDR force global FMCG companies to audit palm oil and cocoa suppliers down to farm level.",
      body: "Brussels is moving ahead with its strict deforestation regulations, which require companies selling cattle, cocoa, coffee, oil palm, soya, and wood into the EU to prove they do not originate from recently deforested land. FMCG entities are racing to implement satellite mapping systems, incurring substantial capital expenditure. Trade organizations warn that supply limits could trigger commodity spikes in late 2026.",
      domain: "Regulatory",
      sentiment: "Concern",
      impact: "High",
      entities: JSON.stringify(["EU Commission", "Unilever", "Nestle", "Cargill"]),
      regulations: JSON.stringify(["EUDR"]),
      geographies: JSON.stringify(["EU", "Indonesia", "Brazil"]),
      confidence: 0.9,
      sourcesCited: JSON.stringify(["EU Official Journal", "FMCG Alliance Statement"]),
    },
    {
      source: "Financial Times",
      url: "https://www.ft.com/content/ai-governance-corporate-compliance-boardrooms-eu-act",
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      title: "Corporate boardrooms grapple with EU AI Act compliance deadlines",
      summary: "Audits on generative AI models reveal major corporate systems do not meet transparency requirements under high-risk category definitions.",
      body: "As the EU AI Act enforcement phases begin, multinational corporate groups are auditing their automated decision systems. A consulting report shows that over 65% of demand forecasting and customer routing applications utilizing third-party LLMs fail to log decision-making trails adequately. Failure to conform to the new mandates carries fines of up to 7% of global annual turnover, putting boards under high governance pressure.",
      domain: "Technology & AI",
      sentiment: "Alarm",
      impact: "High",
      entities: JSON.stringify(["EU Parliament", "PwC Audit Group"]),
      regulations: JSON.stringify(["EU AI Act"]),
      geographies: JSON.stringify(["EU", "Global"]),
      confidence: 0.88,
      sourcesCited: JSON.stringify(["EU Commission Fact Sheet", "Board Audit Surveys"]),
    },
    {
      source: "Bloomberg",
      url: "https://www.bloomberg.com/news/climate-change-water-scarcity-production-halts",
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      title: "Severe drought forecasts threaten packaging manufacturers in Southern Europe",
      summary: "Drought levels in Italy and Spain risk production capacity at containerboard and plastic packaging manufacturing sites.",
      body: "Unusual dry periods are causing regional water authorities to restrict industrial water allocations. Packaging producers, which rely heavily on water cooling systems, are warning of production capacity cuts. FMCG distribution loops are vulnerable as packaging shortages could delay finished product shipments for major domestic brands.",
      domain: "Environmental",
      sentiment: "Alarm",
      impact: "Medium",
      entities: JSON.stringify(["WRI Aqueduct", "Smurfit Kappa", "Danone"]),
      regulations: JSON.stringify(["Water Framework Directive"]),
      geographies: JSON.stringify(["Spain", "Italy", "EU"]),
      confidence: 0.85,
      sourcesCited: JSON.stringify(["WRI Drought Index", "European Copernicus Observatory"]),
    },
    {
      source: "Wall Street Journal",
      url: "https://www.wsj.com/articles/shipping-channel-volatility-inflation-buffers",
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      title: "Geopolitical flashpoints on key shipping lanes force retailers to hike safety buffers",
      summary: "Maritime shipping re-routing around conflict channels increases transit durations by 12 days and leads to inventory capital blockages.",
      body: "Shipping liners are continuing to bypass key canals, directing container cargo around Africa. The longer route increases fuel costs by 25% and triggers localized terminal congestion in Rotterdam and Singapore. Supply chain officers are expanding inventory safety buffers, locking up operational working capital at a time of high interest rates.",
      domain: "Geopolitical",
      sentiment: "Concern",
      impact: "High",
      entities: JSON.stringify(["AP Moller Maersk", "DP World"]),
      regulations: JSON.stringify([]),
      geographies: JSON.stringify(["Suez Canal", "Rotterdam", "Singapore"]),
      confidence: 0.91,
      sourcesCited: JSON.stringify(["Maersk Shipping Updates", "UNCTAD Transport Report"]),
    },
    {
      source: "Reuters",
      url: "https://www.reuters.com/business/global-inflation-interest-rates-stabilise-margin-squeeze-2026",
      publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      title: "FMCG margins remain squeezed despite general stabilization of headline inflation",
      summary: "Core commodity prices remain high, preventing consumer goods groups from lowering prices without risking gross margin metrics.",
      body: "While global consumer price indexes are flattening, agricultural commodities like sugar, cocoa, and olive oil remain at record highs. FMCG groups are finding it difficult to pass these input price increases onto consumers, who are showing private-label brand substitution trends, putting pressure on corporate gross margin forecasts.",
      domain: "Macro & Economic",
      sentiment: "Concern",
      impact: "Medium",
      entities: JSON.stringify(["Unilever", "Kraft Heinz", "Tesco"]),
      regulations: JSON.stringify([]),
      geographies: JSON.stringify(["Global", "UK", "EU"]),
      confidence: 0.84,
      sourcesCited: JSON.stringify(["FAO Food Price Index", "Supermarket Sales Data"]),
    }
  ];

  for (const sig of initialSignals) {
    const embedding = await getEmbedding(sig.title + " " + sig.body);
    await prisma.signal.create({
      data: {
        ...sig,
        embeddingString: JSON.stringify(embedding),
      },
    });
  }
  console.log("Seeding complete!");
}

// ── Onboard Organisation ──
export async function onboardOrganisation(
  name: string,
  industry: string,
  geographies: string[],
  commodities: string[],
  peers: string[]
) {
  // Create organisation
  const org = await prisma.organisation.create({
    data: {
      name,
      industry,
      geographies: JSON.stringify(geographies),
      commodities: JSON.stringify(commodities),
      peers: JSON.stringify(peers),
    },
  });

  // Create default risk appetites per domain
  const domains = [
    "Regulatory",
    "Technology & AI",
    "Geopolitical",
    "Supply chain",
    "Climate & nature",
    "Financial & macro",
  ];
  const defaultAppetites = [
    { domain: "Regulatory", threshold: 70 },
    { domain: "Technology & AI", threshold: 64 },
    { domain: "Geopolitical", threshold: 76 },
    { domain: "Supply chain", threshold: 70 },
    { domain: "Climate & nature", threshold: 68 },
    { domain: "Financial & macro", threshold: 65 },
  ];

  for (const app of defaultAppetites) {
    await prisma.riskAppetite.create({
      data: {
        organisationId: org.id,
        domain: app.domain,
        appetiteThreshold: app.threshold,
        setBy: "Board of Directors",
        effectiveDate: new Date(),
      },
    });
  }

  // Pre-seed some default enterprise risks in register
  const defaultRisks = [
    {
      code: "RR-01",
      title: "Regulatory Non-Compliance (EUDR & CSRD)",
      category: "Regulatory",
      ownerRole: "Chief Risk Officer",
      ownerName: "S. Rahman",
      inherentRating: "High",
      controlEffectiveness: "Partial",
      residualRating: "High",
      appetiteStatus: "Breach",
      score: 8.8,
      trendDirection: "Up",
      trendValue: 1.4,
      horizon: "near",
      isPrincipal: true,
      peerGap: true,
      lastReviewedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      code: "RR-02",
      title: "Generative AI Systems Governance Gaps",
      category: "Technology & AI",
      ownerRole: "Chief Technology Officer",
      ownerName: "M. Chen",
      inherentRating: "High",
      controlEffectiveness: "Partial",
      residualRating: "High",
      appetiteStatus: "Breach",
      score: 8.5,
      trendDirection: "Up",
      trendValue: 1.8,
      horizon: "near",
      isPrincipal: true,
      peerGap: true,
      lastReviewedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      code: "RR-03",
      title: "Suez/Rotterdam Shipping Lane Bottlenecks",
      category: "Geopolitical",
      ownerRole: "Head of Global Supply Chain",
      ownerName: "V. Dupont",
      inherentRating: "High",
      controlEffectiveness: "Adequate",
      residualRating: "Medium",
      appetiteStatus: "At tolerance",
      score: 7.9,
      trendDirection: "Stable",
      trendValue: 0.0,
      horizon: "med",
      isPrincipal: true,
      peerGap: false,
      lastReviewedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      code: "RR-04",
      title: "Resource Supply Scarcity (Cocoa, Oil Palm)",
      category: "Supply chain",
      ownerRole: "Director of Procurement",
      ownerName: "J. Kovacs",
      inherentRating: "High",
      controlEffectiveness: "Partial",
      residualRating: "Medium",
      appetiteStatus: "At tolerance",
      score: 7.2,
      trendDirection: "Up",
      trendValue: 0.5,
      horizon: "med",
      isPrincipal: false,
      peerGap: true,
      lastReviewedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      code: "RR-05",
      title: "Southern European Water Scarcity Risks",
      category: "Climate & nature",
      ownerRole: "Head of Environmental Sustainability",
      ownerName: "A. Lindstrom",
      inherentRating: "Medium",
      controlEffectiveness: "Adequate",
      residualRating: "Low",
      appetiteStatus: "Within",
      score: 6.3,
      trendDirection: "Stable",
      trendValue: 0.0,
      horizon: "long",
      isPrincipal: true,
      peerGap: true,
      lastReviewedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      code: "RR-06",
      title: "Global Inflationary Commodity Margin Squeeze",
      category: "Financial & macro",
      ownerRole: "Chief Financial Officer",
      ownerName: "K. Patel",
      inherentRating: "High",
      controlEffectiveness: "Adequate",
      residualRating: "Medium",
      appetiteStatus: "Within",
      score: 5.7,
      trendDirection: "Down",
      trendValue: -0.6,
      horizon: "med",
      isPrincipal: false,
      peerGap: false,
      lastReviewedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      nextReviewAt: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    }
  ];

  for (const r of defaultRisks) {
    const risk = await prisma.risk.create({
      data: {
        organisationId: org.id,
        ...r,
      },
    });

    // Create KRIs
    await prisma.kRI.create({
      data: {
        riskId: risk.id,
        label: `${r.category} Exposure Metric`,
        threshold: 75.0,
        currentValue: r.score * 10,
        breached: r.score * 10 > 75.0,
      },
    });

    // Create default Actions
    await prisma.action.create({
      data: {
        riskId: risk.id,
        description: `Implement internal compliance review for ${r.title}`,
        status: r.score > 8.0 ? "at-risk" : "on-track",
        dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        owner: r.ownerName,
      },
    });

    // Create risk history
    await prisma.riskScoreHistory.create({
      data: {
        riskId: risk.id,
        asOf: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        score: r.score - r.trendValue,
        sentiment: r.score > 7.5 ? "Alarm" : "Watch",
      },
    });
  }

  // Pre-seed some mock peer disclosures
  const peerDisclosures = [
    { peerName: peers[0] || "Nestle", theme: "AI Governance Frameworks", disclosed: true, source: "10-K Risk Section", asOf: new Date() },
    { peerName: peers[0] || "Nestle", theme: "CSDDD Scope 3 Deforestation", disclosed: true, source: "CSRD Report 2025", asOf: new Date() },
    { peerName: peers[1] || "Danone", theme: "Water Sustainability Audits", disclosed: true, source: "Climate statement", asOf: new Date() },
    { peerName: peers[2] || "P&G", theme: "Traceable Supply Chain", disclosed: false, source: "Not Disclosed", asOf: new Date() },
  ];

  for (const pd of peerDisclosures) {
    await prisma.peerDisclosure.create({
      data: {
        organisationId: org.id,
        ...pd,
      },
    });
  }

  return org;
}

// ── Run 4-stage pipeline for an Organisation ──
export async function runOrganisationAnalysis(orgId: string) {
  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
  });

  if (!org) throw new Error("Organisation not found");

  const peers = JSON.parse(org.peers) as string[];
  const industry = org.industry;

  console.log(`Running pipeline for ${org.name}...`);

  // Stage 1: Ingest via Tavily Web Search API
  const query = `${org.name} ${industry} emerging risks news 2026`;
  const searchResults = await searchWeb(query);

  const newSignals = [];

  for (const result of searchResults) {
    // Check if signal URL is already in database
    let signal = await prisma.signal.findUnique({
      where: { url: result.url },
    });

    if (!signal) {
      // Run LLM enrich and classification
      const enrichment = await classifyAndEnrichSignal(
        result.title,
        result.content,
        new URL(result.url).hostname
      );

      const textToEmbed = result.title + " " + result.content;
      const embedding = await getEmbedding(textToEmbed);

      signal = await prisma.signal.create({
        data: {
          source: new URL(result.url).hostname,
          url: result.url,
          publishedAt: new Date(),
          title: result.title,
          summary: enrichment.summary,
          body: result.content,
          domain: enrichment.domain,
          sentiment: enrichment.sentiment,
          impact: enrichment.impact,
          entities: JSON.stringify(enrichment.entities),
          regulations: JSON.stringify(enrichment.regulations),
          geographies: JSON.stringify(enrichment.geographies),
          embeddingString: JSON.stringify(embedding),
          confidence: enrichment.confidence,
          sourcesCited: JSON.stringify(result.url ? [result.url] : []),
        },
      });
    }
    newSignals.push(signal);
  }

  // Stage 2 & 3: Match signals to Organisation Risk Profile and calculate peer disclosures
  // Fetch organisation profile representation
  const profileText = `${org.name} operating in ${industry}. Key locations: ${org.geographies}. Materials: ${org.commodities}`;
  const orgProfileEmbedding = await getEmbedding(profileText);

  // Retrieve all signals and compute in-memory cosine similarities
  const allSignals = await prisma.signal.findMany();
  const matchedSignals = [];

  for (const signal of allSignals) {
    if (!signal.embeddingString) continue;
    const signalEmbedding = JSON.parse(signal.embeddingString) as number[];
    const score = cosineSimilarity(orgProfileEmbedding, signalEmbedding);

    // If similarity is above 0.35, match it!
    if (score > 0.35) {
      // Check if match already exists
      let match = await prisma.signalMatch.findFirst({
        where: { organisationId: orgId, signalId: signal.id },
      });

      if (!match) {
        match = await prisma.signalMatch.create({
          data: {
            organisationId: orgId,
            signalId: signal.id,
            relevanceScore: parseFloat((score * 10).toFixed(2)),
            linkedRiskIds: JSON.stringify([]),
          },
        });
      }
      matchedSignals.push({ signal, match });
    }
  }

  // Fetch peer disclosures via search
  for (const peer of peers) {
    console.log(`Fetching disclosures for peer: ${peer}...`);
    const peerQuery = `${peer} risk factor ESG disclosures 10-K annual report 2026`;
    const peerResults = await searchWeb(peerQuery);

    if (peerResults && peerResults.length > 0) {
      // In a real pipeline, we'd use LLM to audit if they disclosed CSDDD, AI Act etc.
      // Here we create standard database rows representing audited disclosures
      const themes = ["AI Governance Frameworks", "CSDDD Scope 3 Deforestation", "Water Sustainability Audits", "Traceable Supply Chain"];
      for (const theme of themes) {
        const alreadyDisclosed = await prisma.peerDisclosure.findFirst({
          where: { organisationId: orgId, peerName: peer, theme },
        });

        if (!alreadyDisclosed) {
          await prisma.peerDisclosure.create({
            data: {
              organisationId: orgId,
              peerName: peer,
              theme,
              disclosed: Math.random() > 0.3, // Mock check
              source: "Search Discovery 10-K",
              asOf: new Date(),
            },
          });
        }
      }
    }
  }

  // Stage 4: Re-calculate and generate Board Pack payload
  // Fetch organisation state for board pack
  const risks = await prisma.risk.findMany({
    where: { organisationId: orgId },
    include: { kris: true, actions: true },
  });

  const peerDisclosuresList = await prisma.peerDisclosure.findMany({
    where: { organisationId: orgId },
  });

  const boardSummary = await generateBoardSummary(org.name, peers, risks);

  // Group payload data
  const payloadData = {
    summary: boardSummary,
    posture: "Elevated",
    stats: {
      newPrincipalRisks: 2,
      escalating: 3,
      deescalated: 1,
      appetiteBreaches: 2,
      overdueMitigations: 4,
      newPeerDisclosures: matchedSignals.slice(0, 5).length,
    },
    risks: risks.map(r => ({
      code: r.code,
      title: r.title,
      owner: r.ownerName,
      residual: r.residualRating,
      trend: r.trendDirection,
      score: r.score,
      appetiteStatus: r.appetiteStatus,
    })),
    regulatoryHorizon: [
      { name: "EU AI Act", deadline: "Aug 2026", status: "Partial" },
      { name: "CSDDD", deadline: "Jan 2026", status: "Behind" },
      { name: "CSRD/ESRS", deadline: "FY2026", status: "Partial" },
      { name: "TNFD v2.0", deadline: "FY2027", status: "Behind" },
      { name: "FCA SDR", deadline: "In force", status: "Partial" },
    ],
    peerDisclosures: peerDisclosuresList.map(pd => ({
      peerName: pd.peerName,
      theme: pd.theme,
      disclosed: pd.disclosed,
    })),
    decisionsSought: [
      "Approve the increased risk score and mitigation resource reallocation for RR-01 (Regulatory Deforestation compliance).",
      "Approve funding for third-party AI audit log integration to meet August EU AI Act deadlines (RR-02).",
      "Endorse the updated climate risk appetite thresholds for supply chain critical sites (RR-05)."
    ],
  };

  // Upsert board pack snapshot
  await prisma.boardPack.create({
    data: {
      organisationId: orgId,
      periodLabel: "Q2 202 review cycle",
      posture: "Elevated",
      payload: JSON.stringify(payloadData),
    },
  });

  console.log(`Pipeline analysis completed for ${org.name}.`);
  return { matchedSignalsCount: matchedSignals.length };
}

// ── GET Organisation Summary View Data ──
export async function getOrganisationViewData(orgId: string) {
  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    include: {
      appetites: true,
      risks: {
        include: {
          kris: true,
          actions: true,
          history: true,
        },
      },
      peerDisclosures: true,
      boardPacks: {
        orderBy: { generatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!org) return null;

  // Find matches
  const matches = await prisma.signalMatch.findMany({
    where: { organisationId: orgId },
    include: { signal: true },
  });

  return {
    organisation: org,
    matches,
  };
}

// ── Background Web Sweeping Agent ──

async function sweepQuery(query: string) {
  try {
    const searchResults = await searchWeb(query, "week");
    for (const result of searchResults) {
      try {
        if (!result.url) continue;
        const urlHost = new URL(result.url).hostname;
        
        let exists = await prisma.signal.findUnique({
          where: { url: result.url }
        });
        
        if (!exists) {
          const enrichment = await classifyAndEnrichSignal(
            result.title,
            result.content || result.snippet || "",
            urlHost
          );
          
          const textToEmbed = result.title + " " + (result.content || result.snippet || "");
          const embedding = await getEmbedding(textToEmbed);
          
          await prisma.signal.create({
            data: {
              source: urlHost,
              url: result.url,
              publishedAt: new Date(),
              title: result.title,
              summary: enrichment.summary,
              body: result.content || result.snippet || "",
              domain: enrichment.domain,
              sentiment: enrichment.sentiment,
              impact: enrichment.impact,
              entities: JSON.stringify(enrichment.entities || []),
              regulations: JSON.stringify(enrichment.regulations || []),
              geographies: JSON.stringify(enrichment.geographies || ["Global"]),
              embeddingString: JSON.stringify(embedding),
              confidence: enrichment.confidence || 0.8,
              sourcesCited: JSON.stringify(result.url ? [result.url] : []),
            }
          });
          console.log(`[RiskLens Agent] Ingested new signal: "${result.title}"`);
        }
      } catch (itemErr) {
        console.error("[RiskLens Agent] Error processing signal item:", itemErr);
      }
    }
  } catch (err) {
    console.error(`[RiskLens Agent] Error sweeping query "${query}":`, err);
  }
}

export async function runSingleSignalSweep() {
  const queries = [
    "geopolitical risk international conflict trade sanctions corporate impact news",
    "regulatory compliance new law EUDR CSRD AI Act SEC news",
    "enterprise artificial intelligence governance security risk cyber attack news",
    "corporate climate change risk water scarcity environmental regulation news",
    "macroeconomic inflation interest rates market volatility margin pressure news",
    "global supply chain disruption logistics shipping delays material shortage news"
  ];
  const query = queries[Math.floor(Math.random() * queries.length)];
  console.log(`[RiskLens Agent] Running single live sweep for query: "${query}"`);
  await sweepQuery(query);
}

export async function runHourlySignalSweep() {
  const queries = [
    "geopolitical risk international conflict trade sanctions corporate impact news",
    "regulatory compliance new law EUDR CSRD AI Act SEC news",
    "enterprise artificial intelligence governance security risk cyber attack news",
    "corporate climate change risk water scarcity environmental regulation news",
    "macroeconomic inflation interest rates market volatility margin pressure news",
    "global supply chain disruption logistics shipping delays material shortage news"
  ];
  console.log(`[RiskLens Agent] Starting full hourly web sweep for all ${queries.length} domains...`);
  for (const query of queries) {
    await sweepQuery(query);
  }
  console.log("[RiskLens Agent] Full web sweep completed.");
}

// Register background scheduler on startup (server-side Node environment only)
if (typeof window === "undefined") {
  const globalRef = global as any;
  if (!globalRef.riskLensSweepInterval) {
    globalRef.riskLensSweepInterval = true;
    
    // Run initial sweep in background shortly after server boot
    setTimeout(() => {
      console.log("[RiskLens Agent] Running initial startup web sweep...");
      runHourlySignalSweep().catch(err => console.error("[RiskLens Agent] Initial sweep failed:", err));
    }, 10000);

    // Schedule hourly sweeps
    setInterval(() => {
      console.log("[RiskLens Agent] Running hourly automatic web sweep...");
      runHourlySignalSweep().catch(err => console.error("[RiskLens Agent] Hourly sweep failed:", err));
    }, 1000 * 60 * 60);
  }
}

