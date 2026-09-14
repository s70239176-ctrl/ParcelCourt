"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface WalletState {
  address: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

function getInjected(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    const injected = getInjected();
    if (!injected) {
      setError("No wallet extension detected. Install MetaMask or a compatible wallet.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await injected.request({ method: "eth_requestAccounts" })) as string[];
      setAddress(accounts?.[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection was rejected.");
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    const injected = getInjected();
    if (!injected) return;

    // eth_accounts (not eth_requestAccounts) never prompts — this only
    // picks up a wallet that's already connected/authorized from a
    // previous visit, so a returning visitor doesn't have to click
    // "Connect" again every page load.
    injected
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const list = accounts as string[];
        if (list?.[0]) setAddress(list[0]);
      })
      .catch(() => {
        // No injected wallet, or the call isn't supported — leave
        // disconnected, the visible Connect button covers this case.
      });

    function handleAccountsChanged(...args: unknown[]) {
      const accounts = args[0] as string[];
      setAddress(accounts?.[0] ?? null);
    }
    injected.on?.("accountsChanged", handleAccountsChanged);
    return () => injected.removeListener?.("accountsChanged", handleAccountsChanged);
  }, []);

  return (
    <WalletContext.Provider value={{ address, connecting, error, connect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider.");
  return ctx;
}
