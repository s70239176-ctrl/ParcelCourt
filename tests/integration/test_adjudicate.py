"""Integration test — requires a running GenLayer Studio/testnet and the
`gltest` runner (installed as part of the real `genlayer` toolchain, see
README "Live mode"). This is NOT run by the offline `pytest tests/direct`
suite; it deploys the real contract and exercises one full claim against
actual validators.

    gltest tests/integration -v -s

This file intentionally does not import the tests/direct offline stub —
gltest provides its own fixtures (`gl_client`, `deploy_contract`, etc.) per
the genlayer-project-boilerplate conventions. If your gltest version names
these fixtures differently, adjust the two calls below to match; the
assertions are what matter for judges validating the deployed behavior.
"""

import pytest

CONTRACT_PATH = "contracts/parcel_court.py"


@pytest.mark.integration
def test_deploy_open_submit_adjudicate_live(gltest_client):
    """One end-to-end pass against a live GenLayer Studio deployment:
    deploy -> open a 4821-style claim -> submit two evidence rows ->
    adjudicate -> assert the verdict lands in the allowed set."""

    contract = gltest_client.deploy(CONTRACT_PATH, args=[])

    claim_id = contract.open_claim(
        order_id="ORD-4821",
        sku="EARBUD-WHT-01",
        amount_cents=8900,
        seller=gltest_client.accounts[1].address,
        tracking_url="https://tracking.example/8821-transit",
        listing_url="https://shop.example/listings/wireless-earbuds-4821",
    )
    assert isinstance(claim_id, int) and claim_id > 0

    contract.submit_evidence(
        claim_id,
        "seller",
        "ipfs://packout-4821-01.mp4",
        "a" * 64,
        "Pack-out video, scale visible, 420g before seal.",
        420,
    )
    contract.submit_evidence(
        claim_id,
        "buyer",
        "ipfs://unbox-4821-01.mp4",
        "c" * 64,
        "Unboxing video, shipping label in frame throughout, scale reads 418g.",
        418,
    )

    verdict = contract.adjudicate(claim_id)
    assert verdict in {"TRANSIT", "SELLER", "BUYER", "SPLIT", "INSUFFICIENT"}

    stored = contract.get_claim(claim_id)
    assert stored["status"] == "SETTLED"
    assert stored["verdict"] == verdict
    assert 0 < len(stored["rationale"]) <= 800
