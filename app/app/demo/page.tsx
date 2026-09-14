import Link from "next/link";
import { FIXTURE_CLAIMS } from "@/lib/fixtures";
import { caseId } from "@/components/DocketRow";
import StatusBadge from "@/components/StatusBadge";

export default function DemoPage() {
  return (
    <div>
      <p className="field-label" style={{ marginBottom: 6 }}>
        Reference fixtures
      </p>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Three fixtures</h1>
      <p style={{ color: "var(--graphite)", marginBottom: 40, maxWidth: 560, lineHeight: 1.6 }}>
        Same SKU, same $89.00 wireless earbuds, three different inbound
        conditions. Same rubric, three different verdicts.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1 }}>
        {FIXTURE_CLAIMS.map((claim) => (
          <Link
            key={claim.id}
            href={`/claims/${claim.id}`}
            className="row-interactive"
            style={{
              textDecoration: "none",
              color: "inherit",
              border: "1px solid var(--line)",
              padding: 24,
              display: "block",
            }}
          >
            <p className="mono" style={{ fontSize: "0.74rem", color: "var(--graphite)", marginBottom: 14 }}>
              {caseId(claim.id)}
            </p>
            <StatusBadge status={claim.status} verdict={claim.verdict} size="large" />
            <p style={{ fontSize: "0.85rem", marginTop: 16, lineHeight: 1.6, color: "var(--graphite)" }}>
              {claim.rationale.slice(0, 140)}…
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
