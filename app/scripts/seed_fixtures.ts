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
import type { Hash } from "genlayer-js/types";

function assertHexPrivateKey(key: string): asserts key is `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "GENLAYER_DEPLOYER_KEY must be a 0x-prefixed 32-byte hex private key " +
        "(66 characters total, e.g. 0x1234...). The value currently set " +
        "doesn't match that shape."
    );
  }
}

// readContract's return type is genlayer-js's generic on-chain calldata
// representation (CalldataEncodable | null) — it has no way to know that
// THIS contract's list_claims/get_claim return something shaped like a
// claim. This mirrors _claim_to_dict in contracts/parcel_court.py exactly,
// so we can cast at the boundary instead of scattering `any`.
type SeedClaimRow = {
  id: number;
  order_id: string;
  sku: string;
  amount_cents: number;
  buyer: string;
  seller: string;
  tracking_url: string;
  listing_url: string;
  status: string;
  verdict: string;
  rationale: string;
};

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
  const customRpcUrl = process.env.GENLAYER_RPC_URL;
  const customChainId = process.env.GENLAYER_CHAIN_ID;
  const preset = (chains as Record<string, import("genlayer-js/types").GenLayerChain>)[chainName];

  // Same custom-environment fallback as app/lib/genlayer.ts's resolveChain
  // and deploy/001_deploy_parcel_court.ts — see the detailed comment in
  // lib/genlayer.ts on the unverified assumption this makes (inheriting
  // studionet's consensus contract addresses). Keep all three in sync.
  let chain: import("genlayer-js/types").GenLayerChain | undefined = preset;
  if (!chain && customRpcUrl && customChainId) {
    const base = (chains as Record<string, import("genlayer-js/types").GenLayerChain>)["studionet"];
    chain = {
      ...base,
      id: Number(customChainId),
      name: chainName,
      rpcUrls: { ...base.rpcUrls, default: { http: [customRpcUrl] } },
    };
  }

  const contractAddressEnv = process.env.GENLAYER_CONTRACT_ADDRESS;
  const privateKey = process.env.GENLAYER_DEPLOYER_KEY;

  if (!chain) {
    throw new Error(
      `Unknown GENLAYER_CHAIN "${chainName}". Expected one of: localnet, ` +
        "studionet, testnetAsimov, testnetBradbury — or set both " +
        "GENLAYER_RPC_URL and GENLAYER_CHAIN_ID to point at a custom " +
        "environment."
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
  assertHexPrivateKey(privateKey);

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
  // Derived from `client.writeContract`'s own signature rather than a named
  // import — the compiler's error only tells us the type is *called*
  // CalldataEncodable, not that it's actually exported by name from
  // genlayer-js/types (TS prints internal type names in errors regardless
  // of public export status). Indexing off the real, already-correctly-
  // typed `client` value sidesteps that uncertainty entirely.
  async function writeAndConfirm(
    functionName: string,
    args: Parameters<typeof client.writeContract>[0]["args"]
  ) {
    const hash = await client.writeContract({
      address: contractAddress,
      functionName,
      args,
      value: BigInt(0),
    });
    // Same genlayer-js Hash-branding gap as deploy/001_deploy_parcel_court.ts:
    // writeContract returns a plain `0x${string}`, waitForTransactionReceipt
    // wants the nominally-branded Hash (`0x${string}` & { length: 66 }).
    return client.waitForTransactionReceipt({ hash: hash as unknown as Hash, status: TransactionStatus.FINALIZED });
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
    const claims = (await client.readContract({
      address: contractAddress,
      functionName: "list_claims",
      args: [],
    })) as SeedClaimRow[] | null;
    if (!claims || !Array.isArray(claims) || claims.length === 0) {
      throw new Error(
        `list_claims returned no claims after opening ${scenario.label} — ` +
          "expected at least the claim just opened."
      );
    }
    const lastClaim = claims[claims.length - 1];
    const claimId = lastClaim?.id;
    if (claimId === undefined) {
      throw new Error(
        `The claim just opened for ${scenario.label} has no "id" field — ` +
          "check that _claim_to_dict in contracts/parcel_court.py still " +
          'returns "id" as a key.'
      );
    }
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
      const claim = (await client.readContract({
        address: contractAddress,
        functionName: "get_claim",
        args: [claimId],
      })) as SeedClaimRow | null;
      console.log(`  verdict: ${claim?.verdict}`);
    }
  }

  console.log("\nSeed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
