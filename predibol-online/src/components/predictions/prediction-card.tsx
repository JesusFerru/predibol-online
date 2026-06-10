"use client";

import { savePrediction } from "@/app/portal/actions";
import { useState, useTransition } from "react";

interface ExistingBet {
  betgoalteam1: number;
  betgoalteam2: number;
}

interface PredictionCardProps {
  matchId: string;
  team1: string;
  team2: string;
  scheduleAt: string | null;
  matchStatus: string;
  existingBet: ExistingBet | null;
  isLocked: boolean;
}

export function PredictionCard({
  matchId,
  team1,
  team2,
  scheduleAt,
  matchStatus,
  existingBet,
  isLocked,
}: PredictionCardProps) {
  const [goal1, setGoal1] = useState<number | "">(
    existingBet?.betgoalteam1 ?? "",
  );
  const [goal2, setGoal2] = useState<number | "">(
    existingBet?.betgoalteam2 ?? "",
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    goal1 !== (existingBet?.betgoalteam1 ?? "") ||
    goal2 !== (existingBet?.betgoalteam2 ?? "");

  const bothFilled =
    goal1 !== "" && goal2 !== "";

  const canSave = bothFilled && hasChanges && !isLocked && !isPending;

  function handleSave() {
    if (!canSave) return;
    if (typeof goal1 !== "number" || typeof goal2 !== "number") return;

    setFeedback(null);
    startTransition(async () => {
      const result = await savePrediction(matchId, goal1, goal2);
      setFeedback({
        type: result.success ? "success" : "error",
        message: result.success
          ? "Prediction saved!"
          : (result.error ?? "Something went wrong."),
      });
      if (!result.success) {
        // Reset to last saved values on error
        setGoal1(existingBet?.betgoalteam1 ?? "");
        setGoal2(existingBet?.betgoalteam2 ?? "");
      }
    });
  }

  function formatTime(isoString: string | null): string {
    if (!isoString) return "TBD";
    const date = new Date(isoString);
    return date.toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/La_Paz",
    });
  }

  function formatDate(isoString: string | null): string {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-BO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "America/La_Paz",
    });
  }

  const isFinished = matchStatus === "FINISHED";
  const isCanceled = matchStatus === "CANCELED";
  const isReadOnly = isLocked || isFinished || isCanceled;

  return (
    <div
      className={`rounded-xl border-2 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        isLocked && !isFinished
          ? "border-amber-300 bg-amber-50/30"
          : isFinished
            ? "border-gray-200 bg-gray-50/50"
            : isCanceled
              ? "border-red-200 bg-red-50/30"
              : "border-gray-200"
      }`}
    >
      {/* Header: time + status badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{formatTime(scheduleAt)}</span>
          <span className="hidden sm:inline">· {formatDate(scheduleAt)}</span>
        </div>

        {isLocked && !isFinished && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Locked
          </span>
        )}
        {isFinished && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            Finished
          </span>
        )}
        {isCanceled && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Canceled
          </span>
        )}
      </div>

      {/* Teams + Score inputs */}
      <div className="flex items-center justify-between gap-3">
        {/* Team 1 */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crimson/10 text-sm font-bold text-crimson">
            {team1.slice(0, 3).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900 leading-tight">
            {team1}
          </span>
          <input
            type="number"
            min={0}
            max={30}
            value={goal1}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setGoal1("");
                return;
              }
              const n = Number.parseInt(v, 10);
              if (!Number.isNaN(n) && n >= 0 && n <= 30) {
                setGoal1(n);
              }
            }}
            disabled={isReadOnly || isPending}
            className={`mt-1 w-16 rounded-lg border px-2 py-1.5 text-center text-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/50 ${
              isReadOnly
                ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                : "border-gray-300 bg-white text-gray-900 hover:border-crimson/30"
            }`}
            aria-label={`Goals for ${team1}`}
          />
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1 pt-2">
          <span className="text-xs font-bold text-gray-400 uppercase">VS</span>
          {isFinished && existingBet && (
            <span className="text-xs text-gray-500">
              {existingBet.betgoalteam1} - {existingBet.betgoalteam2}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crimson/10 text-sm font-bold text-crimson">
            {team2.slice(0, 3).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900 leading-tight">
            {team2}
          </span>
          <input
            type="number"
            min={0}
            max={30}
            value={goal2}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setGoal2("");
                return;
              }
              const n = Number.parseInt(v, 10);
              if (!Number.isNaN(n) && n >= 0 && n <= 30) {
                setGoal2(n);
              }
            }}
            disabled={isReadOnly || isPending}
            className={`mt-1 w-16 rounded-lg border px-2 py-1.5 text-center text-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/50 ${
              isReadOnly
                ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                : "border-gray-300 bg-white text-gray-900 hover:border-crimson/30"
            }`}
            aria-label={`Goals for ${team2}`}
          />
        </div>
      </div>

      {/* Save button & feedback */}
      <div className="mt-4 flex items-center justify-end gap-3">
        {feedback && (
          <span
            className={`text-sm ${
              feedback.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {feedback.message}
          </span>
        )}

        {!isReadOnly && (
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/50 ${
              canSave
                ? "bg-crimson text-white hover:bg-crimson/90 active:bg-wine"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        )}
      </div>
    </div>
  );
}
