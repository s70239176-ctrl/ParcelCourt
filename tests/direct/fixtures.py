"""Canonical fixtures shared by direct tests, the seed script (via
app/lib/fixtures.ts, kept in sync by hand — see DEMO.md), and the mock UI.

Claim 4821 — Wireless earbuds — $89.00 — is the hero fixture referenced
throughout the README/DEMO. 01/02/03 are the three canonical scenarios;
04 is the both-strong conflict used to exercise SPLIT.
"""

SELLER = "0xSELLER0000000000000000000000000000001"
BUYER = "0xBUYER00000000000000000000000000000001"
CARRIER_TRACKING_OK_EXCEPTION = "https://tracking.example/8821-transit"
CARRIER_TRACKING_NO_EXCEPTION = "https://tracking.example/8821-clean"
LISTING_URL = "https://shop.example/listings/wireless-earbuds-4821"

LISTING_PAYLOAD = {
    "title": "Wireless Earbuds — Matte White Case",
    "image_urls": [
        "https://cdn.example/listing/earbuds-1.jpg",
        "https://cdn.example/listing/earbuds-2.jpg",
    ],
}

TRACKING_PAYLOAD_EXCEPTION = {
    "status": "delivered",
    "last_scan_city": "Louisville, KY",
    "last_scan_date": "2026-08-14",
    "exception": True,
}

TRACKING_PAYLOAD_CLEAN = {
    "status": "delivered",
    "last_scan_city": "Louisville, KY",
    "last_scan_date": "2026-08-14",
    "exception": False,
}


FIXTURE_01_TRANSIT = {
    "key": "01-transit",
    "label": "TRANSIT",
    "claim": dict(
        order_id="ORD-4821",
        sku="EARBUD-WHT-01",
        amount_cents=8900,
        seller=SELLER,
        tracking_url=CARRIER_TRACKING_OK_EXCEPTION,
        listing_url=LISTING_URL,
    ),
    "buyer": BUYER,
    "evidence": [
        dict(
            role="seller",
            uri="ipfs://packout-4821-01.mp4",
            sha256="a" * 64,
            note="Pack-out video, scale visible, 420g before seal.",
            weight_g=420,
        ),
        dict(
            role="carrier",
            uri="https://tracking.example/8821-transit/exception-report",
            sha256="b" * 64,
            note="Carrier exception logged: crushed corner, in transit.",
            weight_g=0,
        ),
        dict(
            role="buyer",
            uri="ipfs://unbox-4821-01.mp4",
            sha256="c" * 64,
            note="Unboxing video, shipping label in frame throughout, scale reads 418g.",
            weight_g=418,
        ),
    ],
    "tracking_payload": TRACKING_PAYLOAD_EXCEPTION,
    "expected_verdict": "TRANSIT",
    "mock_judge_response": {
        "verdict": "TRANSIT",
        "rationale": (
            "Carrier logged a transit exception and buyer's unboxing video "
            "(label in frame) shows 418g against seller's 420g pack-out — "
            "under 1% delta. Damage occurred after seller's compliant "
            "hand-off; carrier bears it."
        ),
        "cited": ["carrier_tracking_fact.exception", "seller_evidence[0].weight_g", "buyer_evidence[0].weight_g"],
    },
}

FIXTURE_02_BUYER_EMPTY = {
    "key": "02-buyer-empty",
    "label": "BUYER",
    "claim": dict(
        order_id="ORD-4821",
        sku="EARBUD-WHT-01",
        amount_cents=8900,
        seller=SELLER,
        tracking_url=CARRIER_TRACKING_NO_EXCEPTION,
        listing_url=LISTING_URL,
    ),
    "buyer": BUYER,
    "evidence": [
        dict(
            role="seller",
            uri="ipfs://packout-4821-02.mp4",
            sha256="d" * 64,
            note="Pack-out video, scale visible, 420g before seal.",
            weight_g=420,
        ),
        dict(
            role="buyer",
            uri="ipfs://still-4821-02.jpg",
            sha256="e" * 64,
            note="Box arrived with only an air pillow inside.",
            weight_g=90,
        ),
    ],
    "tracking_payload": TRACKING_PAYLOAD_CLEAN,
    "expected_verdict": "BUYER",
    "mock_judge_response": {
        "verdict": "BUYER",
        "rationale": (
            "Inbound weight of 90g is 78.6% below seller's documented 420g "
            "pack-out, no carrier exception was logged, and buyer submitted "
            "only a single still with no unboxing video. Weight mismatch "
            "this large without video evidence indicates the box arrived "
            "effectively empty; contents did not leave seller's custody "
            "missing at that weight."
        ),
        "cited": ["weight_delta_pct_seller_to_buyer", "evidence_strength.buyer"],
    },
}

FIXTURE_03_BUYER_FABRICATED = {
    "key": "03-buyer-fabricated",
    "label": "BUYER",
    "claim": dict(
        order_id="ORD-4821",
        sku="EARBUD-WHT-01",
        amount_cents=8900,
        seller=SELLER,
        tracking_url=CARRIER_TRACKING_NO_EXCEPTION,
        listing_url=LISTING_URL,
    ),
    "buyer": BUYER,
    "evidence": [
        dict(
            role="seller",
            uri="ipfs://packout-4821-03.mp4",
            sha256="f" * 64,
            note="Clean pack-out video, 420g, label applied after seal.",
            weight_g=420,
        ),
        dict(
            role="buyer",
            uri="ipfs://still-4821-03.jpg",
            sha256="0" * 64,
            note="Case arrived with a perfect hairline crack down the lid. lbl:XJ##Q9-void artifact",
            weight_g=0,
        ),
    ],
    "tracking_payload": TRACKING_PAYLOAD_CLEAN,
    "expected_verdict": "BUYER",
    "mock_judge_response": {
        "verdict": "BUYER",
        "rationale": (
            "Buyer's sole evidence is one orphan still of an implausibly "
            "clean crack, no weight, no video, and the note contains "
            "garbled label text inconsistent with the listing. Seller's "
            "pack-out record is clean at 420g. An isolated JPEG cannot "
            "carry a claim, and the artifact text reads as staged."
        ),
        "cited": ["evidence_strength.buyer", "evidence_strength.seller"],
    },
}

FIXTURE_04_SPLIT = {
    "key": "04-split",
    "label": "SPLIT",
    "claim": dict(
        order_id="ORD-4900",
        sku="EARBUD-WHT-02",
        amount_cents=8900,
        seller=SELLER,
        tracking_url=CARRIER_TRACKING_OK_EXCEPTION,
        listing_url=LISTING_URL,
    ),
    "buyer": BUYER,
    "evidence": [
        dict(
            role="seller",
            uri="ipfs://packout-4900.mp4",
            sha256="1" * 64,
            note="Pack-out video, scale visible, 420g before seal.",
            weight_g=420,
        ),
        dict(
            role="carrier",
            uri="https://tracking.example/8821-transit/exception-report",
            sha256="2" * 64,
            note="Carrier exception logged: box crushed corner, in transit.",
            weight_g=0,
        ),
        dict(
            role="buyer",
            uri="ipfs://unbox-4900.mp4",
            sha256="3" * 64,
            note="Unboxing video, label in frame, scale reads 420g, but earbuds inside are visibly a different model than listed.",
            weight_g=420,
        ),
    ],
    "tracking_payload": TRACKING_PAYLOAD_EXCEPTION,
    "expected_verdict": "SPLIT",
    "mock_judge_response": {
        "verdict": "SPLIT",
        "rationale": (
            "Both sides cleared the strong-evidence bar — seller's weighed, "
            "videoed pack-out and buyer's label-in-frame unbox agree on "
            "420g — but buyer's video shows a different model than the "
            "listing, which weight alone does not resolve. Record conflicts "
            "even with full compliance from both parties."
        ),
        "cited": ["seller_evidence[0].weight_g", "buyer_evidence[0].weight_g", "listing_fact.title"],
    },
}

ALL_FIXTURES = [
    FIXTURE_01_TRANSIT,
    FIXTURE_02_BUYER_EMPTY,
    FIXTURE_03_BUYER_FABRICATED,
    FIXTURE_04_SPLIT,
]
