"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

/**
 * Mirrors the previous auth `useSession()` shape so existing components keep
 * working: { data: { user: { id, credits, name, image, email } }, status }.
 * `status` is "loading" | "authenticated" | "unauthenticated".
 */
export function useCurrentUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [creditsLoaded, setCreditsLoaded] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setDbUser(null);
      setCreditsLoaded(true);
      return;
    }
    let active = true;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        setDbUser(data);
        setCreditsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setCreditsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [isSignedIn, user?.id]);

  const status = !isLoaded || !creditsLoaded
    ? "loading"
    : isSignedIn
    ? "authenticated"
    : "unauthenticated";

  const data = isSignedIn
    ? {
        user: {
          id: dbUser?.id ?? user.id,
          credits: dbUser?.credits ?? 0,
          name: dbUser?.name ?? user.fullName ?? user.username ?? null,
          email: dbUser?.email ?? user.primaryEmailAddress?.emailAddress ?? null,
          image: dbUser?.image ?? user.imageUrl ?? null,
        },
      }
    : null;

  return { data, status };
}

/** Client hook that returns a sign-out handler redirecting to /login. */
export function useSignOutAndRedirect() {
  const { signOut } = useClerk();
  return () => signOut({ redirectUrl: "/login" });
}
