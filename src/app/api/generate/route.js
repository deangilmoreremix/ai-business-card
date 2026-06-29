import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { cardId, userPrompt } = await req.json();

    if (!cardId) {
      return new NextResponse("Card ID is required", { status: 400 });
    }

    const requestId = await AIService.generateCardHTML(cardId, userPrompt);

    return NextResponse.json({ requestId });
  } catch (error) {
    console.error("[GENERATE_CARD]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}