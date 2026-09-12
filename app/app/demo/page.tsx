import Link from "next/link";
import { FIXTURE_CLAIMS } from "@/lib/fixtures";
import VerdictChip from "@/components/VerdictChip";

export default function DemoPage() {
  return (
    <div>
      <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Three fixtures</h2>
      <p style={{ color: "var(--ink-soft)", marginBottom: 32, maxWidth: 600, lineHeight: 1.6 }}>
        Same SKU, same $89.00 wireless earbuds, three different inbound
        conditions. Same rubric, three different verdicts.
      </p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {FIXTURE_CLAIMS.map((claim, i) => (
          <Link
            key={claim.id}
            href={`/claims/${claim.id}`}
            style={{
              flex: "1 1 260px",
              textDecoration: "none",
              color: "inherit",
              border: "1px solid var(--hairline-strong)",
              padding: 20,
              display: "block",
            }}
          >
            <p
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                color: "var(--ink-soft)",
                marginBottom: 12,
              }}
            >
              CLAIM {claim.id} · FIXTURE {String(i + 1).padStart(2, "0")}
            </p>
            <VerdictChip verdict={claim.verdict as any} animate={false} />
            <p style={{ fontSize: "0.85rem", marginTop: 16, lineHeight: 1.6, color: "var(--ink-soft)" }}>
              {claim.rationale.slice(0, 140)}…
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
