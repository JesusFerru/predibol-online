"use client";

import { savePrediction } from "@/app/portal/actions";
import { useState, useTransition } from "react";

interface ExistingBet {
  betgoalteam1: number;
  betgoalteam2: number;
}

export interface PredictionCardProps {
  matchId: string;
  team1: string;
  team2: string;
  team1Flag: string;
  team2Flag: string;
  team1Code: string;
  team2Code: string;
  scheduleAt: string | null;
  matchStatus: string;
  group: string;
  round: string;
  ground: string;
  existingBet: ExistingBet | null;
  isLocked: boolean;
}

export function PredictionCard({
  matchId,
  team1,
  team2,
  team1Flag,
  team2Flag,
  team1Code,
  team2Code,
  scheduleAt,
  matchStatus,
  group,
  round,
  ground,
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

  const bothFilled = goal1 !== "" && goal2 !== "";

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

  const isFinished = matchStatus === "FINISHED";
  const isCanceled = matchStatus === "CANCELED";
  const isReadOnly = isLocked || isFinished || isCanceled;

  const hasFlags = team1Flag !== "" && team2Flag !== "";

  return (
    <div
      className={`relative rounded-xl border-2 bg-white shadow-sm transition-shadow hover:shadow-md ${
        isLocked && !isFinished
          ? "border-amber-300 bg-amber-50/20"
          : isFinished
            ? "border-gray-200 bg-gray-50/40"
            : isCanceled
              ? "border-red-200 bg-red-50/20"
              : "border-gray-100"
      }`}
    >
      {/* ── Top bar: group badge + stadium + time ── */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {group && (
            <span className="shrink-0 rounded-full bg-crimson/10 px-2 py-0.5 text-[11px] font-semibold text-crimson">
              {group}
            </span>
          )}
          {round && !group && (
            <span className="shrink-0 rounded-full bg-crimson/10 px-2 py-0.5 text-[11px] font-semibold text-crimson">
              {round}
            </span>
          )}
          <span className="truncate text-xs text-gray-400">
            {ground}{" · "}
            {formatTime(scheduleAt)}
          </span>
        </div>

        {/* Status badge */}
        {isLocked && !isFinished && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            Locked
          </span>
        )}
        {isFinished && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
            Finished
          </span>
        )}
        {isCanceled && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
            Canceled
          </span>
        )}
      </div>

      {/* ── Body: flags + names + inputs ── */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          {/* ── Team 1 ── */}
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <span className="text-3xl leading-none" aria-hidden>
              {hasFlags ? team1Flag : team1Code}
            </span>
            <span className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
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
              className={`mt-0.5 w-14 rounded-lg border px-1.5 py-1 text-center text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/40 ${
                isReadOnly
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-gray-300 bg-white text-gray-900 hover:border-crimson/30"
              }`}
              aria-label={`Goals for ${team1}`}
            />
          </div>

          {/* ── VS ── */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300">
              VS
            </span>
            {!hasFlags && (
              <span className="text-[10px] font-medium text-gray-400">
                {team1Code} – {team2Code}
              </span>
            )}
          </div>

          {/* ── Team 2 ── */}
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <span className="text-3xl leading-none" aria-hidden>
              {hasFlags ? team2Flag : team2Code}
            </span>
            <span className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
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
              className={`mt-0.5 w-14 rounded-lg border px-1.5 py-1 text-center text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/40 ${
                isReadOnly
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-gray-300 bg-white text-gray-900 hover:border-crimson/30"
              }`}
              aria-label={`Goals for ${team2}`}
            />
          </div>
        </div>

        {/* ── Save button & feedback ── */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {feedback && (
            <span
              className={`text-xs font-medium ${
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
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-crimson/40 ${
                canSave
                  ? "bg-crimson text-white hover:bg-crimson/90 active:bg-wine"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          )}
        </div>

        {/* ── Locked explanation ── */}
        {isLocked && !isFinished && existingBet && (
          <p className="mt-2 text-center text-[11px] text-amber-600">
            Saved: {existingBet.betgoalteam1} – {existingBet.betgoalteam2}
            {" · "}Deadline passed, predictions are locked.
          </p>
        )}
        {isLocked && !isFinished && !existingBet && (
          <p className="mt-2 text-center text-[11px] text-amber-600">
            Deadline passed. No prediction was saved.
          </p>
        )}
      </div>
    </div>
  );
}
