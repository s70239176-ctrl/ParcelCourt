import type { Claim, EvidenceRow } from "@/lib/fixtures";
import EvidenceItem from "./EvidenceItem";
import StatusBadge from "./StatusBadge";

function Column({
  number,
  label,
  rows,
  emptyText,
}: {
  number: string;
  label: string;
  rows: EvidenceRow[];
  emptyText: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
        <span className="mono" style={{ fontSize: "0.78rem", color: "var(--graphite-soft)" }}>
          {number}
        </span>
        <h4 style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}>{label}</h4>
      </div>
      {rows.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: "var(--graphite)" }}>{emptyText}</p>
      ) : (
        rows.map((row, i) => <EvidenceItem key={i} row={row} />)
      )}
    </div>
  );
}

export default function EvidenceColumns({ claim }: { claim: Claim }) {
  const listing = claim.evidence.filter((e) => e.role === "seller");
  const transit = claim.evidence.filter((e) => e.role === "carrier");
  // Warehouse inspection is post-transit, pre-verdict — grouped with the
  // buyer's own arrival evidence rather than given a fifth column.
  const arrival = claim.evidence.filter((e) => e.role === "buyer" || e.role === "warehouse");

  return (
    <div
      className="evidence-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 32,
        paddingTop: 28,
        borderTop: "1px solid var(--line-strong)",
      }}
    >
      <Column number="01" label="Listing" rows={listing} emptyText="No seller evidence submitted." />
      <Column number="02" label="Transit" rows={transit} emptyText="No carrier exception on record." />
      <Column number="03" label="Arrival" rows={arrival} emptyText="No arrival evidence submitted." />

      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--graphite-soft)" }}>
            04
          </span>
          <h4 style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}>Verdict</h4>
        </div>
        <StatusBadge status={claim.status} verdict={claim.verdict} size="large" />
        {claim.status === "SETTLED" && (
          <p style={{ fontSize: "0.8rem", color: "var(--graphite)", marginTop: 10, lineHeight: 1.5 }}>
            {claim.rationale.slice(0, 90)}…
          </p>
        )}
      </div>
    </div>
  );
}
