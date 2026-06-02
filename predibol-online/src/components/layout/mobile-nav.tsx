"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
}

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  currentPath: string;
  isAuthenticated: boolean;
}

export function MobileNav({
  open,
  onClose,
  items,
  currentPath,
  isAuthenticated,
}: MobileNavProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <nav className="fixed right-0 top-0 z-50 flex h-full w-64 flex-col bg-wine p-6 shadow-2xl md:hidden">
        <button
          onClick={onClose}
          className="mb-6 self-end text-white/70 hover:text-white"
          aria-label="Close menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                currentPath === item.href
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-4">
          {isAuthenticated ? (
            <SignOutButton />
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="block rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-crimson"
            >
              Member Login
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
