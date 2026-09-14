import Link from "next/link";
import { listClaims } from "@/lib/genlayer";
import DocketRow from "@/components/DocketRow";
import EmptyState from "@/components/EmptyState";

const TABS = [
  { key: "open", label: "Open claims" },
  { key: "settled", label: "Settled" },
] as const;

export default async function DocketPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const claims = await listClaims();
  const openCount = claims.filter((c) => c.status !== "SETTLED").length;
  const settledCount = claims.filter((c) => c.status === "SETTLED").length;

  const requested = typeof searchParams.status === "string" ? searchParams.status : "open";
  const active = requested === "settled" ? "settled" : "open";
  const visible = claims.filter((c) => (active === "settled" ? c.status === "SETTLED" : c.status !== "SETTLED"));

  return (
    <div>
      <p className="field-label" style={{ marginBottom: 6 }}>
        Inbound condition adjudication
      </p>
      <h1 style={{ fontSize: "1.8rem", marginBottom: 40 }}>The docket</h1>

      <div style={{ display: "flex", gap: 56, marginBottom: 48, flexWrap: "wrap" }}>
        <div>
          <div className="case-id" style={{ fontSize: "3rem" }}>
            {openCount}
          </div>
          <p className="field-label" style={{ marginTop: 6 }}>
            Open
          </p>
        </div>
        <div>
          <div className="case-id" style={{ fontSize: "3rem", color: "var(--graphite)" }}>
            {settledCount}
          </div>
          <p className="field-label" style={{ marginTop: 6 }}>
            Settled
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "open" ? "/" : "/?status=settled"}
            style={{
              padding: "10px 18px",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              color: active === tab.key ? "var(--ink)" : "var(--graphite)",
              borderBottom: active === tab.key ? "2px solid var(--ink)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div style={{ borderBottom: "1px solid var(--line-strong)", marginBottom: 8 }} />

      {visible.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <EmptyState
            title="The docket is clear"
            body={
              active === "settled"
                ? "No claims have reached a verdict yet."
                : "No condition-on-arrival claims have been submitted."
            }
            action={
              <Link
                href="/claims/new"
                style={{
                  display: "inline-block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "10px 20px",
                  border: "1.5px solid var(--ink)",
                  textDecoration: "none",
                  color: "var(--ink)",
                }}
              >
                Open a claim
              </Link>
            }
          />
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <div
            className="desktop-only"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1.4fr 0.8fr 1.4fr",
              gap: 16,
              padding: "0 16px 10px",
            }}
          >
            <span className="field-label">Case</span>
            <span className="field-label">Order</span>
            <span className="field-label">Amount</span>
            <span className="field-label" style={{ textAlign: "right" }}>
              Status
            </span>
          </div>
          {visible.map((claim) => (
            <DocketRow key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </div>
  );
}
