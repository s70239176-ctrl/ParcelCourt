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
        style={{
          fontFamily: "monospace",
          fontSize: "0.8rem",
          border: "1px solid var(--hairline-strong)",
          padding: "7px 12px",
          color: "var(--ink-soft)",
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
          fontSize: "0.8rem",
          padding: "7px 14px",
          border: "1.5px solid var(--ink)",
          background: connecting ? "var(--paper-dim)" : "transparent",
          cursor: connecting ? "default" : "pointer",
        }}
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
      {error && (
        <p style={{ color: "var(--oxblood)", fontSize: "0.72rem", marginTop: 4, maxWidth: 220 }}>
          {error}
        </p>
      )}
    </div>
  );
}
