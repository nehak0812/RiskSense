import { NextResponse } from "next/server";
import { runOrganisationAnalysis } from "@/services/dbService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const result = await runOrganisationAnalysis(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error(`API Error in /api/orgs/[id]/analyse:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
