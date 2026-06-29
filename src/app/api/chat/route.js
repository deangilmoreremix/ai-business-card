import { NextResponse } from "next/server";
import { CardService, ChatService } from "@/lib/services/cards";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { urlHash, query, chatHistory, sessionId } = await req.json();

    if (!urlHash) {
      return new NextResponse("Card URL Hash is required", { status: 400 });
    }
    if (!query) {
      return new NextResponse("Query is required", { status: 400 });
    }

    const card = await CardService.getCardByHash(urlHash);
    if (!card) {
      return new NextResponse("Business card not found", { status: 404 });
    }

    if (!card.showAiAssistant) {
      return new NextResponse("AI Chatbot is disabled for this card", { status: 403 });
    }

    // Persist the user message
    if (sessionId) {
      await ChatService.saveMessage(urlHash, sessionId, "user", query);
    }

    // Call chatbot logic
    const reply = await AIService.askChatbot(card, query, chatHistory || []);

    if (sessionId) {
      await ChatService.saveMessage(urlHash, sessionId, "assistant", reply);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[CHATBOT_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}