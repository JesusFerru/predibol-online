"use client";

import { verifyPayment } from "@/app/payment-pending/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function VerifyPaymentButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleVerify() {
    setMessage(null);
    startTransition(async () => {
      const result = await verifyPayment();
      if (result.paid) {
        router.push("/portal");
      } else {
        setMessage("Payment not yet received. Please contact the administrator.");
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleVerify}
        disabled={isPending}
        className="rounded-full bg-crimson px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-crimson/90 focus:outline-none focus:ring-2 focus:ring-crimson/50 disabled:opacity-60"
      >
        {isPending ? "Checking..." : "Verify Payment"}
      </button>

      {message && (
        <p className="max-w-xs text-center text-sm text-amber-300">
          {message}
        </p>
      )}
    </div>
  );
}
