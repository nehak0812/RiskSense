import { NextResponse } from "next/server";
import { prisma, seedGlobalSignalsIfEmpty } from "@/services/dbService";
import { searchWeb, classifyAndEnrichSignal, getEmbedding } from "@/services/aiService";

async function ingestLiveGlobalSignals() {
  console.log("Fetching live emerging risk signals from the last 7 days...");
  const queries = [
    "geopolitical risk international conflict trade sanctions corporate impact news",
    "regulatory compliance new law EUDR CSRD AI Act SEC news",
    "enterprise artificial intelligence governance security risk cyber attack news",
    "corporate climate change risk water scarcity environmental regulation news",
    "macroeconomic inflation interest rates market volatility margin pressure news",
    "global supply chain disruption logistics shipping delays material shortage news"
  ];
  
  const query = queries[Math.floor(Math.random() * queries.length)];
  const searchResults = await searchWeb(query, "week");
  
  for (const result of searchResults) {
    try {
      const urlHost = result.url ? new URL(result.url).hostname : "newsfeed";
      
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
      }
    } catch (err) {
      console.error("Error processing live signal item:", err);
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceLive = searchParams.get("live") === "true";
    
    // Ensure initial signals exist
    await seedGlobalSignalsIfEmpty();
    
    if (forceLive) {
      await ingestLiveGlobalSignals();
    }
    
    const signals = await prisma.signal.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json(signals);
  } catch (error: any) {
    console.error("API Error in /api/signals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
