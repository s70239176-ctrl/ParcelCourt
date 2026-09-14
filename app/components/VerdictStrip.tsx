import type { ReactNode } from "react";
import type { Claim } from "@/lib/fixtures";

export default function VerdictStrip({ claim, action }: { claim: Claim; action?: ReactNode }) {
  const settled = claim.status === "SETTLED" && claim.verdict;

  return (
    <div style={{ margin: "36px 0" }}>
      <div className="manifest-rule" />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 0",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span className="field-label">Verdict</span>

        {settled ? (
          <span className="case-id" style={{ fontSize: "2.4rem", color: "var(--signal)" }}>
            {claim.verdict}
          </span>
        ) : (
          <span style={{ fontSize: "1.05rem", color: "var(--graphite)", fontWeight: 500 }}>
            Pending adjudication
          </span>
        )}

        {settled ? (
          <span className="field-label">Settled</span>
        ) : (
          action ?? <span className="field-label">Open</span>
        )}
      </div>
      <div className="manifest-rule" />
    </div>
  );
}
