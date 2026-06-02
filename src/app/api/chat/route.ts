import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/services/dbService";

// Helper to construct context for RAG
async function buildChatContext(orgId?: string) {
  // Fetch all global signals
  const signals = await prisma.signal.findMany({
    orderBy: { publishedAt: "desc" },
    take: 15,
  });

  const signalLines = signals
    .map(
      (s) =>
        `- [${s.domain}] ${s.title} (${s.source}, ${s.sentiment}, ${s.impact} impact; geographies: ${s.geographies})`
    )
    .join("\n");

  let ctx = `You are RiskLens Assistant, an emerging-risk intelligence analyst embedded in the RiskLens platform. You help risk, strategy and compliance teams interpret external risk signals.

The risk taxonomy is: Geopolitical & Sanctions; Trade, Tariffs & Supply Chain; Regulatory & Compliance; Financial & Market; Technology & Cyber; Climate & Environmental; Social, Reputational & Conduct; Legal & Litigation.

This week's tracked external signals:
${signalLines}

Dominant themes: 18th EU/OFAC sanctions package; US 35% reciprocal tariffs effective 1 July; EU AI Act enforcement (August deadline); TNFD v2.0 / CSRD water & nature disclosure; CSDDD supply-chain labour due diligence.`;

  if (orgId) {
    const org = await prisma.organisation.findUnique({
      where: { id: orgId },
      include: {
        risks: {
          orderBy: { score: "desc" },
        },
        appetites: true,
      },
    });

    if (org) {
      const risks = org.risks
        .map(
          (r) =>
            `- ${r.title} (${r.residualRating} residual rating, score ${r.score}, ${r.trendDirection}; ${
              r.peerGap ? "PEER GAP" : "no peer gap"
            })`
        )
        .join("\n");

      const appetite = org.appetites
        .map(
          (a) =>
            `- ${a.domain}: appetite threshold ${a.appetiteThreshold}`
        )
        .join("\n");

      let geographiesList = "Global";
      try {
        geographiesList = JSON.parse(org.geographies).join(", ");
      } catch (e) {}

      let peersList = "";
      try {
        peersList = JSON.parse(org.peers).join(", ");
      } catch (e) {}

      ctx += `\n\nThe user has selected an organisation: ${org.name} — ${org.industry}.
Geographies: ${geographiesList}. Peers: ${peersList}.
${org.name}'s prioritised emerging risks:
${risks}
Appetite thresholds:
${appetite}
When answering, ground responses in ${org.name}'s specific footprint, risks and peer set.`;
    }
  } else {
    ctx += `\n\nNo organisation is currently selected — answer at the market/world level and suggest the user select an organisation for tailored analysis.`;
  }

  ctx += `

Response rules:
- Be concise and analyst-grade. Use **bold** for key terms and short bullet lists where helpful. Keep under ~160 words unless asked for depth.
- Do NOT use markdown headings (no # symbols). Lead with a one-line takeaway, then bullets if needed.
- Do NOT invent specific statistics beyond what is provided; reason from the signals above.
- End EVERY response with a final line in exactly this format: "SOURCES: Source A; Source B; Source C" listing 2-4 of the most relevant sources or signal types you drew on (e.g. Reuters, EU Official Journal, FCA, or a signal headline keyword). Nothing after that line.`;
  
  return ctx;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, orgId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing or invalid messages array" }, { status: 400 });
    }

    const context = await buildChatContext(orgId);
    const geminiApiKey = process.env.GEMINI_API_KEY || "";

    if (!geminiApiKey) {
      console.warn("GEMINI_API_KEY not configured. Using simulated responses.");
      return NextResponse.json({
        reply: `This is a simulated RiskLens response because no **GEMINI_API_KEY** was detected in the environment. Based on the active database context, Geopolitical and Trade signals remain dominant this week, with European compliance targets shifting resource planning for supply lines. Select or register an organization to view tailored exposure profiles.\n\nSOURCES: Reuters; EU Official Journal; Supply chain signals`
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Format chat history for Gemini API
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const conversationHistory = messages
      .slice(0, -1)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const fullPrompt = `${context}\n\n--- Conversation History ---\n${conversationHistory}\n\nUser: ${lastUserMessage}\n\nAssistant:`;

    const result = await model.generateContent(fullPrompt);
    const replyText = result.response.text().trim();

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
