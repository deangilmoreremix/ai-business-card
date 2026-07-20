import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * Returns the Clerk userId for the current request, or null if unauthenticated.
 */
export async function getClerkUserId() {
  const { userId } = await auth();
  return userId;
}

/**
 * Returns the current Clerk userId or throws a 401-style error.
 * Use in API routes that require authentication.
 */
export async function requireClerkUserId() {
  const userId = await getClerkUserId();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

/**
 * Ensure a Prisma User row exists for the authenticated Clerk user,
 * creating it on first access (with default 10 credits). Returns the user.
 */
export async function getOrCreateUser() {
  const userId = await requireClerkUserId();

  const clerkUser = await fetchClerkUser(userId);

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {
      name: clerkUser?.firstName
        ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ""}`
        : clerkUser?.username ?? undefined,
      email: clerkUser?.emailAddress ?? undefined,
      image: clerkUser?.imageUrl ?? undefined,
    },
    create: {
      id: userId,
      name: clerkUser?.firstName
        ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ""}`
        : clerkUser?.username ?? null,
      email: clerkUser?.emailAddress ?? null,
      image: clerkUser?.imageUrl ?? null,
      credits: 10,
    },
  });

  return user;
}

async function fetchClerkUser(userId) {
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    return await client.users.getUser(userId);
  } catch {
    return null;
  }
}
