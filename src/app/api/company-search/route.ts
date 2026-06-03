import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length < 2) {
      return NextResponse.json([]);
    }

    const query = q.trim();
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      query
    )}&language=en&format=json&limit=15&type=item`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "RiskLens/1.0 (contact@risklens.com) Company-Search-Agent",
      },
    });

    if (!response.ok) {
      throw new Error(`Wikidata API responded with status ${response.status}`);
    }

    const data = await response.json();
    const searchResults = data.search || [];

    // Map and return standard entity fields
    const companies = searchResults.map((item: any) => ({
      id: item.id,
      name: item.label,
      description: item.description || "Organisation / Entity",
      meta: `Wikidata: ${item.id}`,
    }));

    return NextResponse.json(companies);
  } catch (error: any) {
    console.error("Error in GET /api/company-search:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
