"use client";

/**
 * Popup shown before a vote is sent. The visitor waits a few seconds, then
 * clicks "Close and vote": that click opens the Monetag SmartLink in a new
 * tab (same pattern as the leave-site gate) and sends the vote. Escape, the
 * backdrop or Cancel drops the vote instead.
 * No AdSense unit is used inside this popup (AdSense does not allow its ad
 * code in popups). If no SmartLink is set, VOTE_AD_ENABLED is false and votes
 * go through with no popup.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MONETAG_SMARTLINK } from "@/lib/config/monetag";

const CLOSE_DELAY_SECONDS = 3;
const AD_URL = /^https:\/\//.test(MONETAG_SMARTLINK) ? MONETAG_SMARTLINK : null;

export const VOTE_AD_ENABLED = AD_URL !== null;

export default function VoteAdGate({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(CLOSE_DELAY_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  const ready = secondsLeft <= 0;

  function confirm() {
    if (!ready) return;
    if (AD_URL) window.open(AD_URL, "_blank", "noopener");
    onConfirm();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Advertisement before your vote"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 text-center shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-signal">One moment</p>
        <h2 className="mb-2 font-display text-lg font-bold text-ink">Thanks for checking this report</h2>
        <p className="mb-4 text-sm text-muted">Your vote helps other visitors. It is sent when you close this.</p>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-muted hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!ready}
            className={
              "rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors " +
              (ready ? "bg-signal text-white hover:bg-signal-dark" : "cursor-default bg-line text-muted")
            }
          >
            {ready ? "Close and vote" : "Close in " + secondsLeft}
          </button>
        </div>

        {AD_URL && ready && <p className="mt-3 text-xs text-muted">A sponsor page opens in a new tab.</p>}
      </div>
    </div>,
    document.body
  );
}