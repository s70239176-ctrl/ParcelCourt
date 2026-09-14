import { getRubric } from "@/lib/genlayer";

const EVIDENCE_TABLE = [
  {
    party: "Seller",
    strong: "Pack-out weight (grams) and a pack-out video hash, taken before the label was applied",
    weak: "A photo only, or a claimed weight with no video hash",
  },
  {
    party: "Carrier",
    strong: "A tracking exception event fetched live from the tracking URL",
    weak: "Silence — no exception on the tracking record",
  },
  {
    party: "Buyer",
    strong: "Unboxing video hash with the shipping label in frame, plus stated inbound weight",
    weak: "A single still photo (an orphan still) — no label, no video, no stated weight",
  },
];

const DECISION_LOGIC = [
  "Weight mismatch over 25% with no buyer unboxing video favors BUYER.",
  "Carrier exception + matching weights + label-in-frame unbox favors TRANSIT.",
  "Garbled label text or geometry inconsistent with the listing, plus no video, favors BUYER on fabrication grounds.",
  "Both sides clear the strong bar and the record still conflicts: SPLIT.",
  "The judge never invents a scan or fact that was not actually fetched.",
];

export default async function RubricPage() {
  const rubric = await getRubric();

  return (
    <article style={{ maxWidth: 720 }}>
      <p className="field-label" style={{ marginBottom: 6 }}>
        Adjudication rubric
      </p>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 8 }}>Rubric {rubric.rubric_id}</h1>
      <p style={{ color: "var(--graphite)", marginBottom: 40, lineHeight: 1.6 }}>
        ParcelCourt answers one question: what condition was this parcel in
        when it arrived, and who bears that? An isolated JPEG is never
        dispositive alone, from either side, at any claim size.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 48 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--line-strong)", textAlign: "left" }}>
            <th className="field-label" style={{ padding: "8px 12px 8px 0", fontWeight: 600 }}>
              Party
            </th>
            <th className="field-label" style={{ padding: "8px 12px", fontWeight: 600 }}>
              Strong
            </th>
            <th className="field-label" style={{ padding: "8px 0 8px 12px", fontWeight: 600 }}>
              Weak
            </th>
          </tr>
        </thead>
        <tbody>
          {EVIDENCE_TABLE.map((row) => (
            <tr key={row.party} style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: "16px 12px 16px 0", fontWeight: 700 }}>{row.party}</td>
              <td style={{ padding: "16px 12px", fontSize: "0.88rem", lineHeight: 1.5 }}>{row.strong}</td>
              <td style={{ padding: "16px 0 16px 12px", fontSize: "0.88rem", lineHeight: 1.5, color: "var(--graphite)" }}>
                {row.weak}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="field-label" style={{ marginBottom: 14 }}>
        Decision logic
      </p>
      <ul style={{ paddingLeft: 20, lineHeight: 1.8, marginBottom: 40 }}>
        {DECISION_LOGIC.map((line) => (
          <li key={line} style={{ fontSize: "0.92rem" }}>
            {line}
          </li>
        ))}
      </ul>

      <p className="field-label" style={{ marginBottom: 14 }}>
        Defaults when evidence is thin
      </p>
      <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "var(--graphite)" }}>
        Claims under {`$${(rubric.min_meaningful_claim_cents / 100).toFixed(2)}`} resolve
        buyer-favorable as INSUFFICIENT when neither side posts strong
        evidence. Everything else with thin evidence on both sides splits
        the escrow 50/50 rather than guessing.
      </p>
    </article>
  );
}
