import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }
    const config = await AIService.extractDesignConfig(prompt);
    if (!config) {
      return new NextResponse("Could not extract design", { status: 500 });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("[DESIGN_CONFIG]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}