import { caseId } from "./DocketRow";
import type { Claim } from "@/lib/fixtures";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CaseHeader({ claim }: { claim: Claim }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div className="case-id" style={{ fontSize: "3.6rem" }}>
        {caseId(claim.id)}
      </div>
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "baseline",
          flexWrap: "wrap",
          marginTop: 12,
        }}
      >
        <span className="mono" style={{ fontSize: "0.88rem", color: "var(--graphite)" }}>
          ORDER {claim.order_id}
        </span>
        <span className="mono" style={{ fontSize: "0.88rem", color: "var(--graphite)" }}>
          SKU {claim.sku}
        </span>
        <span style={{ fontSize: "1.15rem", fontWeight: 700 }}>{centsToDollars(claim.amount_cents)}</span>
      </div>
      <p className="field-label" style={{ marginTop: 14 }}>
        Condition on arrival
      </p>
    </div>
  );
}
