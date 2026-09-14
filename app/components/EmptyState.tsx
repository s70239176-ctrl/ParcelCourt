import type { ReactNode } from "react";

export default function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--line-strong)",
        padding: "64px 32px",
        textAlign: "center",
      }}
    >
      <p className="field-label" style={{ fontSize: "0.8rem", marginBottom: 14 }}>
        {title}
      </p>
      <p style={{ color: "var(--graphite)", maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
        {body}
      </p>
      {action && <div style={{ marginTop: 24 }}>{action}</div>}
    </div>
  );
}
