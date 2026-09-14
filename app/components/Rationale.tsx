export default function Rationale({ text }: { text: string }) {
  return (
    <div style={{ maxWidth: 620 }}>
      <p className="field-label" style={{ marginBottom: 14 }}>
        Rationale
      </p>
      <p style={{ fontSize: "1.02rem", lineHeight: 1.7 }}>{text}</p>
      <div className="manifest-rule" style={{ marginTop: 24, marginBottom: 12, maxWidth: 200 }} />
      <p className="mono" style={{ fontSize: "0.72rem", color: "var(--graphite-soft)" }}>
        Intelligent Contract · equivalence reached across validators
      </p>
    </div>
  );
}
