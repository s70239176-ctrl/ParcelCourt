# ParcelCourt Rubric v1

ParcelCourt answers exactly one question per claim: **what condition was this
parcel in when it arrived, and who bears that?** It is not a general disputes
bot. It does not weigh in on taste, listing accuracy, or shipping speed.

## Verdicts

| Verdict | Meaning | Escrow effect |
|---|---|---|
| `TRANSIT` | Carrier caused the damage in transit. Seller packed and shipped correctly. | Pay buyer full `amount_cents` |
| `SELLER` | Seller shipped short, mispacked, or omitted required contents at origin. | Pay buyer full `amount_cents` |
| `BUYER` | Box arrived empty/swapped, evidence is staged, or claim is unsupported by weight/video. | Pay seller full `amount_cents` |
| `SPLIT` | Both sides complied with evidentiary requirements and the record still conflicts. | 50% buyer / 50% seller |
| `INSUFFICIENT` | Neither side posted evidence meeting the strong-evidence bar. | Apply defaults below |

## Evidence strength table

| Party | STRONG | WEAK |
|---|---|---|
| Seller | Pack-out weight (grams) **and** a pack-out video hash, taken before the label was applied | A photo only, or a claimed weight with no video hash |
| Carrier | A tracking exception event (`damaged`, `lost`, `exception`) fetched live from `tracking_url` | Silence — no exception on the tracking record |
| Buyer | Unboxing video hash that keeps the shipping label in frame for the full clip, with a stated inbound weight | A single still photo (an "orphan still"), especially one with no label, no video, and no stated weight |

An isolated JPEG — from either side — is **never dispositive alone**. It can
corroborate a verdict already supported by weight or video evidence; it
cannot carry a verdict by itself.

## Decision logic (what `adjudicate` asks the judge to apply)

1. **Weight mismatch.** If inbound weight is more than 25% below the seller's
   pack-out weight, and the buyer has not posted an unboxing video, that
   favors `BUYER` (empty box or partial swap) — the box was light and no one
   can show why on video.
2. **Carrier exception + matching weights.** If the tracking record shows a
   carrier exception (damage/loss noted by the carrier itself) and the
   buyer's inbound weight is consistent with the seller's pack-out weight,
   and the buyer's unboxing video shows the shipping label in frame, that
   favors `TRANSIT`. The parcel weighed what it should have; the carrier
   already flagged the problem.
3. **Fabrication signals.** Label text that is garbled, mismatched, or
   inconsistent with the listing/tracking data, combined with a single
   "perfect crack" or similarly staged-looking still and no video, favors
   `BUYER` on fabrication grounds — the image reads as constructed for the
   claim rather than incidental to it.
4. **Both strong, still conflicting.** If seller and buyer both cleared the
   STRONG bar (pack-out weight + video vs. unboxing video + weight) and the
   dossier still does not resolve cleanly to one party, return `SPLIT`.
5. **Never invent facts.** The judge only uses tracking/listing facts that
   were actually fetched via `gl.nondet.web.render` and reduced under
   `strict_eq`. It does not assume a scan exists because a claim mentions it.

## Defaults when evidence is thin (`INSUFFICIENT`)

- **Sub-$25 claims** (`amount_cents < 2500`): if neither side posted STRONG
  evidence, resolve buyer-favorable — treat as `INSUFFICIENT`, refund the
  buyer. Litigating a $12 claim to a standstill costs more than the claim.
- **No seller pack-out weight and no pack-out video hash**, and the claim is
  empty/missing-contents: lean `BUYER`-favorable is *not* applied here —
  absent seller evidence, the claim proceeds to judge on what exists, but
  the seller's lack of a paper trail is itself evidence against them.
- **Buyer posts only an orphan still**, seller has a clean pack-out record
  (weight + video) and weights are consistent: lean `SELLER`-clears /
  `BUYER`-fabricated per the fabrication-signal test above, not a bare
  guess — the judge still has to point at what in the dossier drove it.
- **An isolated JPEG never wins on its own**, from either side, at any claim
  size.

## What this rubric is not

Not a marketplace, not a chatbot, not a general-purpose escrow, not a
reputation system. One question, one dossier, one verdict, one settlement.
