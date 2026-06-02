import { NextResponse } from "next/server";
import { getOrganisationViewData } from "@/services/dbService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const data = await getOrganisationViewData(id);
    if (!data) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`API Error in /api/orgs/${request.url}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
