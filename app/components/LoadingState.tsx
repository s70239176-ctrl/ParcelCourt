function Bar({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return <div className="skeleton" style={{ width, height, marginBottom: 10 }} />;
}

export default function LoadingState({ variant }: { variant: "docket" | "case" }) {
  if (variant === "docket") {
    return (
      <div aria-busy="true" aria-label="Loading docket">
        <Bar width={180} height={44} />
        <div style={{ marginTop: 32 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 24, padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
              <Bar width={90} height={20} />
              <Bar width={120} height={20} />
              <Bar width={70} height={20} />
              <Bar width={140} height={20} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div aria-busy="true" aria-label="Loading case">
      <Bar width={280} height={64} />
      <Bar width={200} height={18} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 40 }}>
        <Bar height={220} />
        <Bar height={220} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginTop: 40 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} height={140} />
        ))}
      </div>
    </div>
  );
}
