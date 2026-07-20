import { clerkMiddleware } from "@clerk/nextjs/server";

// Public-first strategy: Clerk runs on every request, but routes are not
// force-protected here. Each API route and page authorizes the user manually
// via auth()/getOrCreateUser(), so public pages (marketing, public cards) and
// third-party webhooks (Stripe) keep working without a Clerk session.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
