import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const user = await getOrCreateUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { cardId, userPrompt } = await req.json();

    if (!cardId) {
      return new NextResponse("Card ID is required", { status: 400 });
    }

    const requestId = await AIService.generateCardHTML(user.id, cardId, userPrompt);

    return NextResponse.json({ requestId });
  } catch (error) {
    console.error("[GENERATE_CARD]", error);
    if (error.message === "UNAUTHORIZED") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
