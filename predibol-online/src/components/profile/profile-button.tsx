"use client";

import { useState } from "react";
import { ProfileDrawer } from "./profile-drawer";

interface ProfileButtonProps {
  userName: string;
  userAlias: string | undefined;
  userEmail: string;
  credits: number;
  points: number;
  rank: number | null;
}

export function ProfileButton({
  userName,
  userAlias,
  userEmail,
  credits,
  points,
  rank,
}: ProfileButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-crimson text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-crimson/50"
        aria-label="Open profile"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>

      <ProfileDrawer
        open={open}
        onClose={() => setOpen(false)}
        userName={userName}
        userAlias={userAlias}
        userEmail={userEmail}
        credits={credits}
        points={points}
        rank={rank}
      />
    </>
  );
}
