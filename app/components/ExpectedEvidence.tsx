import type { Claim, EvidenceRow } from "@/lib/fixtures";
import EvidenceHero from "./EvidenceHero";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ExpectedEvidence({ claim, sellerRows }: { claim: Claim; sellerRows: EvidenceRow[] }) {
  const primary = sellerRows[0];

  return (
    <div>
      <p className="field-label" style={{ marginBottom: 4 }}>
        What was sold
      </p>
      <h3 style={{ fontSize: "1.15rem", marginBottom: 18 }}>Listing · expected</h3>

      {primary ? (
        <EvidenceHero row={primary} />
      ) : (
        <div
          style={{
            border: "1px dashed var(--line-strong)",
            padding: "40px 16px",
            textAlign: "center",
            fontSize: "0.85rem",
            color: "var(--graphite)",
            marginBottom: 14,
          }}
        >
          No seller evidence submitted yet.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <a
          href={claim.listing_url}
          target="_blank"
          rel="noreferrer"
          className="link-underline mono"
          style={{ fontSize: "0.78rem" }}
        >
          View listing ↗
        </a>
        <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{centsToDollars(claim.amount_cents)}</span>
      </div>
    </div>
  );
}
