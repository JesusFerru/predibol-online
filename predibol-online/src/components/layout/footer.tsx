import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/rules", label: "Game Rules" },
  { href: "/rules#scoring", label: "Scoring System" },
  { href: "/#schedule", label: "Match Schedule" },
  { href: "/#contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="bg-wine text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-between">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Image
            src="/assets/images/logo/predibol-logo-blanco.png"
            alt="Predibol"
            width={80}
            height={32}
            className="h-8 w-auto"
          />
        </div>

        {/* Center: Links */}
        <nav className="flex flex-wrap justify-center gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: WhatsApp */}
        <a
          href="https://chat.whatsapp.com/placeholder"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
        >
          <Image
            src="/assets/images/logo/whatsapp-logo.png"
            alt="WhatsApp"
            width={20}
            height={20}
            className="h-5 w-5"
          />
          WhatsApp Group
        </a>
      </div>
    </footer>
  );
}
