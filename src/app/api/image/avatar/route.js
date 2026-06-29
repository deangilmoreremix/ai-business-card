import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { prompt, style, size } = await req.json();
    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }
    const result = await AIService.generateAvatar({ prompt, style, size });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AVATAR_GENERATE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}