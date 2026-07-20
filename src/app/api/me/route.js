import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getOrCreateUser();
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      credits: user.credits,
    });
  } catch (error) {
    console.error("[ME_GET]", error);
    if (error.message === "UNAUTHORIZED") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
