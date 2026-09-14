import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import Navigation from "@/components/Navigation";
import { WalletProvider } from "@/components/WalletProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ParcelCourt — Inbound Condition Adjudication",
  description: "Verdict layer for the parcel. Settled by a GenLayer Intelligent Contract.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body>
        <WalletProvider>
          <Navigation />
          <main style={{ maxWidth: "var(--content-max)", margin: "0 auto", padding: "40px 24px 96px" }}>
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
