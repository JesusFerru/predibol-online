"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { SignOutButton } from "@/components/auth/sign-out-button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MobileNav } from "./mobile-nav";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/rules", label: "Rules" },
  { href: "/help", label: "Help" },
];

const AUTH_NAV_ITEMS = [
  { href: "/portal", label: "Predictions" },
  { href: "/portal/stats", label: "Stats" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = user ? [...NAV_ITEMS, ...AUTH_NAV_ITEMS] : NAV_ITEMS;

  return (
    <header className="fixed top-0 z-50 w-full bg-crimson shadow-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo + Title */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/images/logo/predibol-logo-blanco.png"
            alt="Predibol"
            width={36}
            height={28}
            className="h-7 w-auto"
          />
          <span className="hidden text-sm font-semibold text-white sm:inline">
            Predibol - World Cup 2026
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActivePath(pathname, item.href)
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <SignOutButton />
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-crimson transition-colors hover:bg-white/90"
            >
              Member Login
            </Link>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col gap-1 p-1 md:hidden"
            aria-label="Open menu"
          >
            <span className="block h-0.5 w-5 rounded bg-white" />
            <span className="block h-0.5 w-5 rounded bg-white" />
            <span className="block h-0.5 w-5 rounded bg-white" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={navItems}
        currentPath={pathname}
        isAuthenticated={!!user}
      />
    </header>
  );
}
