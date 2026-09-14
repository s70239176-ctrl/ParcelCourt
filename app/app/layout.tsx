import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import { WalletProvider } from "@/components/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParcelCourt — Inbound Condition Adjudication",
  description: "Verdict layer for the parcel. Settled by a GenLayer Intelligent Contract.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Masthead />
          <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
