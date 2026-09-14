export default function ErrorState({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--signal)",
        padding: "48px 32px",
        textAlign: "center",
      }}
    >
      <p className="field-label" style={{ fontSize: "0.8rem", color: "var(--signal)", marginBottom: 14 }}>
        {title}
      </p>
      <p style={{ color: "var(--graphite)", maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
        {body}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 24,
            fontFamily: "var(--sans)",
            fontSize: "0.85rem",
            fontWeight: 600,
            padding: "10px 20px",
            border: "1.5px solid var(--ink)",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
