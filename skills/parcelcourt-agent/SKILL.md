---
name: parcelcourt-agent
description: MCP server exposing ParcelCourt's contract actions (list/get claims, get evidence, get rubric, get balance, and optionally open a claim / submit evidence / adjudicate) as tools any MCP-compatible agent can call over stdio.
---

# ParcelCourt agent skill

This is a standalone MCP server, separate from the public website in `app/`.
It wraps the same deployed ParcelCourt contract that the website talks to,
so any MCP-compatible agent (Claude Code, Claude Desktop, or any other MCP
client) can read the docket and — if explicitly enabled — open claims,
submit evidence, and adjudicate, without a browser or a human clicking
buttons.

It does not replace the website. The website is for a human with their own
wallet. This is for an agent acting through one configured identity.

## Tools

Always available (no on-chain identity needed):

- `list_claims` — every claim on the docket
- `get_claim(claim_id)` — one claim's order/sku/amount/status/verdict/rationale
- `get_evidence(claim_id)` — every evidence row submitted for a claim
- `get_rubric` — the adjudication rubric (id, minimum claim amount, possible verdicts)
- `get_balance(address)` — an address's mock-escrow balance

Only available when `PARCELCOURT_ENABLE_WRITES=1` (see below):

- `open_claim(order_id, sku, amount_cents, seller, tracking_url, listing_url)`
- `submit_evidence(claim_id, role, uri, sha256, note, weight_g)`
- `adjudicate(claim_id)`

## Setup

```bash
cd skills/parcelcourt-agent
npm install
cp .env.example .env
# fill in GENLAYER_CONTRACT_ADDRESS at minimum
npm start
```

Run it through the MCP Inspector to try tools by hand before wiring it into
a real agent:

```bash
npx @modelcontextprotocol/inspector npm start
```

To register it with an MCP-aware host (Claude Code, Claude Desktop, etc.),
point the host at `npm start` (or `npx tsx src/index.ts`) run from this
directory, with the same `.env` in place.

## Trust boundary — read this before setting `PARCELCOURT_ENABLE_WRITES=1`

Every write this server makes executes as **`PARCELCOURT_AGENT_PRIVATE_KEY`'s
on-chain identity — not the calling agent's.** An agent doesn't have a
wallet of its own; when it calls `open_claim`, the buyer recorded on-chain
is this server's configured address, not the agent or whoever is prompting
it. Anyone who can reach this server (any MCP client it's wired into) can
trigger real, gas-consuming, contract-state-changing transactions signed by
that one key. That's why:

- Writes are **off by default**. Reads work with no configuration beyond
  the contract address; writes need an explicit, deliberate opt-in.
- `PARCELCOURT_AGENT_PRIVATE_KEY` is a **separate variable from
  `GENLAYER_DEPLOYER_KEY`** (used by `deploy/` and `scripts/` in the parent
  project). Don't reuse your deploy key here — generate a dedicated wallet,
  fund it only with what this identity needs to operate, and treat it as
  compromised the moment this server is reachable by anything you don't
  fully trust.
- There is no per-caller authorization in this server. If multiple agents
  or people can reach it, they all write as the same identity — this
  server does not distinguish between them. If you need that distinction,
  it has to be built at whatever layer connects agents to this server
  (e.g. a gateway that maps callers to their own keys), not assumed here.

## Known limitations

- `open_claim`'s returned `claim_id` is recovered by re-reading
  `list_claims` and matching on `order_id` after the transaction confirms,
  not by decoding the contract's actual return value — genlayer-js's
  transaction receipt doesn't reliably expose that for an arbitrary
  contract. Two concurrent calls with the same `order_id` could race. See
  the equivalent comment in `app/lib/genlayer.ts`'s `openClaim()`.
- If `GENLAYER_CHAIN` is a custom environment (not one of genlayer-js's
  four built-in presets), the custom chain definition inherits
  `studionet`'s consensus contract addresses — an assumption documented
  and flagged, not confirmed, in `src/genlayer-client.ts` and
  `app/lib/genlayer.ts`.
