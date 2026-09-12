# ParcelCourt — demo script

Total time: ~90 seconds. Mock mode (`NEXT_PUBLIC_MOCK=1`) needs no wallet,
no Studio instance, and no network call — every screen renders from the
same fixtures exercised in `tests/direct`.

```bash
cd app
NEXT_PUBLIC_MOCK=1 npm install && npm run dev
```

Open `http://localhost:3000`.

## 1. The docket (`/`)

Three settled claims, one per canonical fixture, same SKU
(`EARBUD-WHT-01`), same $89.00. Status column reads
"Intelligent Contract · equivalence reached" for each — nothing is
sitting in a pending or ADJUDICATED-but-unsettled state in the seeded
demo data.

## 2. Claim 4821 (`/claims/4821`)

Click **#4821**. This is the hero. You should see:

- Three evidence columns — **Seller / Carrier / Buyer** — each showing
  the submitted pack-out weight, video/photo placeholder, and a short
  hash.
- An oxblood **Transit** verdict chip, stamped in with the one deliberate
  Framer Motion moment in the whole app.
- A two-line rationale under the chip: carrier exception + matching
  weights (420g pack-out vs. 418g inbound, under 1% delta) puts this on
  the carrier, not the seller.
- The line "Intelligent Contract · equivalence reached" underneath the
  rationale.

Try `Cmd/Ctrl+P` — the page has print CSS and drops the nav for a clean
printed record.

## 3. Rubric v1 (`/rubric`)

A real route, not a modal — the `PARTY | STRONG | WEAK` table exactly as
specified, plus the five-point decision logic (weight mismatch, carrier
exception + matching weights, fabrication signals, both-strong conflict,
never-invent-facts) and the sub-$25 / thin-evidence defaults.

## 4. Three fixtures (`/demo`)

All three canonical claims side by side:

| Claim | Verdict |
|---|---|
| 4821 | `TRANSIT` |
| 4822 | `BUYER` (empty box) |
| 4823 | `BUYER` (fabricated) |

Same rubric, same $89 item, three different inbound conditions, three
different verdicts. Click through any card to land back on its full
claim page.

## 5. Protocol (`/protocol`) — optional

The on-chain/off-chain stack, top to bottom: evidence intake → live
tracking/listing fetch under `strict_eq` → the compact dossier → the
locked rubric-v1 judge prompt under `prompt_non_comparative` →
deterministic escrow release.

## If you want to see it adjudicate live

Mock mode's claims are pre-settled, so there's nothing left to adjudicate
in the UI — that's deliberate, so judges without Studio access still see
the finished product. To watch `adjudicate()` actually run against a real
deployment:

```bash
cd app
GENLAYER_CHAIN=studionet GENLAYER_DEPLOYER_KEY=... npm run deploy
GENLAYER_CHAIN=studionet GENLAYER_CONTRACT_ADDRESS=... GENLAYER_DEPLOYER_KEY=... \
  SEED_SKIP_ADJUDICATE=1 npm run seed
NEXT_PUBLIC_MOCK=0 GENLAYER_CHAIN=studionet GENLAYER_CONTRACT_ADDRESS=... npm run dev
```

Open any seeded claim and click **Run adjudication** — the button reads
"Awaiting equivalence…" while validators converge, then the page
refreshes with the stamped verdict chip and rationale.
