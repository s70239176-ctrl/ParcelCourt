"use client";

import { useState, type FormEvent, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { openClaim } from "@/lib/genlayer";

type State = "idle" | "pending" | "error";

const FIELD_STYLE: CSSProperties = {
  width: "100%",
  fontFamily: "var(--sans)",
  fontSize: "0.9rem",
  padding: "10px 12px",
  border: "1px solid var(--hairline-strong)",
  background: "var(--paper)",
  color: "var(--ink)",
};

const LABEL_STYLE: CSSProperties = {
  display: "block",
  fontFamily: "var(--sans)",
  fontSize: "0.78rem",
  letterSpacing: "0.06em",
  color: "var(--ink-soft)",
  marginBottom: 6,
};

export default function NewClaimForm() {
  const [orderId, setOrderId] = useState("");
  const [sku, setSku] = useState("");
  const [amount, setAmount] = useState("");
  const [seller, setSeller] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setState("error");
      setError("Amount must be a positive number of dollars.");
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(seller.trim())) {
      setState("error");
      setError('Seller must be a 0x-prefixed 40-character hex address, e.g. "0x1234...".');
      return;
    }

    setState("pending");
    try {
      const amountCents = Math.round(dollars * 100);
      const newId = await openClaim({
        orderId: orderId.trim(),
        sku: sku.trim(),
        amountCents,
        seller: seller.trim(),
        trackingUrl: trackingUrl.trim(),
        listingUrl: listingUrl.trim(),
      });
      router.push(`/claims/${newId}`);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Opening the claim failed.");
    }
  }

  const disabled = state === "pending";

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, display: "grid", gap: 20 }}>
      <div>
        <label style={LABEL_STYLE} htmlFor="order_id">
          ORDER ID
        </label>
        <input
          id="order_id"
          required
          disabled={disabled}
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="ORD-4821"
          style={FIELD_STYLE}
        />
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="sku">
          SKU
        </label>
        <input
          id="sku"
          required
          disabled={disabled}
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="EARBUD-WHT-01"
          style={FIELD_STYLE}
        />
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="amount">
          AMOUNT (USD)
        </label>
        <input
          id="amount"
          required
          disabled={disabled}
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="89.00"
          style={FIELD_STYLE}
        />
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="seller">
          SELLER ADDRESS
        </label>
        <input
          id="seller"
          required
          disabled={disabled}
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          placeholder="0x..."
          style={{ ...FIELD_STYLE, fontFamily: "monospace" }}
        />
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="tracking_url">
          TRACKING URL
        </label>
        <input
          id="tracking_url"
          required
          disabled={disabled}
          type="url"
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="https://track.example/..."
          style={FIELD_STYLE}
        />
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="listing_url">
          LISTING URL
        </label>
        <input
          id="listing_url"
          required
          disabled={disabled}
          type="url"
          value={listingUrl}
          onChange={(e) => setListingUrl(e.target.value)}
          placeholder="https://listing.example/..."
          style={FIELD_STYLE}
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={disabled}
          style={{
            fontFamily: "var(--sans)",
            fontSize: "0.85rem",
            padding: "10px 18px",
            border: "1.5px solid var(--ink)",
            background: disabled ? "var(--paper-dim)" : "transparent",
            cursor: disabled ? "default" : "pointer",
          }}
        >
          {state === "pending" ? "Opening claim…" : "Open claim"}
        </button>
        {state === "error" && (
          <p style={{ color: "var(--oxblood)", fontSize: "0.8rem", marginTop: 8, maxWidth: 400 }}>
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
