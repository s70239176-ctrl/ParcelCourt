"use client";

import { motion } from "framer-motion";
import type { Verdict } from "@/lib/fixtures";

const LABELS: Record<Verdict, string> = {
  TRANSIT: "Transit",
  SELLER: "Seller",
  BUYER: "Buyer",
  SPLIT: "Split",
  INSUFFICIENT: "Insufficient",
};

export default function VerdictChip({
  verdict,
  animate = true,
}: {
  verdict: Verdict;
  animate?: boolean;
}) {
  const content = (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 18px",
        border: "1.5px solid var(--oxblood)",
        color: "var(--oxblood)",
        fontFamily: "var(--serif)",
        fontStyle: "italic",
        fontSize: "1.15rem",
        transform: "rotate(-2deg)",
        background: "rgba(139, 30, 30, 0.04)",
      }}
    >
      <span aria-hidden style={{ fontSize: "0.7rem", letterSpacing: "0.1em", fontStyle: "normal" }}>
        VERDICT
      </span>
      <span>{LABELS[verdict]}</span>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.4, rotate: 6 }}
      animate={{ opacity: 1, scale: 1, rotate: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 18 }}
      style={{ display: "inline-block" }}
    >
      {content}
    </motion.div>
  );
}
