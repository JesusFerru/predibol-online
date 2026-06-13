"use client";

import { savePodiumPrediction } from "@/app/portal/actions";
import { useState, useTransition } from "react";

interface PodiumModalProps {
  open: boolean;
  onClose: () => void;
  /** The 48 World Cup teams from teams-wc26.json. */
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

export function PodiumModal({
  open,
  onClose,
  teams,
  existing,
  isLocked,
}: PodiumModalProps) {
  const [champion, setChampion] = useState(existing?.winner1stplace ?? "");
  const [runnerUp, setRunnerUp] = useState(existing?.winner2ndplace ?? "");
  const [thirdPlace, setThirdPlace] = useState(
    existing?.winner3rdplace ?? "",
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const allFilled = champion !== "" && runnerUp !== "" && thirdPlace !== "";

  const hasChanges =
    champion !== (existing?.winner1stplace ?? "") ||
    runnerUp !== (existing?.winner2ndplace ?? "") ||
    thirdPlace !== (existing?.winner3rdplace ?? "");

  const canSave =
    allFilled && hasChanges && !isLocked && !isPending;

  function handleSave() {
    if (!canSave) return;

    setFeedback(null);
    startTransition(async () => {
      const result = await savePodiumPrediction(
        champion,
        runnerUp,
        thirdPlace,
      );
      setFeedback({
        type: result.success ? "success" : "error",
        message: result.success
          ? "Podium prediction saved!"
          : (result.error ?? "Something went wrong."),
      });
    });
  }

  // Filter out already-selected teams from each dropdown
  function availableTeams(exclude: string[]): string[] {
    return teams.filter(
      (t) => !exclude.includes(t) || t === "",
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Tournament Podium
              </h2>
              <p className="text-xs text-gray-500">
                Predict the top 3 of World Cup 2026
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 px-6 py-4">
            {/* Champion */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                🥇 Champion
              </label>
              <select
                value={champion}
                onChange={(e) => {
                  setChampion(e.target.value);
                  setFeedback(null);
                }}
                disabled={isLocked || isPending}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/40 ${
                  isLocked
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                    : "border-gray-300 bg-white text-gray-900 hover:border-crimson/30"
                }`}
              >
                <option value="">Select champion…</option>
                {availableTeams([runnerUp, thirdPlace]).map((team) => (
                  <option key={`c-${team}`} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* Runner-up */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                🥈 Runner-up
              </label>
              <select
                value={runnerUp}
                onChange={(e) => {
                  setRunnerUp(e.target.value);
                  setFeedback(null);
                }}
                disabled={isLocked || isPending}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/40 ${
                  isLocked
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                    : "border-gray-300 bg-white text-gray-900 hover:border-crimson/30"
                }`}
              >
                <option value="">Select runner-up…</option>
                {availableTeams([champion, thirdPlace]).map((team) => (
                  <option key={`r-${team}`} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* Third Place */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                🥉 Third Place
              </label>
              <select
                value={thirdPlace}
                onChange={(e) => {
                  setThirdPlace(e.target.value);
                  setFeedback(null);
                }}
                disabled={isLocked || isPending}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/40 ${
                  isLocked
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                    : "border-gray-300 bg-white text-gray-900 hover:border-crimson/30"
                }`}
              >
                <option value="">Select third place…</option>
                {availableTeams([champion, runnerUp]).map((team) => (
                  <option key={`t-${team}`} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* Scoring reference */}
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">
                <strong className="text-gray-700">Points:</strong> Champion +20
                {" · "}Runner-up +10{" · "}Third place +5
              </p>
            </div>

            {/* Deadline notice */}
            {isLocked && (
              <div className="rounded-lg bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-700">
                  ⏰ The podium prediction deadline has passed (June 27, 2026).
                  Predictions are now read-only.
                </p>
                {existing && (
                  <p className="mt-1 text-xs text-amber-600">
                    Your prediction: 🥇 {existing.winner1stplace}{" · "}
                    🥈 {existing.winner2ndplace}{" · "}
                    🥉 {existing.winner3rdplace}
                  </p>
                )}
                {!existing && (
                  <p className="mt-1 text-xs text-amber-600">
                    No podium prediction was saved before the deadline.
                  </p>
                )}
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <p
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  feedback.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {feedback.message}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-xs text-gray-400">
              Deadline: June 27, 2026
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                {isLocked ? "Close" : "Cancel"}
              </button>
              {!isLocked && (
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/40 ${
                    canSave
                      ? "bg-crimson text-white hover:bg-crimson/90"
                      : "cursor-not-allowed bg-gray-200 text-gray-400"
                  }`}
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
