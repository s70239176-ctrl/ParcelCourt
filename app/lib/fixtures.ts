// Mirrors tests/direct/fixtures.py. Kept in sync by hand (see DEMO.md) —
// this is what NEXT_PUBLIC_MOCK=1 renders when judges can't hit Studio.

export type Role = "seller" | "buyer" | "carrier" | "warehouse";
export type Verdict = "TRANSIT" | "SELLER" | "BUYER" | "SPLIT" | "INSUFFICIENT";
export type ClaimStatus = "OPEN" | "ADJUDICATED" | "SETTLED";

export interface EvidenceRow {
  role: Role;
  uri: string;
  sha256: string;
  note: string;
  weight_g: number;
  submitted_by: string;
  image?: string; // local placeholder for mock mode only
}

export interface Claim {
  id: number;
  order_id: string;
  sku: string;
  amount_cents: number;
  buyer: string;
  seller: string;
  tracking_url: string;
  listing_url: string;
  status: ClaimStatus;
  verdict: Verdict | "";
  rationale: string;
  created_at: number;
  evidence: EvidenceRow[];
}

const SELLER = "0xSELLER0000000000000000000000000000001";
const BUYER = "0xBUYER00000000000000000000000000000001";

export const FIXTURE_CLAIMS: Claim[] = [
  {
    id: 4821,
    order_id: "ORD-4821",
    sku: "EARBUD-WHT-01",
    amount_cents: 8900,
    buyer: BUYER,
    seller: SELLER,
    tracking_url: "https://tracking.example/8821-transit",
    listing_url: "https://shop.example/listings/wireless-earbuds-4821",
    status: "SETTLED",
    verdict: "TRANSIT",
    rationale:
      "Carrier logged a transit exception and buyer's unboxing video (label in frame) shows 418g against seller's 420g pack-out — under 1% delta. Damage occurred after seller's compliant hand-off; carrier bears it.",
    created_at: 1755100800,
    evidence: [
      {
        role: "seller",
        uri: "ipfs://packout-4821-01.mp4",
        sha256: "a".repeat(64),
        note: "Pack-out video, scale visible, 420g before seal.",
        weight_g: 420,
        submitted_by: SELLER,
        image: "/fixtures/packout-420g.svg",
      },
      {
        role: "carrier",
        uri: "https://tracking.example/8821-transit/exception-report",
        sha256: "b".repeat(64),
        note: "Carrier exception logged: crushed corner, in transit.",
        weight_g: 0,
        submitted_by: "carrier-oracle",
        image: "/fixtures/carrier-exception.svg",
      },
      {
        role: "buyer",
        uri: "ipfs://unbox-4821-01.mp4",
        sha256: "c".repeat(64),
        note: "Unboxing video, shipping label in frame throughout, scale reads 418g.",
        weight_g: 418,
        submitted_by: BUYER,
        image: "/fixtures/unbox-label-in-frame.svg",
      },
    ],
  },
  {
    id: 4822,
    order_id: "ORD-4822",
    sku: "EARBUD-WHT-01",
    amount_cents: 8900,
    buyer: BUYER,
    seller: SELLER,
    tracking_url: "https://tracking.example/8822-clean",
    listing_url: "https://shop.example/listings/wireless-earbuds-4821",
    status: "SETTLED",
    verdict: "BUYER",
    rationale:
      "Inbound weight of 90g is 78.6% below seller's documented 420g pack-out, no carrier exception was logged, and buyer submitted only a single still with no unboxing video. Weight mismatch this large without video evidence indicates the box arrived effectively empty.",
    created_at: 1755187200,
    evidence: [
      {
        role: "seller",
        uri: "ipfs://packout-4822.mp4",
        sha256: "d".repeat(64),
        note: "Pack-out video, scale visible, 420g before seal.",
        weight_g: 420,
        submitted_by: SELLER,
        image: "/fixtures/packout-420g.svg",
      },
      {
        role: "buyer",
        uri: "ipfs://still-4822.jpg",
        sha256: "e".repeat(64),
        note: "Box arrived with only an air pillow inside.",
        weight_g: 90,
        submitted_by: BUYER,
        image: "/fixtures/air-pillow-only.svg",
      },
    ],
  },
  {
    id: 4823,
    order_id: "ORD-4823",
    sku: "EARBUD-WHT-01",
    amount_cents: 8900,
    buyer: BUYER,
    seller: SELLER,
    tracking_url: "https://tracking.example/8823-clean",
    listing_url: "https://shop.example/listings/wireless-earbuds-4821",
    status: "SETTLED",
    verdict: "BUYER",
    rationale:
      "Buyer's sole evidence is one orphan still of an implausibly clean crack, no weight, no video, and the note contains garbled label text inconsistent with the listing. Seller's pack-out record is clean at 420g. An isolated JPEG cannot carry a claim.",
    created_at: 1755273600,
    evidence: [
      {
        role: "seller",
        uri: "ipfs://packout-4823.mp4",
        sha256: "f".repeat(64),
        note: "Clean pack-out video, 420g, label applied after seal.",
        weight_g: 420,
        submitted_by: SELLER,
        image: "/fixtures/packout-420g.svg",
      },
      {
        role: "buyer",
        uri: "ipfs://still-4823.jpg",
        sha256: "0".repeat(64),
        note: "Case arrived with a perfect hairline crack down the lid. lbl:XJ##Q9-void artifact",
        weight_g: 0,
        submitted_by: BUYER,
        image: "/fixtures/orphan-crack-still.svg",
      },
    ],
  },
];

export function getFixtureClaim(id: number): Claim | undefined {
  return FIXTURE_CLAIMS.find((c) => c.id === id);
}
