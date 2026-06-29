import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { prompt, profession } = await req.json();
    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }
    const enhanced = await AIService.enhanceBio(prompt, profession);
    return NextResponse.json({ bio: enhanced });
  } catch (error) {
    console.error("[BIO_ENHANCE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}