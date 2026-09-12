"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adjudicate } from "@/lib/genlayer";

type State = "idle" | "pending" | "error";

export default function AdjudicateButton({ claimId }: { claimId: number }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setState("pending");
    setError(null);
    try {
      await adjudicate(claimId);
      router.refresh();
      setState("idle");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Adjudication failed.");
    }
  }

  return (
    <div style={{ textAlign: "right" }}>
      <button
        onClick={handleClick}
        disabled={state === "pending"}
        style={{
          fontFamily: "var(--sans)",
          fontSize: "0.85rem",
          padding: "10px 18px",
          border: "1.5px solid var(--ink)",
          background: state === "pending" ? "var(--paper-dim)" : "transparent",
          cursor: state === "pending" ? "default" : "pointer",
        }}
      >
        {state === "pending" ? "Awaiting equivalence…" : "Run adjudication"}
      </button>
      {state === "error" && (
        <p style={{ color: "var(--oxblood)", fontSize: "0.8rem", marginTop: 8, maxWidth: 260 }}>
          Fetch failed: {error}
        </p>
      )}
    </div>
  );
}
