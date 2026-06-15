"use client";

import { useState, useTransition } from "react";
import {
  createExtraPrediction,
  editExtraPrediction,
  deleteExtraPrediction,
  type PaymentMethod,
} from "@/app/portal/actions";
import { uploadReceipt, deleteReceipt } from "@/lib/supabase/storage";

// ─── Types ──────────────────────────────────────────────

export interface ExtraBetData {
  betId: number;
  betGoalTeam1: number;
  betGoalTeam2: number;
  paymentValidated: boolean;
  receiptUrl: string | null; // null = credit-based
  createdAt: string;
}

interface ExtraPredictionPanelProps {
  matchId: string;
  userId: string;
  isLocked: boolean;
  availableCredits: number;
  extraBets: ExtraBetData[];
}

// ─── Component ──────────────────────────────────────────

export function ExtraPredictionPanel({
  matchId,
  userId,
  isLocked,
  availableCredits,
  extraBets,
}: ExtraPredictionPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ── New prediction form state ──
  const [showForm, setShowForm] = useState(false);
  const [goal1, setGoal1] = useState<number | "">("");
  const [goal2, setGoal2] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("receipt");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── Editing state ──
  const [editingBetId, setEditingBetId] = useState<number | null>(null);
  const [editGoal1, setEditGoal1] = useState<number | "">("");
  const [editGoal2, setEditGoal2] = useState<number | "">("");
  const [editReceiptFile, setEditReceiptFile] = useState<File | null>(null);

  // ── Deleting state ──
  const [deletingBetId, setDeletingBetId] = useState<number | null>(null);

  const canCreate =
    goal1 !== "" &&
    goal2 !== "" &&
    !isLocked &&
    !isPending &&
    !uploading &&
    (paymentMethod === "credit" || receiptFile !== null);

  // ── Create ────────────────────────────────────────────

  function handleCreate() {
    if (!canCreate) return;
    if (typeof goal1 !== "number" || typeof goal2 !== "number") return;

    setFeedback(null);
    startTransition(async () => {
      let receiptUrl: string | undefined;

      if (paymentMethod === "receipt" && receiptFile) {
        setUploading(true);
        const result = await uploadReceipt(receiptFile, userId, matchId);
        setUploading(false);

        if (result.error) {
          setFeedback({ type: "error", message: result.error });
          return;
        }
        receiptUrl = result.url!;
      }

      const result = await createExtraPrediction(
        matchId,
        goal1,
        goal2,
        paymentMethod,
        receiptUrl,
      );

      if (result.success) {
        setFeedback({ type: "success", message: "Extra prediction saved!" });
        setGoal1("");
        setGoal2("");
        setReceiptFile(null);
        setShowForm(false);
      } else {
        setFeedback({ type: "error", message: result.error ?? "Failed." });
      }
    });
  }

  // ── Edit ──────────────────────────────────────────────

  function startEdit(bet: ExtraBetData) {
    setEditingBetId(bet.betId);
    setEditGoal1(bet.betGoalTeam1);
    setEditGoal2(bet.betGoalTeam2);
    setEditReceiptFile(null);
    setFeedback(null);
  }

  function cancelEdit() {
    setEditingBetId(null);
    setEditGoal1("");
    setEditGoal2("");
    setEditReceiptFile(null);
  }

  const canSaveEdit =
    editingBetId !== null &&
    editGoal1 !== "" &&
    editGoal2 !== "" &&
    typeof editGoal1 === "number" &&
    typeof editGoal2 === "number" &&
    !isPending;

  function handleSaveEdit(bet: ExtraBetData) {
    if (!canSaveEdit || editingBetId === null) return;

    setFeedback(null);
    startTransition(async () => {
      let receiptUrl: string | undefined;

      // If receipt-based and a new file was selected, upload it
      if (bet.receiptUrl !== null && editReceiptFile) {
        setUploading(true);
        const result = await uploadReceipt(editReceiptFile, userId, matchId);
        setUploading(false);

        if (result.error) {
          setFeedback({ type: "error", message: result.error });
          return;
        }
        receiptUrl = result.url!;

        // Delete old receipt after successful upload
        await deleteReceipt(bet.receiptUrl);
      }

      const result = await editExtraPrediction(
        editingBetId,
        editGoal1 as number,
        editGoal2 as number,
        receiptUrl,
      );

      if (result.success) {
        setFeedback({ type: "success", message: "Prediction updated!" });
        cancelEdit();
      } else {
        setFeedback({ type: "error", message: result.error ?? "Failed." });
      }
    });
  }

  // ── Delete ────────────────────────────────────────────

  function handleDelete(bet: ExtraBetData) {
    setFeedback(null);
    setDeletingBetId(bet.betId);
    startTransition(async () => {
      const result = await deleteExtraPrediction(bet.betId);

      if (result.success) {
        // Clean up receipt file if receipt-based
        if (bet.receiptUrl) {
          await deleteReceipt(bet.receiptUrl);
        }
        setFeedback({ type: "success", message: "Prediction deleted." });
      } else {
        setFeedback({ type: "error", message: result.error ?? "Failed." });
      }
      setDeletingBetId(null);
    });
  }

  // ── Helpers ───────────────────────────────────────────

  function paymentLabel(bet: ExtraBetData): string {
    return bet.receiptUrl === null ? "Credit" : "Receipt";
  }

  function paymentIcon(bet: ExtraBetData): string {
    return bet.receiptUrl === null ? "🎫" : "🧾";
  }

  // ── Render ────────────────────────────────────────────

  return (
    <div className="mt-3 border-t border-amber-200 pt-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wide text-amber-700">
          Daily Pool
        </h4>
        {!isLocked && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setFeedback(null);
            }}
            className="text-[11px] font-medium text-amber-700 underline-offset-2 hover:underline"
          >
            {showForm ? "Cancel" : "+ New Entry"}
          </button>
        )}
      </div>

      {/* ── Existing entries ── */}
      {extraBets.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {extraBets.map((bet) => (
            <li
              key={bet.betId}
              className={`rounded-md border px-2.5 py-1.5 text-xs ${
                bet.paymentValidated
                  ? "border-green-200 bg-green-50/40"
                  : "border-gray-200 bg-gray-50/60"
              }`}
            >
              {editingBetId === bet.betId ? (
                /* ── Edit mode ── */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={editGoal1}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          setEditGoal1("");
                          return;
                        }
                        const n = Number.parseInt(v, 10);
                        if (!Number.isNaN(n) && n >= 0 && n <= 30)
                          setEditGoal1(n);
                      }}
                      disabled={isPending || uploading}
                      className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-crimson/40"
                      aria-label="Edit team 1 goals"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={editGoal2}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          setEditGoal2("");
                          return;
                        }
                        const n = Number.parseInt(v, 10);
                        if (!Number.isNaN(n) && n >= 0 && n <= 30)
                          setEditGoal2(n);
                      }}
                      disabled={isPending || uploading}
                      className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-crimson/40"
                      aria-label="Edit team 2 goals"
                    />
                    <span className="text-[10px] text-gray-400">
                      {paymentLabel(bet)}
                    </span>

                    {/* Replace receipt (receipt-based only) */}
                    {bet.receiptUrl !== null && (
                      <label className="cursor-pointer text-[10px] text-crimson hover:underline">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setEditReceiptFile(f);
                          }}
                        />
                        {editReceiptFile
                          ? editReceiptFile.name.slice(0, 16) + "…"
                          : "New receipt"}
                      </label>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(bet)}
                      disabled={!canSaveEdit || uploading}
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        canSaveEdit && !uploading
                          ? "bg-crimson text-white hover:bg-crimson/90"
                          : "cursor-not-allowed bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isPending || uploading ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={isPending}
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-gray-500 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-800">
                      {bet.betGoalTeam1} – {bet.betGoalTeam2}
                    </span>
                    <span title={paymentLabel(bet)}>{paymentIcon(bet)}</span>
                    {bet.receiptUrl && (
                      <a
                        href={bet.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-gray-400 underline-offset-2 hover:text-crimson hover:underline"
                      >
                        View
                      </a>
                    )}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        bet.paymentValidated
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {bet.paymentValidated ? "Validated" : "Pending"}
                    </span>
                  </div>

                  {/* Actions (only when not validated and not locked) */}
                  {!bet.paymentValidated && !isLocked && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(bet)}
                        disabled={isPending || deletingBetId === bet.betId}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bet)}
                        disabled={isPending || deletingBetId === bet.betId}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingBetId === bet.betId ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── No entries message ── */}
      {extraBets.length === 0 && !showForm && (
        <p className="text-[11px] text-gray-400">
          No Daily Pool entries yet. Add one to compete for prizes.
        </p>
      )}

      {/* ── New entry form ── */}
      {showForm && (
        <div className="rounded-md border border-amber-200 bg-amber-50/30 p-3">
          {/* Score inputs */}
          <div className="mb-2 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={30}
              placeholder="0"
              value={goal1}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setGoal1("");
                  return;
                }
                const n = Number.parseInt(v, 10);
                if (!Number.isNaN(n) && n >= 0 && n <= 30) setGoal1(n);
              }}
              disabled={isPending || uploading}
              className="w-14 rounded border border-gray-300 px-1.5 py-1 text-center text-lg font-bold focus:outline-none focus:ring-1 focus:ring-crimson/40"
              aria-label="Team 1 goals"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min={0}
              max={30}
              placeholder="0"
              value={goal2}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setGoal2("");
                  return;
                }
                const n = Number.parseInt(v, 10);
                if (!Number.isNaN(n) && n >= 0 && n <= 30) setGoal2(n);
              }}
              disabled={isPending || uploading}
              className="w-14 rounded border border-gray-300 px-1.5 py-1 text-center text-lg font-bold focus:outline-none focus:ring-1 focus:ring-crimson/40"
              aria-label="Team 2 goals"
            />
          </div>

          {/* Payment method toggle */}
          <div className="mb-2 flex gap-1">
            <button
              type="button"
              onClick={() => {
                setPaymentMethod("receipt");
                setFeedback(null);
              }}
              className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                paymentMethod === "receipt"
                  ? "bg-crimson text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              🧾 Receipt
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMethod("credit");
                setFeedback(null);
              }}
              disabled={availableCredits < 1}
              className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                paymentMethod === "credit"
                  ? "bg-crimson text-white"
                  : availableCredits < 1
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              🎫 Credit{availableCredits > 0 ? ` (${availableCredits})` : ""}
            </button>
          </div>

          {/* Receipt upload */}
          {paymentMethod === "receipt" && (
            <div className="mb-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-gray-600 hover:text-crimson">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setReceiptFile(f);
                    setFeedback(null);
                  }}
                />
                <span className="rounded border border-gray-300 px-2 py-1 hover:border-crimson/40">
                  {receiptFile
                    ? receiptFile.name.length > 28
                      ? receiptFile.name.slice(0, 25) + "…"
                      : receiptFile.name
                    : "Choose receipt image"}
                </span>
              </label>
              <p className="mt-0.5 text-[10px] text-gray-400">
                JPG, PNG, WEBP · Max 5 MB
              </p>
            </div>
          )}

          {/* Credit info */}
          {paymentMethod === "credit" && (
            <p className="mb-2 text-[10px] text-gray-500">
              Uses 1 credit · {availableCredits} available after this entry
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className={`w-full rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
              canCreate
                ? "bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {uploading
              ? "Uploading receipt..."
              : isPending
                ? "Saving..."
                : "Enter Daily Pool"}
          </button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <p
          className={`mt-2 text-center text-[11px] font-medium ${
            feedback.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
