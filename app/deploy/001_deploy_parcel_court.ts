// Deploys ParcelCourt to whatever GenLayer network GENLAYER_CHAIN points at
// (studionet by default, or a real testnet chain).
//
//   npx tsx deploy/001_deploy_parcel_court.ts
//
// Uses genlayer-js (https://github.com/genlayerlabs/genlayer-js) directly.
// Prints the deployed address so it can be piped into .env.
//
// NOTE: this was rewritten against genlayer-js's documented v1.x API
// (createClient({ chain, account }), createAccount from the package root,
// deployContract returning a tx hash rather than { address }, reading the
// deployed address back off the receipt). The original version called a
// `createAccount` from a `genlayer-js/accounts` subpath that doesn't exist
// in the package's exports and a `createClient({ rpcUrl })` shape that
// doesn't match the real client. This sandbox has no network access to
// run a real deploy, so this hasn't been end-to-end verified — confirm
// against a live Studio/testnet deployment yourself.

import fs from "node:fs";
import path from "node:path";
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

async function main() {
  const chainName = process.env.GENLAYER_CHAIN ?? "studionet";
  const customRpcUrl = process.env.GENLAYER_RPC_URL;
  const customChainId = process.env.GENLAYER_CHAIN_ID;
  const preset = (chains as Record<string, import("genlayer-js/types").GenLayerChain>)[chainName];

  // Same custom-environment fallback as app/lib/genlayer.ts's resolveChain
  // — see the detailed comment there on the unverified assumption this
  // makes (inheriting studionet's consensus contract addresses). Keep
  // these two in sync if that ever needs revisiting.
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

  const privateKey = process.env.GENLAYER_DEPLOYER_KEY;

  if (!chain) {
    throw new Error(
      `Unknown GENLAYER_CHAIN "${chainName}". Expected one of: localnet, ` +
        "studionet, testnetAsimov, testnetBradbury — or set both " +
        "GENLAYER_RPC_URL and GENLAYER_CHAIN_ID to point at a custom " +
        "environment."
    );
  }
  if (!privateKey) {
    throw new Error(
      "GENLAYER_DEPLOYER_KEY is not set. Generate/export a Studio demo " +
        "account key, or your funded testnet key, and set it in .env."
    );
  }
  assertHexPrivateKey(privateKey);

  const account = createAccount(privateKey);
  const client = createClient({ chain, account });

  // Required before any operations per genlayer-js's documented flow.
  await client.initializeConsensusSmartContract?.();

  const contractCode = fs.readFileSync(
    path.join(__dirname, "..", "..", "contracts", "parcel_court.py"),
    "utf-8"
  );

  console.log("Deploying ParcelCourt...");
  const transactionHash = await client.deployContract({
    code: contractCode,
    args: [],
    leaderOnly: false,
  });

  const receipt = await client.waitForTransactionReceipt({
    // deployContract's return type is a plain `0x${string}`, but
    // waitForTransactionReceipt's `hash` param is genlayer-js's nominally
    // branded `Hash` type (`0x${string}` & { length: 66 }) — a template
    // literal type can't satisfy that structurally no matter its runtime
    // value, only via an explicit cast. Every usage example in genlayer-js's
    // own docs passes a hash straight through with no cast at all, so this
    // looks like a real gap between their documented usage and their
    // strict-mode types, not a mistake on our end.
    hash: transactionHash as unknown as Hash,
    status: TransactionStatus.ACCEPTED,
    retries: 50,
    interval: 5000,
  });
  const address = receipt?.data?.contract_address;

  console.log("---");
  console.log("Deployed ParcelCourt");
  console.log("Address:          ", address);
  console.log("Transaction hash: ", transactionHash);
  console.log("---");
  console.log(`Set GENLAYER_CONTRACT_ADDRESS=${address} in app/.env.local`);
  console.log(
    `Also set NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=${address} (same ` +
      "value, different var — the deployed app reads the NEXT_PUBLIC_ " +
      "copy client-side; this script and seed_fixtures.ts read the " +
      "unprefixed one)."
  );
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
