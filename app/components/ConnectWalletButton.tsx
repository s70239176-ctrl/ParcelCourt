"use client";

import { useWallet } from "./WalletProvider";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ConnectWalletButton() {
  const { address, connecting, error, connect } = useWallet();

  if (address) {
    return (
      <span
        title={address}
        className="mono"
        style={{
          fontSize: "0.8rem",
          border: "1px solid var(--line-strong)",
          padding: "7px 12px",
          color: "var(--graphite)",
        }}
      >
        {truncate(address)}
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={connect}
        disabled={connecting}
        style={{
          fontFamily: "var(--sans)",
          fontWeight: 600,
          fontSize: "0.8rem",
          padding: "7px 16px",
          border: "1.5px solid var(--ink)",
          background: connecting ? "var(--line)" : "transparent",
          cursor: connecting ? "default" : "pointer",
        }}
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
      {error && (
        <p style={{ color: "var(--signal)", fontSize: "0.72rem", marginTop: 4, maxWidth: 220 }}>
          {error}
        </p>
      )}
    </div>
  );
}
