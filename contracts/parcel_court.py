# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

# ParcelCourt — inbound-condition adjudication contract.
#
# One job: given a claim (order/sku/amount + tracking + listing) and the
# evidence rows submitted by seller/buyer/carrier/warehouse, produce exactly
# one verdict in {TRANSIT, SELLER, BUYER, SPLIT, INSUFFICIENT}, a short
# rationale, and settle mock escrow accordingly. See rubric.md for the
# criteria the judge is instructed to apply.
#
# Non-determinism (web fetches, LLM judgment) is only ever used inside
# gl.eq_principle.* calls so validators reach consensus on the SAME reduced
# fact, never on raw HTML or a free-form LLM string.
#
# Runner pin: py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng
# — reverted back to this after py-genlayer:1jb45aa8... (the hash every
# current docs.genlayer.com @allow_storage example uses) turned out not to
# be a runner this deployment can even load ("invalid_contract runner
# malformed", no runner-load event in the genvm log at all — that hash just
# isn't available here). Back on the pin that's actually loadable.
#
# Claim/EvidenceRow below are plain @dataclass, decorated with
# @gl.storage.allow — NOT @allow_storage. Confirmed via genlayer-py's own
# v0.2->v0.3 SDK migration notes (PR #96 on genlayerlabs/genlayer-py, which
# migrates fixtures from GenVM v0.2.x idiom to v0.3, the same version this
# runner reports): "@allow_storage -> @gl.storage.allow" is listed
# explicitly alongside "gl.DynArray/TreeMap -> gl.storage.*", matching this
# file's existing gl.storage.TreeMap/DynArray usage. The GenVM error's own
# wording ("please annotate it with @allow") matches too. This is the first
# of these storage-decorator fixes based on a documented source rather than
# inferred from a traceback.

import json
from dataclasses import dataclass

import genlayer as gl
from genlayer.types import *

RUBRIC_ID = "v1"

VALID_ROLES = {"seller", "buyer", "carrier", "warehouse"}
VALID_VERDICTS = {"TRANSIT", "SELLER", "BUYER", "SPLIT", "INSUFFICIENT"}

STATUS_OPEN = "OPEN"
STATUS_ADJUDICATED = "ADJUDICATED"
STATUS_SETTLED = "SETTLED"

MIN_MEANINGFUL_CLAIM_CENTS = 2500  # $25.00 — below this, defaults skew buyer-favorable

JUDGE_TASK = (
    "You are ParcelCourt rubric v1. Choose exactly one of TRANSIT, SELLER, "
    "BUYER, SPLIT, INSUFFICIENT. Then write <=800 characters of rationale "
    "citing evidence. Return ONLY compact JSON: "
    '{"verdict":"...","rationale":"...","cited":["..."]}'
)

JUDGE_CRITERIA = (
    "Follow rubric v1 defaults. Orphan stills are weak. Weight mismatches "
    "of >25% without unbox video favor BUYER (empty/swap). Carrier "
    "exception + matching weights + label-in-frame unbox favor TRANSIT. "
    "Label-text artifacts / geometry inconsistent with listing + no video "
    "favor BUYER fabricated. Never invent scans that were not fetched. "
    "Claims under 2500 cents with no strong evidence from either side "
    "default INSUFFICIENT, buyer-favorable. An isolated JPEG from either "
    "side is never dispositive alone."
)


def _stable_extract_tracking(raw_json: dict) -> dict:
    """Reduce a tracking API payload to the only facts that matter for
    adjudication. Keeping this narrow is what makes strict_eq() converge:
    validators only need to agree on {status, last_scan_city, last_scan_date},
    not on the full, volatile payload (timestamps to the second, ad copy,
    tracking-page markup, etc.)."""
    return {
        "status": str(raw_json.get("status", "unknown")).lower(),
        "last_scan_city": raw_json.get("last_scan_city", ""),
        "last_scan_date": raw_json.get("last_scan_date", ""),
        "exception": bool(raw_json.get("exception", False)),
    }


def _stable_extract_listing(raw_json: dict) -> dict:
    """Same idea for the listing page: title + image URLs only."""
    images = raw_json.get("image_urls", []) or []
    return {
        "title": raw_json.get("title", ""),
        "image_urls": sorted(images),
    }


@gl.storage.allow
@dataclass
class Claim:
    order_id: str
    sku: str
    amount_cents: u256
    buyer: Address
    seller: Address
    tracking_url: str
    listing_url: str
    status: str
    verdict: str
    rationale: str


@gl.storage.allow
@dataclass
class EvidenceRow:
    role: str
    uri: str
    sha256: str
    note: str
    weight_g: u256
    submitted_by: Address


def _row_to_dict(r: EvidenceRow) -> dict:
    """Storage dataclasses aren't JSON-serializable on their own (nor can a
    view method hand one back over RPC unchanged) — this is the one place
    that turns an EvidenceRow into a plain dict, for the dossier and for
    views."""
    return {
        "role": r.role,
        "uri": r.uri,
        "sha256": r.sha256,
        "note": r.note,
        "weight_g": int(r.weight_g),
        "submitted_by": str(r.submitted_by),
    }


def _claim_to_dict(claim_id: int, c: Claim) -> dict:
    return {
        "id": claim_id,
        "order_id": c.order_id,
        "sku": c.sku,
        "amount_cents": int(c.amount_cents),
        "buyer": str(c.buyer),
        "seller": str(c.seller),
        "tracking_url": c.tracking_url,
        "listing_url": c.listing_url,
        "status": c.status,
        "verdict": c.verdict,
        "rationale": c.rationale,
    }


class ParcelCourt(gl.contract.Contract):
    claims: gl.storage.TreeMap[u256, Claim]
    evidence: gl.storage.TreeMap[u256, gl.storage.DynArray[EvidenceRow]]
    balances: gl.storage.TreeMap[Address, u256]
    next_claim_id: u256
    rubric_id: str

    def __init__(self):
        self.next_claim_id = u256(1)
        self.rubric_id = RUBRIC_ID

    # ---------------------------------------------------------------- #
    # Writes
    # ---------------------------------------------------------------- #

    @gl.public.write
    def open_claim(
        self,
        order_id: str,
        sku: str,
        amount_cents: u256,
        seller: Address,
        tracking_url: str,
        listing_url: str,
    ) -> u256:
        if amount_cents <= 0:
            raise gl.vm.UserError("amount_cents must be positive")

        claim_id = self.next_claim_id
        self.next_claim_id = u256(int(self.next_claim_id) + 1)

        self.claims[claim_id] = Claim(
            order_id=order_id,
            sku=sku,
            amount_cents=amount_cents,
            buyer=gl.message.sender_address,
            seller=seller,
            tracking_url=tracking_url,
            listing_url=listing_url,
            status=STATUS_OPEN,
            verdict="",
            rationale="",
        )
        self.evidence[claim_id] = []
        return claim_id

    @gl.public.write
    def submit_evidence(
        self,
        claim_id: u256,
        role: str,
        uri: str,
        sha256: str,
        note: str,
        weight_g: u256,
    ) -> None:
        if claim_id not in self.claims:
            raise gl.vm.UserError(f"unknown claim {claim_id}")
        if role not in VALID_ROLES:
            raise gl.vm.UserError(f"unknown role '{role}', expected one of {sorted(VALID_ROLES)}")
        claim = self.claims[claim_id]
        if claim.status != STATUS_OPEN:
            raise gl.vm.UserError("cannot submit evidence after adjudication")

        row = EvidenceRow(
            role=role,
            uri=uri,
            sha256=sha256,
            note=note,
            weight_g=weight_g,
            submitted_by=gl.message.sender_address,
        )
        rows = list(self.evidence[claim_id])
        rows.append(row)
        self.evidence[claim_id] = rows

    @gl.public.write
    def adjudicate(self, claim_id: u256) -> str:
        if claim_id not in self.claims:
            raise gl.vm.UserError(f"unknown claim {claim_id}")
        claim = self.claims[claim_id]
        if claim.status != STATUS_OPEN:
            raise gl.vm.UserError(f"claim {claim_id} already adjudicated")

        rows = list(self.evidence[claim_id])

        # 1. Tracking fact, fetched + reduced under strict equivalence.
        tracking_fact = {}
        if claim.tracking_url:
            def fetch_tracking():
                raw = gl.nondet.web.render(claim.tracking_url, mode="text")
                parsed = json.loads(raw)
                return _stable_extract_tracking(parsed)

            tracking_fact = gl.eq_principle.strict_eq(fetch_tracking)

        # 2. Listing fact, same treatment.
        listing_fact = {}
        if claim.listing_url:
            def fetch_listing():
                raw = gl.nondet.web.render(claim.listing_url, mode="text")
                parsed = json.loads(raw)
                return _stable_extract_listing(parsed)

            listing_fact = gl.eq_principle.strict_eq(fetch_listing)

        # 3. Compact, sorted-key dossier — this is the ONLY thing the judge sees.
        dossier = self._build_dossier(claim, rows, tracking_fact, listing_fact)
        dossier_json = json.dumps(dossier, sort_keys=True)

        # 4. Judgment under non-comparative equivalence.
        def judge():
            return self._call_judge(dossier_json)

        result = gl.eq_principle.prompt_non_comparative(
            judge,
            task=JUDGE_TASK,
            criteria=JUDGE_CRITERIA,
        )

        verdict, rationale = self._parse_judgment(result)

        claim.verdict = verdict
        claim.rationale = rationale
        claim.status = STATUS_ADJUDICATED
        self.claims[claim_id] = claim

        self._release(claim_id)
        return verdict

    def _release(self, claim_id: u256) -> None:
        claim = self.claims[claim_id]
        amount = int(claim.amount_cents)
        verdict = claim.verdict
        buyer = claim.buyer
        seller = claim.seller

        if verdict in ("TRANSIT", "SELLER"):
            self._credit(buyer, amount)
        elif verdict == "BUYER":
            self._credit(seller, amount)
        elif verdict == "SPLIT":
            half = amount // 2
            self._credit(buyer, half)
            self._credit(seller, amount - half)
        elif verdict == "INSUFFICIENT":
            # rubric.md defaults: sub-$25 claims skew buyer-favorable;
            # everything else is a 50/50 split, since neither side cleared
            # the evidentiary bar.
            if amount < MIN_MEANINGFUL_CLAIM_CENTS:
                self._credit(buyer, amount)
            else:
                half = amount // 2
                self._credit(buyer, half)
                self._credit(seller, amount - half)
        else:
            raise Exception(f"unrecognized verdict '{verdict}', refusing to release escrow")

        claim.status = STATUS_SETTLED
        self.claims[claim_id] = claim

    def _credit(self, who: Address, amount_cents: int) -> None:
        current = int(self.balances.get(who, u256(0)))
        self.balances[who] = u256(current + amount_cents)

    # ---------------------------------------------------------------- #
    # Internal helpers (not part of the public ABI)
    # ---------------------------------------------------------------- #

    def _build_dossier(self, claim, rows, tracking_fact, listing_fact) -> dict:
        seller_rows = [r for r in rows if r.role == "seller"]
        buyer_rows = [r for r in rows if r.role == "buyer"]
        carrier_rows = [r for r in rows if r.role == "carrier"]
        warehouse_rows = [r for r in rows if r.role == "warehouse"]

        seller_weight = next((int(r.weight_g) for r in seller_rows if int(r.weight_g) > 0), None)
        buyer_weight = next((int(r.weight_g) for r in buyer_rows if int(r.weight_g) > 0), None)

        def strength(role_rows, role):
            """Coarse strength tag surfaced to the judge and asserted on in
            tests — the judge still forms its own view from the raw rows,
            this is a hint, not a ruling."""
            if role == "seller":
                has_weight = any(int(r.weight_g) > 0 for r in role_rows)
                has_video = any("video" in r.uri.lower() or "video" in r.note.lower() for r in role_rows)
                return "strong" if (has_weight and has_video) else ("weak" if role_rows else "absent")
            if role == "buyer":
                has_video = any("video" in r.uri.lower() or "video" in r.note.lower() for r in role_rows)
                orphan_still = len(role_rows) == 1 and not has_video
                return "weak" if orphan_still or not has_video else "strong"
            if role == "carrier":
                return "strong" if tracking_fact.get("exception") else "absent"
            return "n/a"

        weight_delta_pct = None
        if seller_weight and buyer_weight:
            weight_delta_pct = round(100 * (seller_weight - buyer_weight) / seller_weight, 1)

        return {
            "amount_cents": int(claim.amount_cents),
            "buyer_evidence": [_row_to_dict(r) for r in buyer_rows],
            "carrier_tracking_fact": tracking_fact,
            "evidence_strength": {
                "buyer": strength(buyer_rows, "buyer"),
                "carrier": strength(carrier_rows, "carrier"),
                "seller": strength(seller_rows, "seller"),
            },
            "listing_fact": listing_fact,
            "rubric_id": self.rubric_id,
            "seller_evidence": [_row_to_dict(r) for r in seller_rows],
            "warehouse_evidence": [_row_to_dict(r) for r in warehouse_rows],
            "weight_delta_pct_seller_to_buyer": weight_delta_pct,
        }

    def _call_judge(self, dossier_json: str) -> str:
        prompt = (
            f"{JUDGE_TASK}\n\nCRITERIA: {JUDGE_CRITERIA}\n\nDOSSIER:\n{dossier_json}"
        )
        return gl.nondet.exec_prompt(prompt)

    def _parse_judgment(self, raw_result: str) -> tuple[str, str]:
        text = raw_result.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:]
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            raise Exception(f"judge did not return valid JSON: {exc}") from exc

        verdict = parsed.get("verdict", "")
        rationale = parsed.get("rationale", "")
        if verdict not in VALID_VERDICTS:
            raise Exception(f"judge returned invalid verdict '{verdict}'")
        if len(rationale) > 800:
            rationale = rationale[:797] + "..."
        return verdict, rationale

    # ---------------------------------------------------------------- #
    # Views
    # ---------------------------------------------------------------- #

    @gl.public.view
    def get_claim(self, claim_id: u256) -> dict:
        if claim_id not in self.claims:
            raise gl.vm.UserError(f"unknown claim {claim_id}")
        return _claim_to_dict(int(claim_id), self.claims[claim_id])

    @gl.public.view
    def list_claims(self) -> list[dict]:
        return [_claim_to_dict(int(claim_id), claim) for claim_id, claim in self.claims.items()]

    @gl.public.view
    def get_evidence(self, claim_id: u256) -> list[dict]:
        if claim_id not in self.evidence:
            raise gl.vm.UserError(f"unknown claim {claim_id}")
        return [_row_to_dict(r) for r in self.evidence[claim_id]]

    @gl.public.view
    def get_rubric(self) -> dict:
        return {
            "rubric_id": self.rubric_id,
            "min_meaningful_claim_cents": MIN_MEANINGFUL_CLAIM_CENTS,
            "verdicts": sorted(VALID_VERDICTS),
        }

    @gl.public.view
    def get_balance(self, who: Address) -> u256:
        return self.balances.get(who, u256(0))
