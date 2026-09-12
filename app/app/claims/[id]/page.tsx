import { notFound } from "next/navigation";
import { getClaim } from "@/lib/genlayer";
import EvidenceColumn from "@/components/EvidenceColumn";
import VerdictChip from "@/components/VerdictChip";
import AdjudicateButton from "./AdjudicateButton";

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function ClaimPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const claim = await getClaim(id);
  if (!claim) notFound();

  const seller = claim.evidence.filter((e) => e.role === "seller");
  const carrier = claim.evidence.filter((e) => e.role === "carrier");
  const buyer = claim.evidence.filter((e) => e.role === "buyer");

  return (
    <article className="print-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.6rem" }}>
            Claim {claim.id} <span style={{ color: "var(--ink-soft)" }}>· {claim.sku}</span>
          </h2>
          <p style={{ color: "var(--ink-soft)", marginTop: 6 }}>
            {claim.order_id} · {centsToDollars(claim.amount_cents)}
          </p>
        </div>

        {claim.verdict ? (
          <VerdictChip verdict={claim.verdict as any} />
        ) : (
          <div className="no-print">
            <AdjudicateButton claimId={claim.id} />
          </div>
        )}
      </div>

      {claim.verdict && (
        <div
          style={{
            borderLeft: "3px solid var(--oxblood)",
            paddingLeft: 16,
            marginBottom: 32,
            maxWidth: 640,
          }}
        >
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>{claim.rationale}</p>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              color: "var(--ink-soft)",
              marginTop: 10,
            }}
          >
            INTELLIGENT CONTRACT · EQUIVALENCE REACHED
          </p>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
          borderTop: "1px solid var(--hairline-strong)",
          paddingTop: 24,
        }}
      >
        <EvidenceColumn role="seller" rows={seller} />
        <EvidenceColumn role="carrier" rows={carrier} />
        <EvidenceColumn role="buyer" rows={buyer} />
      </div>
    </article>
  );
}
