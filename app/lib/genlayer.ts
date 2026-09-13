// Thin wrapper around the real genlayer-js client (v1.x). In mock mode
// (NEXT_PUBLIC_MOCK=1) every call resolves from fixtures.ts instead of
// hitting a contract, so the UI is fully demoable without Studio running.
//
// NOTE ON THIS REWRITE: the original version of this file was written
// against an invented API (`createClient({ rpcUrl })`, `readContract({
// method })`, a per-call `account` on writeContract) that doesn't match
// the real SDK — see https://github.com/genlayerlabs/genlayer-js. It has
// been corrected to match the documented v1.1.8 API (`createClient({
// chain })` with chain objects from `genlayer-js/chains`, `functionName`
// instead of `method`, a wallet-bound write client instead of a per-call
// account). This sandbox has no network access to actually run it against
// a live Studio/testnet deployment, so treat this as "matches the
// documented API," not "network-verified" — run `npm run dev` against a
// real deployment yourself to confirm end-to-end.

import { Claim, FIXTURE_CLAIMS, getFixtureClaim } from "./fixtures";

// Mock mode is the default so a fresh `npm install && npm run dev` demos
// immediately with zero configuration (this is a judge-facing hackathon
// build). Live mode is opt-in: set NEXT_PUBLIC_MOCK=0 explicitly.
const isMock = process.env.NEXT_PUBLIC_MOCK !== "0";

// One of the chain export names in genlayer-js/chains ("localnet",
// "studionet", "testnetAsimov", "testnetBradbury"), OR a custom
// environment name (e.g. "studio-dev") paired with
// NEXT_PUBLIC_GENLAYER_RPC_URL + NEXT_PUBLIC_GENLAYER_CHAIN_ID below.
// Defaults to studionet.
//
// NEXT_PUBLIC_-prefixed: adjudicate() runs client-side (it needs
// window.ethereum to let a connected wallet sign the transaction — that
// can't move to a server action), so this has to be readable in the
// browser bundle. A chain name isn't sensitive; only GENLAYER_DEPLOYER_KEY
// (used solely by the standalone deploy/seed scripts, never by this file)
// needs to stay unprefixed.
const CHAIN_NAME = process.env.NEXT_PUBLIC_GENLAYER_CHAIN ?? "studionet";
const CUSTOM_RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL;
const CUSTOM_CHAIN_ID = process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID;

async function resolveChain(): Promise<import("genlayer-js/types").GenLayerChain> {
  const chains = await import("genlayer-js/chains");
  const byName: Record<string, import("genlayer-js/types").GenLayerChain> = chains as any;
  const preset = byName[CHAIN_NAME];
  if (preset) return preset;

  // Not one of the four built-in presets. genlayer-js/chains has no
  // "studio-dev"-style entry as of v1.1.8 (confirmed against the package's
  // own docs/source), so a Studio environment under a different name needs
  // to be built manually: take `studionet` as a base and override just the
  // RPC endpoint and chain ID.
  //
  // UNVERIFIED ASSUMPTION, flagged deliberately: this inherits studionet's
  // consensusMainContract/consensusDataContract addresses on the theory
  // that a "studio-dev"-type environment is the same consensus deployment
  // behind a different RPC gateway, not a separate one. GenLayer's own
  // genlayer-py release notes classify multiple hosted "Studio" chain IDs
  // (61997, 61999) as siblings under the same "Studio chain" category,
  // which supports but doesn't prove this. If reads work but writes fail
  // in a way that looks like a rejected/misrouted transaction rather than
  // a clear error, THIS is the assumption to revisit — get the actual
  // consensusMainContract/consensusDataContract addresses for this
  // specific environment from whoever provided its RPC URL/chain ID, and
  // override those two fields as well.
  if (CUSTOM_RPC_URL && CUSTOM_CHAIN_ID) {
    const base = byName["studionet"];
    return {
      ...base,
      id: Number(CUSTOM_CHAIN_ID),
      name: CHAIN_NAME,
      rpcUrls: {
        ...base.rpcUrls,
        default: { http: [CUSTOM_RPC_URL] },
      },
    };
  }

  throw new Error(
    `Unknown GENLAYER_CHAIN "${CHAIN_NAME}". Expected one of: localnet, ` +
      "studionet, testnetAsimov, testnetBradbury — or set both " +
      "NEXT_PUBLIC_GENLAYER_RPC_URL and NEXT_PUBLIC_GENLAYER_CHAIN_ID to " +
      "point at a custom environment."
  );
}

let cachedReadClient: any | null = null;

// Read-only client: no account/provider needed.
async function getReadClient() {
  if (isMock) return null;
  if (cachedReadClient) return cachedReadClient;

  const { createClient } = await import("genlayer-js");
  const chain = await resolveChain();
  cachedReadClient = createClient({ chain });
  return cachedReadClient;
}

// Write client: bound to a signer at creation time (wallet or demo
// account), per the documented pattern — writeContract itself takes no
// account argument. Built fresh per call rather than cached, since the
// injected wallet account can change between calls.
async function getWriteClient() {
  const { createClient } = await import("genlayer-js");
  const chain = await resolveChain();

  // Prefer an injected wallet (e.g. MetaMask via Studio) if present; fall
  // back to a configured demo account for headless demos. Never block the
  // UI behind a broken wallet modal — surface a clear error instead.
  const injected = typeof window !== "undefined" ? (window as any).ethereum : undefined;
  const rawAccount: string | undefined = injected
    ? (await injected.request({ method: "eth_requestAccounts" }))?.[0]
    : process.env.NEXT_PUBLIC_GENLAYER_DEMO_ACCOUNT;
  if (!rawAccount) {
    throw new Error(
      "No wallet detected and no demo account configured. Connect a " +
        "wallet, or set NEXT_PUBLIC_GENLAYER_DEMO_ACCOUNT for headless demos."
    );
  }
  const account = asAddress(rawAccount);

  return createClient({ chain, account, provider: injected });
}

function contractAddress(): `0x${string}` {
  const address = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error(
      "Live mode requires NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS. Unset " +
        "NEXT_PUBLIC_MOCK (or set it to 1) to run against fixtures instead."
    );
  }
  return asAddress(address);
}

// `Address` (from genlayer-js/types, via viem) is the branded template
// literal type `0x${string}`, not a plain `string` — env vars and other
// runtime strings need an explicit, validated cast to satisfy it.
function asAddress(value: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`Not a valid 0x-prefixed address: "${value}"`);
  }
  return value as `0x${string}`;
}

export async function listClaims(): Promise<Claim[]> {
  if (isMock) return FIXTURE_CLAIMS;

  const client = await getReadClient();
  const address = contractAddress();
  const rows = (await client.readContract({ address, functionName: "list_claims", args: [] })) as any[] | null;
  if (!rows || !Array.isArray(rows)) return [];
  return Promise.all(
    rows.map(async (row: any) => ({
      ...row,
      evidence: await client.readContract({
        address,
        functionName: "get_evidence",
        args: [row.id],
      }),
    }))
  );
}

export async function getClaim(id: number): Promise<Claim | undefined> {
  if (isMock) return getFixtureClaim(id);

  const client = await getReadClient();
  const address = contractAddress();
  const [claim, evidence] = (await Promise.all([
    client.readContract({ address, functionName: "get_claim", args: [id] }),
    client.readContract({ address, functionName: "get_evidence", args: [id] }),
  ])) as [any, any];
  if (!claim) return undefined;
  return { ...claim, id, evidence };
}

export async function getRubric() {
  if (isMock) {
    return {
      rubric_id: "v1",
      min_meaningful_claim_cents: 2500,
      verdicts: ["BUYER", "INSUFFICIENT", "SELLER", "SPLIT", "TRANSIT"],
    };
  }
  const client = await getReadClient();
  const address = contractAddress();
  return client.readContract({ address, functionName: "get_rubric", args: [] });
}

export async function adjudicate(id: number): Promise<string> {
  if (isMock) {
    // Mock mode "adjudicates" by returning the pre-baked fixture verdict —
    // there is no LLM/network call to make; this is a UI-state demo only.
    const claim = getFixtureClaim(id);
    if (!claim) throw new Error(`unknown fixture claim ${id}`);
    return claim.verdict as string;
  }

  const { TransactionStatus } = await import("genlayer-js/types");
  const client = await getWriteClient();
  const address = contractAddress();

  const transactionHash = await client.writeContract({
    address,
    functionName: "adjudicate",
    args: [id],
    value: BigInt(0),
  });
  await client.waitForTransactionReceipt({
    // Same genlayer-js Hash-branding gap as deploy/001_deploy_parcel_court.ts
    // and scripts/seed_fixtures.ts: writeContract returns a plain
    // `0x${string}`, waitForTransactionReceipt wants the nominally-branded
    // Hash (`0x${string}` & { length: 66 }).
    hash: transactionHash as unknown as import("genlayer-js/types").Hash,
    status: TransactionStatus.FINALIZED,
  });
  // The receipt shape doesn't guarantee a decoded `verdict` field for an
  // arbitrary contract, so re-read state rather than trust the receipt.
  return (await getClaim(id))?.verdict ?? "";
}

export function isMockMode() {
  return isMock;
}
