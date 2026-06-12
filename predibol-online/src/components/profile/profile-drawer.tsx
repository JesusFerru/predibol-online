"use client";

import { useAuth } from "@/components/auth/auth-provider";
import Link from "next/link";

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userAlias: string | undefined;
  userEmail: string;
  credits: number;
  points: number;
  rank: number | null;
}

export function ProfileDrawer({
  open,
  onClose,
  userName,
  userAlias,
  userEmail,
  credits,
  points,
  rank,
}: ProfileDrawerProps) {
  const { signOut } = useAuth();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer — right side on desktop, bottom sheet on mobile */}
      <div
        className="fixed bottom-0 right-0 z-50 w-full rounded-t-2xl bg-white shadow-2xl sm:top-0 sm:h-full sm:w-80 sm:rounded-none"
      >
        {/* Handle bar (mobile only) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="flex flex-col gap-4 p-6">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-crimson text-lg font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{userName}</p>
              {userAlias && (
                <p className="text-sm text-gray-500">@{userAlias}</p>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500">{userEmail}</p>

          <hr className="border-gray-200" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-gray-50 p-2 text-center">
              <p className="text-base font-bold text-crimson">
                {rank != null ? `#${rank}` : "—"}
              </p>
              <p className="text-[10px] text-gray-500">Rank</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 text-center">
              <p className="text-base font-bold text-crimson">{points}</p>
              <p className="text-[10px] text-gray-500">Points</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 text-center">
              <p className="text-base font-bold text-crimson">{credits}</p>
              <p className="text-[10px] text-gray-500">Credits</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Quick actions */}
          <nav className="flex flex-col gap-1">
            <Link
              href="/ranking"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Ranking
            </Link>
            <Link
              href="/portal/stats"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              My Statistics
            </Link>
            <Link
              href="/rules"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              View Rules
            </Link>
            <a
              href="https://chat.whatsapp.com/placeholder"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              WhatsApp Group
            </a>
            <button
              onClick={async () => {
                onClose();
                await signOut();
              }}
              className="rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
