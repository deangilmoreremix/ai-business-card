import { CardService, ChatService } from "@/lib/services/cards";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { urlHash, query, chatHistory, sessionId } = await req.json();

    if (!urlHash || !query) {
      return new Response("Missing urlHash or query", { status: 400 });
    }

    const card = await CardService.getCardByHash(urlHash);
    if (!card) return new Response("Card not found", { status: 404 });
    if (!card.showAiAssistant) {
      return new Response("Chatbot disabled", { status: 403 });
    }

    if (sessionId) {
      await ChatService.saveMessage(urlHash, sessionId, "user", query);
    }

    // Set up Server-Sent Events
    const encoder = new TextEncoder();
    let fullReply = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of AIService.streamChatbot(card, query, chatHistory || [])) {
            if (event.type === "delta") {
              fullReply += event.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "delta", text: event.text })}\n\n`)
              );
            } else if (event.type === "done") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "done", responseId: event.responseId })}\n\n`)
              );
            }
          }
          // Persist assistant reply
          if (sessionId && fullReply) {
            await ChatService.saveMessage(urlHash, sessionId, "assistant", fullReply);
          }
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[CHAT_STREAM]", error);
    return new Response(error.message || "Internal Error", { status: 500 });
  }
}