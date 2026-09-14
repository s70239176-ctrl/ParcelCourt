"use client";

import { useState } from "react";
import type { EvidenceRow } from "@/lib/fixtures";

export default function EvidenceHero({ row }: { row: EvidenceRow }) {
  const [imageFailed, setImageFailed] = useState(false);
  const canTryImage = !imageFailed && (row.image || row.uri.startsWith("http"));
  const imageSrc = row.image ?? row.uri;

  return (
    <div style={{ marginBottom: 14 }}>
      {canTryImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageSrc}
          alt={row.note}
          onError={() => setImageFailed(true)}
          style={{
            width: "100%",
            aspectRatio: "3 / 2",
            objectFit: "cover",
            display: "block",
            border: "1px solid var(--line-strong)",
            marginBottom: 12,
          }}
        />
      ) : (
        <a
          href={row.uri}
          target="_blank"
          rel="noreferrer"
          className="link-underline"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            aspectRatio: "3 / 2",
            border: "1px solid var(--line-strong)",
            fontSize: "0.85rem",
            marginBottom: 12,
          }}
        >
          View evidence source ↗
        </a>
      )}
      <p style={{ fontSize: "0.92rem", lineHeight: 1.5 }}>{row.note}</p>
      {row.weight_g > 0 && (
        <p className="mono" style={{ fontSize: "0.8rem", color: "var(--graphite)", marginTop: 6 }}>
          {row.weight_g}g
        </p>
      )}
    </div>
  );
}
