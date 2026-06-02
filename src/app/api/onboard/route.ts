import { NextResponse } from "next/server";
import { onboardOrganisation, runOrganisationAnalysis } from "@/services/dbService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, industry, geographies, commodities, peers } = body;

    if (!name || !industry) {
      return NextResponse.json({ error: "Missing name or industry" }, { status: 400 });
    }

    // Standardize arrays
    const geoArray = Array.isArray(geographies) ? geographies : [geographies || "Global"];
    const commArray = Array.isArray(commodities) ? commodities : [commodities || "None"];
    const peerArray = Array.isArray(peers) ? peers : [peers || "Competitor A"];

    // Onboard org
    const org = await onboardOrganisation(
      name,
      industry,
      geoArray,
      commArray,
      peerArray
    );

    // Run first analysis pipeline
    await runOrganisationAnalysis(org.id);

    return NextResponse.json(org);
  } catch (error: any) {
    console.error("API Error in /api/onboard:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
