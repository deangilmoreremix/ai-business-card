import { NextResponse } from "next/server";
import { CardService } from "@/lib/services/cards";

export async function POST(req) {
  try {
    const { urlHash, referrer } = await req.json();
    if (!urlHash) {
      return new NextResponse("urlHash required", { status: 400 });
    }
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";
    await CardService.recordView(urlHash, {
      ip: ip.split(",")[0].trim(),
      userAgent,
      referrer: referrer || "",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ANALYTICS]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const urlHash = searchParams.get("urlHash");
    if (!urlHash) {
      return new NextResponse("urlHash required", { status: 400 });
    }
    const analytics = await CardService.getCardAnalytics(urlHash);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[ANALYTICS_GET]", error);
    return NextResponse.json({ views: 0 }, { status: 500 });
  }
}