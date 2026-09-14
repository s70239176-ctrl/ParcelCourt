import { notFound } from "next/navigation";
import { getClaim } from "@/lib/genlayer";
import CaseHeader from "@/components/CaseHeader";
import ExpectedEvidence from "@/components/ExpectedEvidence";
import ObservedEvidence from "@/components/ObservedEvidence";
import EvidenceColumns from "@/components/EvidenceColumns";
import VerdictStrip from "@/components/VerdictStrip";
import Rationale from "@/components/Rationale";
import AdjudicateButton from "./AdjudicateButton";

export default async function ClaimPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const claim = await getClaim(id);
  if (!claim) notFound();

  const sellerRows = claim.evidence.filter((e) => e.role === "seller");
  const buyerRows = claim.evidence.filter((e) => e.role === "buyer");
  const pending = claim.status !== "SETTLED";

  return (
    <article className="print-page">
      <CaseHeader claim={claim} />

      <div
        className="before-after-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
        }}
      >
        <ExpectedEvidence claim={claim} sellerRows={sellerRows} />
        <ObservedEvidence buyerRows={buyerRows} />
      </div>

      <EvidenceColumns claim={claim} />

      <VerdictStrip
        claim={claim}
        action={
          pending ? (
            <div className="no-print">
              <AdjudicateButton claimId={claim.id} />
            </div>
          ) : undefined
        }
      />

      {claim.status === "SETTLED" && <Rationale text={claim.rationale} />}
    </article>
  );
}
