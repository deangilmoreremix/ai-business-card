import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { image, purpose } = await req.json();
    if (!image) {
      return new NextResponse("Image data URL is required", { status: 400 });
    }
    const analysis = await AIService.analyzeImage(image, purpose || "avatar");
    if (!analysis) {
      return new NextResponse("Vision analysis failed", { status: 500 });
    }
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[VISION_ANALYZE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}