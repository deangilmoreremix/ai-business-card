import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { BillingService } from "@/lib/services/billing";

export async function POST(req) {
  try {
    const user = await getOrCreateUser();
    const userId = user.id;

    const { planId } = await req.json();
    if (!planId) {
      return new NextResponse("Missing planId", { status: 400 });
    }

    const checkoutUrl = await BillingService.createCheckoutSession(
      userId,
      planId
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    if (error.message === "UNAUTHORIZED") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
