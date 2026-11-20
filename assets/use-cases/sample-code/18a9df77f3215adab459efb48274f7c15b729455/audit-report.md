# Operating-journey source audit

Public repository: `hermodlabs/sample_code`  
Commit: `18a9df77f3215adab459efb48274f7c15b729455` (`refactor shared code`)  
Tree: `7dd65bd991fd8dbc17721bc2480505965bb2877d`  
Public commit time: `2026-11-18T23:36:10Z`

## Verified source boundary

`public-commit.json` and the complete, non-truncated `public-tree.json` were retrieved through the GitHub connector. Every public blob was checked against the read-only local sample-code working files using its byte length and Git blob SHA before copying exact UTF-8 bytes. The retained manifest additionally records SHA-256 for each file. All 150 public files match, totaling 6,341,941 bytes, with zero mismatches.

| Public directory | Matching files |
| --- | ---: |
| `shipping/shipment-exceptions` | 39 |
| `shipping/shipment-reservation-desk` | 22 |
| `gifting/gift-kit-preflight` | 47 |
| `gifting/gift-kit-handoff-desk` | 38 |
| `shared` | 2 |
| Domain README files | 2 |

The local sibling Git HEAD is separately recorded as `0786a65896c96da8285bfa784dfb9d7947be808e`. It is not represented as the public source revision. No sibling files were changed. No previous snapshot was replaced.

Retained files use `source/{public-relative-path}.txt`. `manifest.json` retains the existing `public-sample-code-source/1` schema. `source-audit.json` gives the machine-readable result. `scripts/audit-operating-journey-sources.mjs` reproduces these checks and refuses to overwrite a different retained source file. This audit verifies source identity, not runtime execution, real operating events, external authenticity, or screenshot provenance. Runtime agents verify those demonstration behaviors separately.

## Shared integration and authored-rule identity

`shared/reviewJourney.js` and all four clients' `src/reviewJourney.js` copies have identical bytes: Git blob `7d95bd5b59a76e0aea42497e5bd9949ad7b5738b`, SHA-256 `07d24b49b5858eb9235cc78f41db2236d310835aefedffd507595791c5dea3cb`.

The adapter wraps public SDK workflow operations. It does not implement an additional evaluator or saved-case format. The durable artifact is the native `decision-lab-workflow-run/1`; the authored app evaluates plans and the authored workflow expresses operating conclusions.

Shipping CLI and React configurations pin the same `shipment-exception-response` app: package hash `7d9b4d46f3df0743f239016d26e40003560b1f7c07ee96c497e7c02c964df001`, operating workflow hash `ff2ca5a32b41b6d7e566f248cabfbcb8ffbc3345b6097dc58e28265e0fa0689e`. This is the new cost-first profile, not a rewrite of the archived arrival-first teaching release.

Gifting CLI and React configurations pin the same `review-gift-kit-resolution-planning` app: package hash `7faaa1bbec4110583bdbfc6db82025860de042af743db0fcfee595aec72986e1`, workflow hash `5ab83d583a10f282f616d3021535902aa04ed7e96b2bbb686250d89c39357eef`. This is the new `gifting-resolution` version `3.0.0` profile; older version 2 teaching artifacts remain present.

## Useful exact public source ranges

All paths and ranges below refer to the pinned public commit. These are reading/snippet candidates, not invented replacement code. Prefer a few contiguous SDK/CLI lines to whole functions in articles.

### Common workflow and operating record

| Point | Public source |
| --- | --- |
| Start the native workflow retaining original case, sources and provisional screen | [`shared/reviewJourney.js:73–85`](https://github.com/hermodlabs/sample_code/blob/18a9df77f3215adab459efb48274f7c15b729455/shared/reviewJourney.js#L73-L85) |
| Verify expected workflow, original case identity, app pin and screening basis on open | [`shared/reviewJourney.js:88–118`](https://github.com/hermodlabs/sample_code/blob/18a9df77f3215adab459efb48274f7c15b729455/shared/reviewJourney.js#L88-L118) |
| Changed supplied answer awaits review; SDK stales dependencies | [`shared/reviewJourney.js:124–133`](https://github.com/hermodlabs/sample_code/blob/18a9df77f3215adab459efb48274f7c15b729455/shared/reviewJourney.js#L124-L133), direct call at 130–131 |
| Explicit named input review | [`shared/reviewJourney.js:137–147`](https://github.com/hermodlabs/sample_code/blob/18a9df77f3215adab459efb48274f7c15b729455/shared/reviewJourney.js#L137-L147), direct call at 143–145 |
| Prepare/evaluate without replacing an unchanged current finding | [`shared/reviewJourney.js:150–158`](https://github.com/hermodlabs/sample_code/blob/18a9df77f3215adab459efb48274f7c15b729455/shared/reviewJourney.js#L150-L158) |
| Review the exact current evaluation separately | [`shared/reviewJourney.js:161–167`](https://github.com/hermodlabs/sample_code/blob/18a9df77f3215adab459efb48274f7c15b729455/shared/reviewJourney.js#L161-L167) |
| Choose an exact complete feasible plan on the accepted assessment | [`shared/reviewJourney.js:195–216`](https://github.com/hermodlabs/sample_code/blob/18a9df77f3215adab459efb48274f7c15b729455/shared/reviewJourney.js#L195-L216), native commitment questions at 200–202 |
| External assertion linked to current selected assessment, with reference conflict checks | [`shared/reviewJourney.js:219–243`](https://github.com/hermodlabs/sample_code/blob/18a9df77f3215adab459efb48274f7c15b729455/shared/reviewJourney.js#L219-L243) |
| Native JSON save with expected-hash conflict boundary | [`shared/reviewJourney.js:246–256`](https://github.com/hermodlabs/sample_code/blob/18a9df77f3215adab459efb48274f7c15b729455/shared/reviewJourney.js#L246-L256) |

### Shipping CLI and React

| Point | Public file and exact range |
| --- | --- |
| CLI validation, calculation and comparison | `shipping/shipment-exceptions/src/batch.mjs:218–234` |
| Export a native continuation with pending inputs and screening receipt | `shipping/shipment-exceptions/src/batch.mjs:251–261` |
| Continue without needlessly replacing a current finding | `shipping/shipment-exceptions/continue-review.mjs:43–48` |
| App/workflow pin opening and native start | `shipping/shipment-reservation-desk/src/useShipmentReview.js:43–49` |
| Browser SDK workflow calculation | `shipping/shipment-reservation-desk/src/useShipmentReview.js:122–134` |
| Import a native continuation | `shipping/shipment-reservation-desk/src/useShipmentReview.js:136–142` |
| Public `compareFindings` | `shipping/shipment-reservation-desk/src/useShipmentReview.js:150` |
| Shared `DecisionView` for current/earlier reports | `shipping/shipment-reservation-desk/src/App.jsx:397–401` |
| Native operating gate and readable qualification | `shipping/shipment-exceptions/app/shipment.workflow.json:2579` (`actual-shipment`), `7610` (meaning) |
| Source assertions covering future delivery, actual delivery, revised promise and latest negative record | `shipping/shipment-exceptions/test/journey.test.mjs:59–91`, `94–140` |

### Gifting CLI and React

| Point | Public file and exact range |
| --- | --- |
| Derive conservative screening inputs from actual current business snapshot, verify module, run pinned app | `gifting/gift-kit-preflight/src/journeyPreflight.mjs:63–77` |
| Create continuing workflow with actual case source receipt | `gifting/gift-kit-preflight/src/journeyPreflight.mjs:81–83` |
| Explicit input review, CLI evaluation and opted-in synthetic finding review | `gifting/gift-kit-preflight/src/journeyPreflight.mjs:103–118` |
| Retain continuation and clearly qualify the unreviewed screen | `gifting/gift-kit-preflight/src/journeyPreflight.mjs:121–135` |
| CLI next executable workflow step and public finding comparison | `gifting/gift-kit-preflight/continue-review.mjs:57–63` |
| Browser executor/SDK and portable app/workflow pins | `gifting/gift-kit-handoff-desk/src/useGiftJourney.js:37`, `43–52` |
| Public comparison of prior/current runs | `gifting/gift-kit-handoff-desk/src/useGiftJourney.js:119–120` |
| Shared `DecisionView`, exact choice, original completion and retained history | `gifting/gift-kit-handoff-desk/src/App.jsx:162–172` |
| Scope-preserving answer mapping and schedule-only latest-start meaning | `gifting/gift-kit-preflight/src/giftingJourney.js:23–28`, `49–60` |
| Authored completion meaning and actual gate | `gifting/gift-kit-preflight/data/journey-v3/workflow.definition.json:11169–11181` |
| Six exact reviewed findings and separate actual correction/rehearsal/handoff chain | `gifting/gift-kit-handoff-desk/test/journey.test.js:35–84` |
| Source assertions for wrong/late/failed records and replacement chains | `gifting/gift-kit-handoff-desk/test/journey.test.js:87–100`, `169–193` |

## Business findings that must stay distinct

Shipping is cost first, then earlier arrival among complete qualifying arrangements. The ample baseline prefers Direct at $4,000 over Consolidated at $5,000. Assessing at 11:30 a.m. closes Direct's 11 a.m. carrier cutoff; Consolidated can remain supported until its noon cutoff. Morning SHIP-105 has insufficient Direct capacity and an old-revision Consolidated slot. SHIP-106 has old-revision permissions. SHIP-107 has an unsupported EUR quote, which is an input error rather than a complete blocked assessment. A planned follow-up never creates an actual replacement confirmation.

The six gifting reviewed findings are documented in the README and test assertions (runtime verification is separate):

| Campaign | Reviewed finding under new profile |
| --- | --- |
| GIFT-320 | Ample full-day window: in-house complete correction, $300, ready minute 40 |
| GIFT-321 | Start minute 1,410: external complete correction, $400, ready minute 1,435; in-house would finish 1,450 |
| GIFT-322 | Urgent window, external booking missing: no declared complete package fits |
| GIFT-323 | Urgent window, booking names previous insert revision: no declared complete package fits |
| GIFT-324 | Actual accepted diagnostic reports establish inserts-only correction: $100, ready minute 1,435 |
| GIFT-325 | Start minute 1,420: no declared package meets original minute 1,440 cutoff |

The initial conservative gifting screen retains all eight declared fault combinations and is unreviewed. Accepted native evidence can reduce that basis; a favorable quote cannot. Ordinary screening does not silently accept input or analytical findings. Synthetic acceptance is restricted to an explicitly opted-in fictional demo. The source's scheduled latest start of minute 1,415 for GIFT-321 is a duration-only bound, not a guarantee of vendor response, authority or capacity until then.

## Editorial and capture guardrails

- Keep screening, analytical finding acceptance, operating choice, spending authority and actual completion separate. A complete blocked finding can be accepted as a finding, but cannot become a selected feasible response.
- Retain actual source scope, including order or insert revision. Matching a record to a changed case by relabeling would manufacture evidence.
- The original case promise is retained separately. A revised deadline, quantity or recipient can support a revised proposal without fulfilling the original commitment.
- Assessment time is a business input. Event recording time does not move that clock. Before action, a changed premise needs reassessment; after work starts, retain the historical decision basis and record actual progress rather than automatically booking or correcting again.
- The latest supplied whole operating record of each kind for the selected assessment and plan determines current support. Later negative or wrong-scope replacements do not revive historical positives. History remains retained. Partial deliveries, concurrent grants or competing assertions need an authored reconciliation model.
- Gifting post-correction rehearsal refers to actual corrected output and remains separate from the original diagnostic reports. A planned ten-minute rehearsal is not proof it occurred or passed; the actual closure gate checks the declared duration and linked chain.
- `currentOperations` means linked to the current selected assessment and plan, not proven fact. Recording a reference authenticates neither the source nor the person and performs no booking, authorization, correction, test or delivery.
- Save/export retains a native continuation; localStorage with expected-hash checks is a demonstration persistence boundary, not a multi-user database or authenticated operational integration.
- Cases stipulate independently allocated resources. Separate passing cases do not establish shared dock, vendor, worker or cash capacity across the portfolio.
- No probabilities, entropy, economic value of learning, sequential study-policy comparison or unlisted recovery plans are inferred by these clients.
- Source test assertions were inspected for this report, not represented as newly executed checks. Current runtime and screenshot proofs belong in separate capture verification metadata.
