const LAYERS = [
  {
    name: "Order & evidence intake",
    detail: "Buyer/seller submit order_id, sku, amount_cents, and evidence rows (role, uri, sha256, note, weight_g).",
  },
  {
    name: "Off-chain facts, fetched live",
    detail: "gl.nondet.web.get(tracking_url) and (listing_url), reduced to a stable JSON extract under gl.eq_principle.strict_eq — never raw HTML.",
  },
  {
    name: "Dossier",
    detail: "A compact, sorted-key JSON: evidence rows, weight delta, evidence-strength tags, tracking/listing facts. This is the only thing the judge sees.",
  },
  {
    name: "GenLayer Intelligent Contract",
    detail: "gl.eq_principle.prompt_non_comparative runs the locked rubric-v1 judge prompt across validators; only a converged {verdict, rationale, cited} JSON is accepted.",
  },
  {
    name: "Settlement",
    detail: "Verdict maps deterministically to an escrow release: TRANSIT/SELLER → buyer, BUYER → seller, SPLIT → 50/50, INSUFFICIENT → rubric defaults.",
  },
];

export default function ProtocolPage() {
  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Protocol</h2>
      <p style={{ color: "var(--ink-soft)", marginBottom: 32, lineHeight: 1.6 }}>
        What is on-chain vs. off-chain, top to bottom.
      </p>

      <div>
        {LAYERS.map((layer, i) => (
          <div
            key={layer.name}
            style={{
              display: "flex",
              gap: 20,
              paddingBottom: 24,
              borderLeft: i < LAYERS.length - 1 ? "1px solid var(--hairline-strong)" : "1px solid transparent",
              marginLeft: 14,
              paddingLeft: 24,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -6,
                top: 2,
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "var(--oxblood)",
              }}
            />
            <div>
              <h3 style={{ fontSize: "1rem", marginBottom: 6 }}>{layer.name}</h3>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>
                {layer.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
