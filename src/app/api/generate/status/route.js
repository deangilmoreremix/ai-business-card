import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get("cardId");
    const requestId = searchParams.get("requestId");

    if (!cardId || !requestId) {
      return new NextResponse("Missing cardId or requestId", { status: 400 });
    }

    const result = await AIService.checkGenerationStatus(cardId, requestId);
    if (!result) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GENERATE_STATUS]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}