"use client";

import { useState } from "react";
import type { EvidenceRow } from "@/lib/fixtures";

const ROLE_LABEL: Record<EvidenceRow["role"], string> = {
  seller: "Seller",
  carrier: "Carrier",
  buyer: "Buyer",
  warehouse: "Warehouse",
};

function shortHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export default function EvidenceItem({ row }: { row: EvidenceRow }) {
  const [imageFailed, setImageFailed] = useState(false);
  // ipfs:// has no native browser rendering — don't even attempt <img> for it.
  const canTryImage = !imageFailed && (row.image || row.uri.startsWith("http"));
  const imageSrc = row.image ?? row.uri;

  return (
    <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--line)" }}>
      {canTryImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageSrc}
          alt={row.note}
          onError={() => setImageFailed(true)}
          style={{ width: "100%", display: "block", border: "1px solid var(--line-strong)", marginBottom: 10 }}
        />
      ) : (
        <a
          href={row.uri}
          target="_blank"
          rel="noreferrer"
          className="link-underline"
          style={{
            display: "block",
            border: "1px solid var(--line-strong)",
            padding: "14px 12px",
            fontSize: "0.82rem",
            marginBottom: 10,
          }}
        >
          View evidence source ↗
        </a>
      )}

      <p style={{ fontSize: "0.85rem", lineHeight: 1.5, marginBottom: 8 }}>{row.note}</p>

      <dl style={{ display: "grid", gap: 3, fontSize: "0.74rem", color: "var(--graphite)" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <dt className="field-label" style={{ fontSize: "0.68rem" }}>
            Source
          </dt>
          <dd>{ROLE_LABEL[row.role]}</dd>
        </div>
        {row.weight_g > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            <dt className="field-label" style={{ fontSize: "0.68rem" }}>
              Weight
            </dt>
            <dd className="mono">{row.weight_g}g</dd>
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <dt className="field-label" style={{ fontSize: "0.68rem" }}>
            Hash
          </dt>
          <dd className="mono">{shortHash(row.sha256)}</dd>
        </div>
      </dl>
    </div>
  );
}
