"use client";

import { useState } from "react";
import Image from "next/image";
import type { FaqItem } from "@/lib/data/faq";

// ─── Types ──────────────────────────────────────────────

interface FaqAccordionProps {
  items: FaqItem[];
}

// ─── Inline chevron icon ────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
        open ? "rotate-180 text-crimson" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── Safe HTML renderer ─────────────────────────────────
// Renders a trusted HTML string (faq data is authored by us, not user input).

function SafeHtml({ html }: { html: string }) {
  return (
    <div
      className="faq-answer prose prose-sm max-w-none text-gray-600"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── FAQ image (handles missing images gracefully) ──────

function FaqImageFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Image doesn't exist yet — show caption with a note
    return (
      <figure className="mt-4 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
        <p className="text-xs text-gray-400">{caption ?? alt}</p>
      </figure>
    );
  }

  return (
    <figure className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={450}
        className="w-full object-contain"
        onError={() => setHasError(true)}
        unoptimized
      />
      {caption && (
        <figcaption className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ─── Single accordion item ──────────────────────────────

function FaqAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const headingId = `faq-heading-${item.id}`;
  const panelId = `faq-panel-${item.id}`;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* ── Question button ── */}
      <button
        type="button"
        id={headingId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-crimson/30 ${
          isOpen ? "bg-crimson/[0.03]" : ""
        }`}
      >
        <span
          className={`text-sm font-semibold sm:text-base ${
            isOpen ? "text-crimson" : "text-gray-800"
          }`}
        >
          {item.question}
        </span>
        <ChevronIcon open={isOpen} />
      </button>

      {/* ── Answer panel ── */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        hidden={!isOpen}
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-5 pt-1">
          <SafeHtml html={item.answer} />

          {item.images && item.images.length > 0 && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {item.images.map((img, i) => (
                <FaqImageFigure
                  key={`${item.id}-img-${i}`}
                  src={img.src}
                  alt={img.alt}
                  caption={img.caption}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main accordion ─────────────────────────────────────

export function FaqAccordion({ items }: FaqAccordionProps) {
  // Track which item is open (single-select accordion)
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No hay preguntas disponibles por el momento.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {items.map((item) => (
        <FaqAccordionItem
          key={item.id}
          item={item}
          isOpen={openId === item.id}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </div>
  );
}
