import json

import pytest
import genlayer as gl
from genlayer.types import Address

from parcel_court import ParcelCourt

from fixtures import (
    ALL_FIXTURES,
    FIXTURE_01_TRANSIT,
    FIXTURE_02_BUYER_EMPTY,
    FIXTURE_03_BUYER_FABRICATED,
    FIXTURE_04_SPLIT,
    LISTING_PAYLOAD,
    SELLER,
    BUYER,
)


def _install_hooks(fixture):
    """Route gl.nondet.web.render -> the fixture's tracking/listing payloads,
    and gl.nondet.exec_prompt -> the fixture's canned judge response. This
    is the offline stand-in for what a real validator run would fetch/judge."""

    def web_hook(url: str):
        if url == fixture["claim"]["tracking_url"]:
            return fixture["tracking_payload"]
        if url == fixture["claim"]["listing_url"]:
            return LISTING_PAYLOAD
        raise AssertionError(f"unexpected URL fetched: {url}")

    def llm_hook(prompt: str):
        return json.dumps(fixture["mock_judge_response"])

    gl.nondet.web._hook = web_hook
    gl.nondet._llm_hook = llm_hook
    return prompt_capture_hook(llm_hook)


def prompt_capture_hook(inner):
    """Wraps the LLM hook so tests can also inspect the exact prompt sent,
    without changing the contract's call signature."""
    captured = {}

    def hook(prompt: str):
        captured["prompt"] = prompt
        return inner(prompt)

    gl.nondet._llm_hook = hook
    return captured


def _open_and_populate(court: ParcelCourt, fixture) -> int:
    gl.message.sender_address = fixture["buyer"]
    claim_id = court.open_claim(**fixture["claim"])
    for row in fixture["evidence"]:
        gl.message.sender_address = row["submitted_by"] if "submitted_by" in row else fixture["buyer"]
        court.submit_evidence(
            claim_id,
            row["role"],
            row["uri"],
            row["sha256"],
            row["note"],
            row["weight_g"],
        )
    return claim_id


@pytest.fixture
def court():
    return ParcelCourt()


@pytest.mark.parametrize("fixture", ALL_FIXTURES, ids=lambda f: f["key"])
def test_fixture_reaches_expected_verdict(court, fixture):
    captured = _install_hooks(fixture)
    claim_id = _open_and_populate(court, fixture)

    verdict = court.adjudicate(claim_id)

    assert verdict == fixture["expected_verdict"]
    stored = court.get_claim(claim_id)
    assert stored["verdict"] == fixture["expected_verdict"]
    assert stored["status"] == "SETTLED"
    assert stored["rationale"]  # non-empty, cited rationale was stored
    return captured


def test_happy_path_open_submit_adjudicate(court):
    fixture = FIXTURE_01_TRANSIT
    _install_hooks(fixture)

    gl.message.sender_address = fixture["buyer"]
    claim_id = court.open_claim(**fixture["claim"])

    claim = court.get_claim(claim_id)
    assert claim["status"] == "OPEN"
    assert claim["buyer"] == fixture["buyer"]
    assert claim["seller"] == fixture["claim"]["seller"]

    for row in fixture["evidence"]:
        court.submit_evidence(
            claim_id, row["role"], row["uri"], row["sha256"], row["note"], row["weight_g"]
        )
    assert len(court.get_evidence(claim_id)) == 3

    verdict = court.adjudicate(claim_id)
    assert verdict == "TRANSIT"

    # Escrow: buyer should have been credited the full claim amount.
    assert int(court.get_balance(Address(fixture["buyer"]))) == fixture["claim"]["amount_cents"]


def test_double_adjudicate_reverts(court):
    fixture = FIXTURE_01_TRANSIT
    _install_hooks(fixture)
    claim_id = _open_and_populate(court, fixture)
    court.adjudicate(claim_id)

    with pytest.raises(gl.vm.UserError):
        court.adjudicate(claim_id)


def test_unknown_role_reverts(court):
    fixture = FIXTURE_01_TRANSIT
    _install_hooks(fixture)
    gl.message.sender_address = fixture["buyer"]
    claim_id = court.open_claim(**fixture["claim"])

    with pytest.raises(gl.vm.UserError):
        court.submit_evidence(claim_id, "notary", "ipfs://x", "a" * 64, "note", 0)


def test_missing_claim_reverts(court):
    with pytest.raises(gl.vm.UserError):
        court.get_claim(999)
    with pytest.raises(gl.vm.UserError):
        court.submit_evidence(999, "buyer", "ipfs://x", "a" * 64, "note", 0)
    with pytest.raises(gl.vm.UserError):
        court.adjudicate(999)


def test_fixture_01_prompt_contains_carrier_exception_and_weight():
    court = ParcelCourt()
    fixture = FIXTURE_01_TRANSIT
    captured = _install_hooks(fixture)
    claim_id = _open_and_populate(court, fixture)
    court.adjudicate(claim_id)

    prompt = captured["prompt"]
    assert "420" in prompt
    parsed = json.loads(prompt.split("DOSSIER:\n", 1)[1])
    assert parsed["carrier_tracking_fact"]["exception"] is True
    assert parsed["seller_evidence"][0]["weight_g"] == 420


def test_fixture_02_dossier_contains_weight_mismatch():
    court = ParcelCourt()
    fixture = FIXTURE_02_BUYER_EMPTY
    captured = _install_hooks(fixture)
    claim_id = _open_and_populate(court, fixture)
    court.adjudicate(claim_id)

    dossier = json.loads(captured["prompt"].split("DOSSIER:\n", 1)[1])
    assert dossier["seller_evidence"][0]["weight_g"] == 420
    assert dossier["buyer_evidence"][0]["weight_g"] == 90
    assert dossier["weight_delta_pct_seller_to_buyer"] > 25


def test_fixture_03_dossier_marks_buyer_evidence_weak():
    court = ParcelCourt()
    fixture = FIXTURE_03_BUYER_FABRICATED
    captured = _install_hooks(fixture)
    claim_id = _open_and_populate(court, fixture)
    court.adjudicate(claim_id)

    dossier = json.loads(captured["prompt"].split("DOSSIER:\n", 1)[1])
    assert dossier["evidence_strength"]["buyer"] == "weak"
    assert dossier["evidence_strength"]["seller"] == "strong"


def test_fixture_04_both_strong_conflict_yields_split():
    court = ParcelCourt()
    fixture = FIXTURE_04_SPLIT
    captured = _install_hooks(fixture)
    claim_id = _open_and_populate(court, fixture)
    verdict = court.adjudicate(claim_id)

    dossier = json.loads(captured["prompt"].split("DOSSIER:\n", 1)[1])
    assert dossier["evidence_strength"]["buyer"] == "strong"
    assert dossier["evidence_strength"]["seller"] == "strong"
    assert verdict == "SPLIT"

    # 50/50 escrow split.
    half = fixture["claim"]["amount_cents"] // 2
    assert int(court.get_balance(Address(fixture["buyer"]))) == half
    assert int(court.get_balance(Address(SELLER))) == fixture["claim"]["amount_cents"] - half


def test_json_verdict_schema_enforced(court):
    """A judge response missing required keys or returning an invalid
    verdict must be rejected rather than silently stored."""
    fixture = FIXTURE_01_TRANSIT
    gl.nondet.web._hook = lambda url: (
        fixture["tracking_payload"] if "tracking" in url else LISTING_PAYLOAD
    )
    gl.nondet._llm_hook = lambda prompt: json.dumps({"verdict": "MAYBE", "rationale": "??"})

    claim_id = _open_and_populate(court, fixture)
    with pytest.raises(Exception):
        court.adjudicate(claim_id)

    # Claim must remain OPEN, not silently marked settled with a bad verdict.
    assert court.get_claim(claim_id)["status"] == "OPEN"


def test_no_hardcoded_buyer_verdict_outside_mocks():
    """Guard against the failure mode called out in the brief: a hardcoded
    BUYER verdict anywhere in the adjudication path outside of test mocks."""
    import inspect
    import parcel_court

    source = inspect.getsource(parcel_court)
    # The only literal 'verdict = "BUYER"' or similar should not exist —
    # verdicts must always come from _parse_judgment(judge output).
    assert 'verdict"] = "BUYER"' not in source
    assert "return \"BUYER\"" not in source
