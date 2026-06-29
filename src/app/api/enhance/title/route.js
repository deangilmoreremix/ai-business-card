import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { description } = await req.json();
    if (!description) {
      return new NextResponse("Description is required", { status: 400 });
    }
    const title = await AIService.suggestTitle(description);
    return NextResponse.json({ title });
  } catch (error) {
    console.error("[SUGGEST_TITLE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}