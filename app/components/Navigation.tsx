import Link from "next/link";
import ConnectWalletButton from "./ConnectWalletButton";
import { isMockMode } from "@/lib/genlayer";

const PRIMARY_NAV = [
  { href: "/", label: "Docket" },
  { href: "/?status=open", label: "Open claims" },
  { href: "/?status=settled", label: "Settled" },
  { href: "/claims/new", label: "New claim" },
];

const SECONDARY_NAV = [
  { href: "/rubric", label: "Rubric" },
  { href: "/protocol", label: "Protocol" },
  { href: "/demo", label: "Fixtures" },
];

export default function Navigation() {
  const mock = isMockMode();

  return (
    <header
      className="no-print"
      style={{ borderBottom: "1px solid var(--line-strong)", background: "var(--surface)" }}
    >
      <div
        style={{
          maxWidth: "var(--content-max)",
          margin: "0 auto",
          padding: "18px 24px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>
              ParcelCourt
            </span>
            <span className="field-label desktop-only" style={{ fontSize: "0.64rem" }}>
              Inbound condition adjudication
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.78rem",
                color: "var(--graphite)",
              }}
              title={mock ? "Rendering fixture data, no live chain call" : "Reading/writing the live contract"}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: mock ? "var(--graphite-soft)" : "var(--ink)",
                  display: "inline-block",
                }}
              />
              <span className="desktop-only">{mock ? "Mock mode" : "Network online"}</span>
            </div>
            <ConnectWalletButton />
          </div>
        </div>

        <nav style={{ display: "flex", gap: 28, marginTop: 18, fontSize: "0.9rem" }}>
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="link-underline"
              style={{ paddingBottom: 14 }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <div
          style={{
            maxWidth: "var(--content-max)",
            margin: "0 auto",
            padding: "8px 24px",
            display: "flex",
            gap: 20,
          }}
        >
          {SECONDARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ fontSize: "0.76rem", color: "var(--graphite)", textDecoration: "none" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
