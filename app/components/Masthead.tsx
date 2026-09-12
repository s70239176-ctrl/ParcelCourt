import Link from "next/link";

const NAV = [
  { href: "/", label: "Docket" },
  { href: "/rubric", label: "Rubric v1" },
  { href: "/demo", label: "Three fixtures" },
  { href: "/protocol", label: "Protocol" },
];

export default function Masthead() {
  return (
    <header
      className="hairline-strong"
      style={{
        borderBottom: "1px solid var(--hairline-strong)",
        background: "var(--paper)",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "28px 24px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.1rem", fontStyle: "italic" }}>ParcelCourt</h1>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: "0.72rem",
              letterSpacing: "0.14em",
              marginTop: 6,
              color: "var(--ink-soft)",
            }}
          >
            INBOUND CONDITION ADJUDICATION
          </p>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontStyle: "italic",
              fontSize: "0.95rem",
              marginTop: 6,
              color: "var(--ink-soft)",
            }}
          >
            Verdict layer for the parcel
          </p>
        </div>
        <nav
          className="no-print"
          style={{ display: "flex", gap: 20, fontSize: "0.88rem", paddingBottom: 4 }}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: "none", borderBottom: "1px solid transparent" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
