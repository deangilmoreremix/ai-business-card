import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!message) {
      return new NextResponse("Message is required", { status: 400 });
    }
    const analysis = await AIService.analyzeChatIntent(message);
    return NextResponse.json(analysis || {});
  } catch (error) {
    console.error("[INTENT_ANALYZE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}