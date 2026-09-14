import Link from "next/link";
import StatusBadge from "./StatusBadge";
import type { Claim } from "@/lib/fixtures";

export function caseId(id: number) {
  return `PC-${String(id).padStart(5, "0")}`;
}

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function DocketRow({ claim }: { claim: Claim }) {
  return (
    <Link
      href={`/claims/${claim.id}`}
      className="row-interactive docket-row-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1.4fr 0.8fr 1.4fr",
        alignItems: "center",
        gap: 16,
        padding: "18px 16px",
        borderBottom: "1px solid var(--line)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>{caseId(claim.id)}</span>

      <span className="mono" style={{ fontSize: "0.82rem", color: "var(--graphite)" }}>
        {claim.order_id} · {claim.sku}
      </span>

      <span style={{ fontWeight: 600 }}>{centsToDollars(claim.amount_cents)}</span>

      <span style={{ display: "flex", justifyContent: "flex-end" }}>
        <StatusBadge status={claim.status} verdict={claim.verdict} />
      </span>
    </Link>
  );
}
