import Link from "next/link";
import { listClaims } from "@/lib/genlayer";
import type { Claim } from "@/lib/fixtures";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusLabel(claim: Claim) {
  if (claim.status === "OPEN") return "Awaiting evidence";
  if (claim.status === "ADJUDICATED") return "Awaiting equivalence";
  return "Intelligent Contract · equivalence reached";
}

export default async function DocketPage() {
  const claims = await listClaims();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.4rem" }}>The docket</h2>
        <p style={{ color: "var(--ink-soft)", marginTop: 6, maxWidth: 560 }}>
          Every open and settled claim, condition-on-arrival only. Click a
          claim to see the evidence columns and the rationale behind its
          verdict.
        </p>
      </div>

      {claims.length === 0 ? (
        <div
          className="hairline"
          style={{
            border: "1px dashed var(--hairline-strong)",
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--ink-soft)",
          }}
        >
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.1rem" }}>
            No claims on the docket yet.
          </p>
          <p style={{ marginTop: 8, fontSize: "0.9rem" }}>
            <Link href="/claims/new" style={{ textDecoration: "underline" }}>
              Open one
            </Link>
            , or run <code>npm run seed</code> to load the three canonical
            fixtures.
          </p>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hairline-strong)", textAlign: "left" }}>
              <th style={{ padding: "8px 4px", fontWeight: 500, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                Claim
              </th>
              <th style={{ padding: "8px 4px", fontWeight: 500, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                Order
              </th>
              <th style={{ padding: "8px 4px", fontWeight: 500, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                Amount
              </th>
              <th style={{ padding: "8px 4px", fontWeight: 500, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                Status
              </th>
              <th style={{ padding: "8px 4px", fontWeight: 500, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                Verdict
              </th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                <td style={{ padding: "12px 4px" }}>
                  <Link href={`/claims/${claim.id}`} style={{ textDecoration: "underline" }}>
                    #{claim.id}
                  </Link>
                </td>
                <td style={{ padding: "12px 4px", fontSize: "0.9rem" }}>{claim.order_id}</td>
                <td style={{ padding: "12px 4px", fontSize: "0.9rem" }}>
                  {centsToDollars(claim.amount_cents)}
                </td>
                <td style={{ padding: "12px 4px", fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                  {statusLabel(claim)}
                </td>
                <td
                  style={{
                    padding: "12px 4px",
                    fontSize: "0.9rem",
                    color: claim.verdict ? "var(--oxblood)" : "var(--ink-soft)",
                  }}
                >
                  {claim.verdict || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
