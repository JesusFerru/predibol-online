"use client";

import { useAuth } from "./auth-provider";

export function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      className="text-sm font-medium text-white/80 transition-colors hover:text-white"
    >
      Sign Out
    </button>
  );
}
