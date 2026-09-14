import type { EvidenceRow } from "@/lib/fixtures";
import EvidenceHero from "./EvidenceHero";

export default function ObservedEvidence({ buyerRows }: { buyerRows: EvidenceRow[] }) {
  const primary = buyerRows[0];

  return (
    <div>
      <p className="field-label" style={{ marginBottom: 4, color: primary ? "var(--signal)" : "var(--graphite)" }}>
        What arrived
      </p>
      <h3 style={{ fontSize: "1.15rem", marginBottom: 18 }}>Buyer evidence · observed</h3>

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
          }}
        >
          No buyer evidence submitted yet.
        </div>
      )}
    </div>
  );
}
