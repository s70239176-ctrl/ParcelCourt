import { createClient, createAccount } from "genlayer-js";
import * as chains from "genlayer-js/chains";
import type { GenLayerChain } from "genlayer-js/types";

// Same custom-environment fallback as app/lib/genlayer.ts, deploy/001_deploy_parcel_court.ts,
// and scripts/seed_fixtures.ts — see the detailed comment in app/lib/genlayer.ts on the
// unverified assumption this makes (inheriting studionet's consensus contract addresses
// when pointing at a custom RPC_URL/CHAIN_ID). Keep all four in sync.
export function resolveChain(): GenLayerChain {
  const chainName = process.env.GENLAYER_CHAIN ?? "studionet";
  const customRpcUrl = process.env.GENLAYER_RPC_URL;
  const customChainId = process.env.GENLAYER_CHAIN_ID;
  const byName = chains as unknown as Record<string, GenLayerChain>;
  const preset = byName[chainName];

  if (preset) return preset;

  if (customRpcUrl && customChainId) {
    const base = byName["studionet"];
    if (!base) {
      throw new Error(
        "Couldn't find the studionet preset in genlayer-js/chains to base " +
          `the custom chain "${chainName}" on — something is wrong with ` +
          "the installed genlayer-js version."
      );
    }
    return {
      ...base,
      id: Number(customChainId),
      name: chainName,
      rpcUrls: { ...base.rpcUrls, default: { http: [customRpcUrl] } },
    };
  }

  throw new Error(
    `Unknown GENLAYER_CHAIN "${chainName}". Expected one of: localnet, ` +
      "studionet, testnetAsimov, testnetBradbury — or set both " +
      "GENLAYER_RPC_URL and GENLAYER_CHAIN_ID to point at a custom environment."
  );
}

export function contractAddress(): `0x${string}` {
  const address = process.env.GENLAYER_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error(
      "GENLAYER_CONTRACT_ADDRESS is not set. Point it at the deployed " +
        "ParcelCourt contract (see deploy/001_deploy_parcel_court.ts's output)."
    );
  }
  return address as `0x${string}`;
}

let readClient: Awaited<ReturnType<typeof createClient>> | null = null;

export async function getReadClient() {
  if (readClient) return readClient;
  const chain = resolveChain();
  readClient = createClient({ chain });
  return readClient;
}

function assertHexPrivateKey(key: string): asserts key is `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "PARCELCOURT_AGENT_PRIVATE_KEY must be a 0x-prefixed 32-byte hex " +
        "private key (66 characters total, e.g. 0x1234...). The value " +
        "currently set doesn't match that shape."
    );
  }
}

let writeClient: Awaited<ReturnType<typeof createClient>> | null = null;

// Deliberately a SEPARATE key from GENLAYER_DEPLOYER_KEY (used by
// deploy/001_deploy_parcel_court.ts and scripts/seed_fixtures.ts). This
// process runs unattended and any MCP client connected to it can trigger
// writes through it — it should be its own funded, low-privilege identity,
// not whatever key you use for one-off human-run deploys. See SKILL.md.
export async function getWriteClient() {
  if (writeClient) return writeClient;
  const privateKey = process.env.PARCELCOURT_AGENT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "PARCELCOURT_AGENT_PRIVATE_KEY is not set. Writes are disabled " +
        "without it — see SKILL.md before enabling them."
    );
  }
  assertHexPrivateKey(privateKey);
  const chain = resolveChain();
  const account = createAccount(privateKey);
  writeClient = createClient({ chain, account });
  return writeClient;
}

export function writesEnabled(): boolean {
  return process.env.PARCELCOURT_ENABLE_WRITES === "1";
}

export async function writeAndConfirm(
  functionName: string,
  args: unknown[]
): Promise<`0x${string}`> {
  const { TransactionStatus } = await import("genlayer-js/types");
  const client = await getWriteClient();
  const address = contractAddress();

  const hash = await client.writeContract({
    address,
    functionName,
    // Same genlayer-js CalldataEncodable[] gap as scripts/seed_fixtures.ts
    // — genlayer-js has no way to know this function's actual argument
    // shape, so the type is widened here rather than guessed at.
    args: args as Parameters<typeof client.writeContract>[0]["args"],
    value: BigInt(0),
  });
  await client.waitForTransactionReceipt({
    // Same Hash-branding gap as everywhere else this appears in this
    // codebase: writeContract returns a plain `0x${string}`,
    // waitForTransactionReceipt wants the nominally-branded Hash type.
    hash: hash as unknown as import("genlayer-js/types").Hash,
    // ACCEPTED, not FINALIZED — matches deploy/001_deploy_parcel_court.ts
    // and app/lib/genlayer.ts in the parent project; see the detailed
    // comment in the latter.
    status: TransactionStatus.ACCEPTED,
  });
  return hash;
}
