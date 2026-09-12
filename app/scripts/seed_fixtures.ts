// Seeds the three canonical fixtures against a live GenLayer deployment.
//
//   GENLAYER_CHAIN=studionet GENLAYER_CONTRACT_ADDRESS=... npx tsx scripts/seed_fixtures.ts
//
// Opens three claims (mirroring tests/direct/fixtures.py), submits their
// evidence rows, and — unless SEED_SKIP_ADJUDICATE=1 — calls adjudicate()
// on each so the docket is ready to demo immediately. In mock mode there
// is nothing to seed: app/lib/fixtures.ts already holds the same three
// claims pre-adjudicated for NEXT_PUBLIC_MOCK=1.
//
// NOTE: rewritten against genlayer-js's real v1.x API — see the note at
// the top of deploy/001_deploy_parcel_court.ts for what changed and why.
// writeContract returns a transaction hash, not a decoded { result }, so
// each write below is followed by waitForTransactionReceipt.

import { createClient, createAccount } from "genlayer-js";
import * as chains from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const SELLER = "0xSELLER0000000000000000000000000000001";
const LISTING_URL = "https://shop.example/listings/wireless-earbuds-4821";

const SCENARIOS = [
  {
    label: "01-transit",
    tracking_url: "https://tracking.example/8821-transit",
    evidence: [
      {
        role: "seller",
        uri: "ipfs://packout-4821-01.mp4",
        sha256: "a".repeat(64),
        note: "Pack-out video, scale visible, 420g before seal.",
        weight_g: 420,
      },
      {
        role: "carrier",
        uri: "https://tracking.example/8821-transit/exception-report",
        sha256: "b".repeat(64),
        note: "Carrier exception logged: crushed corner, in transit.",
        weight_g: 0,
      },
      {
        role: "buyer",
        uri: "ipfs://unbox-4821-01.mp4",
        sha256: "c".repeat(64),
        note: "Unboxing video, shipping label in frame throughout, scale reads 418g.",
        weight_g: 418,
      },
    ],
  },
  {
    label: "02-buyer-empty",
    tracking_url: "https://tracking.example/8822-clean",
    evidence: [
      {
        role: "seller",
        uri: "ipfs://packout-4822.mp4",
        sha256: "d".repeat(64),
        note: "Pack-out video, scale visible, 420g before seal.",
        weight_g: 420,
      },
      {
        role: "buyer",
        uri: "ipfs://still-4822.jpg",
        sha256: "e".repeat(64),
        note: "Box arrived with only an air pillow inside.",
        weight_g: 90,
      },
    ],
  },
  {
    label: "03-buyer-fabricated",
    tracking_url: "https://tracking.example/8823-clean",
    evidence: [
      {
        role: "seller",
        uri: "ipfs://packout-4823.mp4",
        sha256: "f".repeat(64),
        note: "Clean pack-out video, 420g, label applied after seal.",
        weight_g: 420,
      },
      {
        role: "buyer",
        uri: "ipfs://still-4823.jpg",
        sha256: "0".repeat(64),
        note: "Case arrived with a perfect hairline crack. lbl:XJ##Q9-void artifact",
        weight_g: 0,
      },
    ],
  },
];

async function main() {
  const chainName = process.env.GENLAYER_CHAIN ?? "studionet";
  const chain = (chains as Record<string, import("genlayer-js/types").GenLayerChain>)[chainName];
  const contractAddressEnv = process.env.GENLAYER_CONTRACT_ADDRESS;
  const privateKey = process.env.GENLAYER_DEPLOYER_KEY;

  if (!chain) {
    throw new Error(
      `Unknown GENLAYER_CHAIN "${chainName}". Expected one of: localnet, ` +
        "studionet, testnetAsimov, testnetBradbury."
    );
  }
  if (!contractAddressEnv || !privateKey) {
    throw new Error(
      "Set GENLAYER_CONTRACT_ADDRESS and GENLAYER_DEPLOYER_KEY before " +
        "seeding, or run the app with NEXT_PUBLIC_MOCK=1 (fixtures are " +
        "already baked into app/lib/fixtures.ts for that path)."
    );
  }
  // `Address` (from genlayer-js/types, via viem) is the branded template
  // literal type `0x${string}`, not a plain `string` — env vars need an
  // explicit, validated cast to satisfy it.
  if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddressEnv)) {
    throw new Error(`GENLAYER_CONTRACT_ADDRESS is not a valid 0x-prefixed address: "${contractAddressEnv}"`);
  }
  const contractAddress = contractAddressEnv as `0x${string}`;

  const account = createAccount(privateKey);
  const client = createClient({ chain, account });

  // writeContract returns a transaction hash, not a decoded return value —
  // each write is followed by waitForTransactionReceipt. NOTE: decoding a
  // contract method's actual *return value* (e.g. the new claim_id from
  // open_claim, or the verdict from adjudicate) out of the receipt isn't
  // pinned down here — this sandbox has no network access to inspect a
  // real receipt's shape. `list_claims` is used as a fallback to find the
  // claim just opened; confirm this works against your real deployment
  // and swap in a direct receipt-decoded claim_id if genlayer-js exposes
  // one more directly.
  async function writeAndConfirm(functionName: string, args: unknown[]) {
    const hash = await client.writeContract({ address: contractAddress, functionName, args });
    return client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED });
  }

  for (const scenario of SCENARIOS) {
    console.log(`\nOpening claim for ${scenario.label}...`);
    await writeAndConfirm("open_claim", [
      "ORD-4821",
      "EARBUD-WHT-01",
      8900,
      SELLER,
      scenario.tracking_url,
      LISTING_URL,
    ]);
    const claims = await client.readContract({
      address: contractAddress,
      functionName: "list_claims",
      args: [],
    });
    const claimId = claims[claims.length - 1]?.id ?? claims[claims.length - 1]?.claim_id;
    console.log(`  claim_id = ${claimId}`);

    for (const row of scenario.evidence) {
      await writeAndConfirm("submit_evidence", [
        claimId,
        row.role,
        row.uri,
        row.sha256,
        row.note,
        row.weight_g,
      ]);
      console.log(`  + ${row.role} evidence submitted`);
    }

    if (process.env.SEED_SKIP_ADJUDICATE !== "1") {
      await writeAndConfirm("adjudicate", [claimId]);
      const claim = await client.readContract({
        address: contractAddress,
        functionName: "get_claim",
        args: [claimId],
      });
      console.log(`  verdict: ${claim?.verdict}`);
    }
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
