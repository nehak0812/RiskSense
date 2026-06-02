import { NextResponse } from "next/server";
import { prisma } from "@/services/dbService";

export async function GET() {
  try {
    const orgs = await prisma.organisation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orgs);
  } catch (error: any) {
    console.error("API Error in GET /api/orgs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
