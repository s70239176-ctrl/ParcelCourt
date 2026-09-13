import { isMockMode } from "@/lib/genlayer";
import NewClaimForm from "./NewClaimForm";

export default function NewClaimPage() {
  const mock = isMockMode();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.4rem" }}>Open a claim</h2>
        <p style={{ color: "var(--ink-soft)", marginTop: 6, maxWidth: 560 }}>
          You&rsquo;ll need a wallet connected to the network this deployment
          points at. Opening a claim makes you its buyer — the contract reads
          that from your connected address, not from anything typed below.
        </p>
      </div>

      {mock ? (
        <div
          className="hairline"
          style={{
            border: "1px dashed var(--hairline-strong)",
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--ink-soft)",
          }}
        >
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "1.1rem" }}>
            This deployment is running in mock mode.
          </p>
          <p style={{ marginTop: 8, fontSize: "0.9rem" }}>
            Mock mode renders fixed demo data — there&rsquo;s no live contract
            behind it to open a real claim against. Switch to live mode to
            submit one.
          </p>
        </div>
      ) : (
        <NewClaimForm />
      )}
    </div>
  );
}
