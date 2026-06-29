import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { prompt, theme, size } = await req.json();
    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }
    const result = await AIService.generateBackground({ prompt, theme, size });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[BG_GENERATE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}