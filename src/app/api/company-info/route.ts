import { NextResponse } from "next/server";
import { fetchCompanyInfo } from "@/services/aiService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing company name" }, { status: 400 });
    }

    const info = await fetchCompanyInfo(name, description || "");
    return NextResponse.json(info);
  } catch (error: any) {
    console.error("API Error in POST /api/company-info:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const description = searchParams.get("description") || "";

    if (!name) {
      return NextResponse.json({ error: "Missing name query parameter" }, { status: 400 });
    }

    const info = await fetchCompanyInfo(name, description);
    return NextResponse.json(info);
  } catch (error: any) {
    console.error("API Error in GET /api/company-info:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

