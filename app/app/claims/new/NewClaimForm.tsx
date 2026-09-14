"use client";

import { useState, type FormEvent, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { openClaim } from "@/lib/genlayer";
import { caseId } from "@/components/DocketRow";

type State = "idle" | "pending" | "error" | "done";

const FIELD_STYLE: CSSProperties = {
  width: "100%",
  fontFamily: "var(--sans)",
  fontSize: "0.92rem",
  padding: "11px 12px",
  border: "1px solid var(--line-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
};

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
        <span className="mono" style={{ fontSize: "0.8rem", color: "var(--graphite-soft)" }}>
          {number}
        </span>
        <p className="field-label">{title}</p>
      </div>
      <div style={{ display: "grid", gap: 16 }}>{children}</div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        style={{ display: "block", fontSize: "0.82rem", color: "var(--graphite)", marginBottom: 6 }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function NewClaimForm() {
  const [orderId, setOrderId] = useState("");
  const [sku, setSku] = useState("");
  const [amount, setAmount] = useState("");
  const [seller, setSeller] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [newId, setNewId] = useState<number | null>(null);

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
      const id = await openClaim({
        orderId: orderId.trim(),
        sku: sku.trim(),
        amountCents,
        seller: seller.trim(),
        trackingUrl: trackingUrl.trim(),
        listingUrl: listingUrl.trim(),
      });
      setNewId(id);
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Opening the claim failed.");
    }
  }

  if (state === "done" && newId !== null) {
    return (
      <div style={{ maxWidth: 480 }}>
        <p className="field-label" style={{ marginBottom: 10 }}>
          Claim opened
        </p>
        <div className="case-id" style={{ fontSize: "2.8rem", marginBottom: 16 }}>
          {caseId(newId)}
        </div>
        <p style={{ color: "var(--graphite)", marginBottom: 28 }}>
          Case created. Waiting for evidence and adjudication.
        </p>
        <Link
          href={`/claims/${newId}`}
          style={{
            display: "inline-block",
            fontSize: "0.85rem",
            fontWeight: 600,
            padding: "10px 20px",
            border: "1.5px solid var(--ink)",
            textDecoration: "none",
            color: "var(--ink)",
          }}
        >
          View case →
        </Link>
      </div>
    );
  }

  const disabled = state === "pending";
  const dollarsValid = Number(amount) > 0;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
      <Section number="01" title="Order">
        <Field label="Order ID" htmlFor="order_id">
          <input
            id="order_id"
            required
            disabled={disabled}
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="ORD-4821"
            style={FIELD_STYLE}
          />
        </Field>
        <Field label="SKU" htmlFor="sku">
          <input
            id="sku"
            required
            disabled={disabled}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="EARBUD-WHT-01"
            style={FIELD_STYLE}
          />
        </Field>
        <Field label="Amount (USD)" htmlFor="amount">
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
        </Field>
      </Section>

      <Section number="02" title="Merchant">
        <Field label="Seller address" htmlFor="seller">
          <input
            id="seller"
            required
            disabled={disabled}
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            placeholder="0x..."
            className="mono"
            style={FIELD_STYLE}
          />
        </Field>
      </Section>

      <Section number="03" title="Verification sources">
        <Field label="Tracking URL" htmlFor="tracking_url">
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
        </Field>
        <Field label="Listing URL" htmlFor="listing_url">
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
        </Field>
      </Section>

      <Section number="04" title="Review">
        <div style={{ border: "1px solid var(--line)", padding: 16, fontSize: "0.85rem", display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--graphite)" }}>Order</span>
            <span>
              {orderId || "—"} {sku && `· ${sku}`}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--graphite)" }}>Amount</span>
            <span style={{ fontWeight: 600 }}>{dollarsValid ? `$${Number(amount).toFixed(2)}` : "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "var(--graphite)" }}>Seller</span>
            <span className="mono" style={{ fontSize: "0.78rem", textAlign: "right" }}>
              {seller || "—"}
            </span>
          </div>
          <p style={{ color: "var(--graphite)", fontSize: "0.78rem", marginTop: 6 }}>
            You&rsquo;ll be recorded as the buyer, using your connected wallet.
          </p>
        </div>

        <div style={{ marginTop: 8 }}>
          <button
            type="submit"
            disabled={disabled}
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 600,
              fontSize: "0.88rem",
              padding: "12px 22px",
              border: "1.5px solid var(--ink)",
              background: disabled ? "var(--line)" : "var(--ink)",
              color: disabled ? "var(--ink)" : "var(--surface)",
              cursor: disabled ? "default" : "pointer",
            }}
          >
            {state === "pending" ? "Opening claim…" : "Open claim"}
          </button>
          {state === "error" && (
            <p style={{ color: "var(--signal)", fontSize: "0.8rem", marginTop: 10, maxWidth: 400 }}>{error}</p>
          )}
        </div>
      </Section>
    </form>
  );
}
