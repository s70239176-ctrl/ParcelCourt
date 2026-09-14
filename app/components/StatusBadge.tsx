import type { ClaimStatus, Verdict } from "@/lib/fixtures";

const STATUS_LABEL: Record<ClaimStatus, string> = {
  OPEN: "Awaiting evidence",
  ADJUDICATED: "Awaiting equivalence",
  SETTLED: "Settled",
};

export default function StatusBadge({
  status,
  verdict,
  size = "normal",
}: {
  status: ClaimStatus;
  verdict?: Verdict | "";
  size?: "normal" | "large";
}) {
  const settled = status === "SETTLED" && verdict;
  const fontSize = size === "large" ? "1.05rem" : "0.85rem";

  if (settled) {
    return (
      <span
        className="field-label"
        style={{ fontSize, color: "var(--signal)", letterSpacing: "0.04em" }}
      >
        {verdict}
      </span>
    );
  }

  return (
    <span className="field-label" style={{ fontSize, color: "var(--graphite)" }}>
      {STATUS_LABEL[status]}
    </span>
  );
}
