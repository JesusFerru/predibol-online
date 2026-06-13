"use client";

import { useState } from "react";
import { PodiumModal } from "./podium-modal";

interface PodiumButtonProps {
  /** All eligible team names (from teams-wc26.json). */
  teams: string[];
  /** Existing podium prediction (if any). */
  existing: {
    winner1stplace: string;
    winner2ndplace: string;
    winner3rdplace: string;
  } | null;
  /** True when the June 27 deadline has passed. */
  isLocked: boolean;
}

export function PodiumButton({
  teams,
  existing,
  isLocked,
}: PodiumButtonProps) {
  const [open, setOpen] = useState(false);

  const hasPrediction = existing !== null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed right-6 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-crimson/50 ${
          hasPrediction
            ? "bottom-20 bg-crimson text-white"
            : isLocked
              ? "bottom-20 bg-gray-200 text-gray-400"
              : "bottom-20 bg-gold text-white"
        }`}
        aria-label={
          hasPrediction
            ? `Podium prediction: ${existing.winner1stplace}, ${existing.winner2ndplace}, ${existing.winner3rdplace}`
            : "Make podium prediction"
        }
      >
        <span className="text-lg leading-none">🏆</span>
        {hasPrediction ? (
          <span className="hidden sm:inline">Your Podium</span>
        ) : isLocked ? (
          <span className="hidden sm:inline">No Podium</span>
        ) : (
          <span className="hidden sm:inline">Podium Picks</span>
        )}
      </button>

      <PodiumModal
        open={open}
        onClose={() => setOpen(false)}
        teams={teams}
        existing={existing}
        isLocked={isLocked}
      />
    </>
  );
}
