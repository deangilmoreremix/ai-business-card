import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { BillingService } from "@/lib/services/billing";

export async function POST(req) {
  try {
    const user = await getOrCreateUser();
    const userId = user.id;

    const { planId } = await req.json();
    if (!planId) {
      return NextResponse.json({ error: "Missing planId parameter" }, { status: 400 });
    }

    const checkoutUrl = await BillingService.createCheckoutSession(userId, planId);
    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout route error:", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
