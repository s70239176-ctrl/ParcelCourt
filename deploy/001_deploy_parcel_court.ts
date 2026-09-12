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

async function main() {
  const chainName = process.env.GENLAYER_CHAIN ?? "studionet";
  const chain = (chains as Record<string, import("genlayer-js/types").GenLayerChain>)[chainName];
  const privateKey = process.env.GENLAYER_DEPLOYER_KEY;

  if (!chain) {
    throw new Error(
      `Unknown GENLAYER_CHAIN "${chainName}". Expected one of: localnet, ` +
        "studionet, testnetAsimov, testnetBradbury."
    );
  }
  if (!privateKey) {
    throw new Error(
      "GENLAYER_DEPLOYER_KEY is not set. Generate/export a Studio demo " +
        "account key, or your funded testnet key, and set it in .env."
    );
  }

  const account = createAccount(privateKey);
  const client = createClient({ chain, account });

  // Required before any operations per genlayer-js's documented flow.
  await client.initializeConsensusSmartContract?.();

  const contractCode = fs.readFileSync(
    path.join(__dirname, "..", "contracts", "parcel_court.py"),
    "utf-8"
  );

  console.log("Deploying ParcelCourt...");
  const transactionHash = await client.deployContract({
    code: contractCode,
    args: [],
    leaderOnly: false,
  });

  const receipt = await client.waitForTransactionReceipt({
    hash: transactionHash,
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
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
