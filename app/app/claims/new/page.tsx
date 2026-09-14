import { isMockMode } from "@/lib/genlayer";
import NewClaimForm from "./NewClaimForm";

export default function NewClaimPage() {
  const mock = isMockMode();

  return (
    <div>
      <p className="field-label" style={{ marginBottom: 6 }}>
        Case intake
      </p>
      <h1 style={{ fontSize: "1.6rem", marginBottom: 40 }}>Open a claim</h1>

      {mock ? (
        <div
          style={{
            border: "1px dashed var(--line-strong)",
            padding: "56px 24px",
            textAlign: "center",
            maxWidth: 480,
          }}
        >
          <p className="field-label" style={{ fontSize: "0.8rem", marginBottom: 12 }}>
            Mock mode
          </p>
          <p style={{ color: "var(--graphite)", lineHeight: 1.6 }}>
            This deployment is rendering fixture data. There&rsquo;s no live
            contract behind it to open a real claim against — switch to live
            mode to submit one.
          </p>
        </div>
      ) : (
        <NewClaimForm />
      )}
    </div>
  );
}
