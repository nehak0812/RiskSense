import { NextResponse } from "next/server";
import { prisma, seedGlobalSignalsIfEmpty } from "@/services/dbService";

export async function GET() {
  try {
    // Ensure initial signals exist
    await seedGlobalSignalsIfEmpty();
    
    const signals = await prisma.signal.findMany({
      orderBy: { publishedAt: "desc" },
    });
    return NextResponse.json(signals);
  } catch (error: any) {
    console.error("API Error in /api/signals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
