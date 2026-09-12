import type { EvidenceRow, Role } from "@/lib/fixtures";

const ROLE_LABEL: Record<Role, string> = {
  seller: "Seller",
  carrier: "Carrier",
  buyer: "Buyer",
  warehouse: "Warehouse",
};

function shortHash(hash: string) {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export default function EvidenceColumn({
  role,
  rows,
}: {
  role: Role;
  rows: EvidenceRow[];
}) {
  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <div
        className="hairline"
        style={{
          borderBottom: "1px solid var(--hairline)",
          paddingBottom: 8,
          marginBottom: 14,
        }}
      >
        <h3 style={{ fontSize: "1.05rem" }}>{ROLE_LABEL[role]}</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 2 }}>
          {rows.length} {rows.length === 1 ? "submission" : "submissions"}
        </p>
      </div>

      {rows.length === 0 && (
        <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)", fontStyle: "italic" }}>
          No evidence submitted.
        </p>
      )}

      {rows.map((row, i) => (
        <figure
          key={i}
          style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--hairline)" }}
        >
          {row.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={row.image}
              alt={row.note}
              style={{ width: "100%", border: "1px solid var(--hairline)", marginBottom: 8 }}
            />
          )}
          <figcaption style={{ fontSize: "0.85rem" }}>
            <p style={{ marginBottom: 4 }}>{row.note}</p>
            <dl style={{ fontSize: "0.75rem", color: "var(--ink-soft)", display: "grid", gap: 2 }}>
              {row.weight_g > 0 && (
                <div>
                  <dt style={{ display: "inline" }}>Weight: </dt>
                  <dd style={{ display: "inline" }}>{row.weight_g}g</dd>
                </div>
              )}
              <div>
                <dt style={{ display: "inline" }}>Hash: </dt>
                <dd style={{ display: "inline", fontFamily: "monospace" }}>{shortHash(row.sha256)}</dd>
              </div>
            </dl>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
