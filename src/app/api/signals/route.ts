import { NextResponse } from "next/server";
import { prisma, seedGlobalSignalsIfEmpty, runSingleSignalSweep } from "@/services/dbService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceLive = searchParams.get("live") === "true";
    
    // Ensure initial signals exist
    await seedGlobalSignalsIfEmpty();
    
    if (forceLive) {
      await runSingleSignalSweep();
    }
    
    // Return signals from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let signals = await prisma.signal.findMany({
      where: {
        publishedAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { publishedAt: "desc" },
    });
    
    // Fallback: if no signals in the last 7 days, return the most recent 30 signals
    if (signals.length === 0) {
      signals = await prisma.signal.findMany({
        orderBy: { publishedAt: "desc" },
        take: 30,
      });
    }
    
    return NextResponse.json(signals);
  } catch (error: any) {
    console.error("API Error in /api/signals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

