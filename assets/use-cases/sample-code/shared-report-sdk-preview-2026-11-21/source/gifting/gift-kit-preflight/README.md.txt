# Gift-kit intervention queue

A Node.js CLI integration that screens independent QR gift-kit campaigns, calculates their current supported responses and exports a **portable native workflow** for the [Gift-kit Handoff Desk](../gift-kit-handoff-desk/README.md).

The target is an on-time usable kit handoff, or an explicit escalation. A preferred correction is an intermediate finding. The script does not order replacement kits, obtain authority, test checkout or perform the handoff.

## Run

Use Node.js 22.19 or later; Node.js 24 is recommended. This standalone project uses matching public SDK, CLI and React-view packages; local Decision Lab workspace packages also resolve without publishing.

```sh
node review-journeys.mjs \
  --input fixtures/journey-v3/campaigns.json \
  --output .output/queue-1

npm run demo -- --output .output/demo-1
npm test
```

Output directories must be fresh. The default **calculation workflow 4.0.0** uses the existing version-3 cost-first evidence/planning app packages, frozen source mappings and worked cases. Supplied records can be calculated directly; no name or analytical acceptance is manufactured. The older reviewed version remains archived and supported for its explicit review process. `--reviewer` and `--accept-fictional-demo` apply only to those retained reviewed definitions.

## Why campaigns need different responses

Each fictional campaign has separately allocated resources. Independently passing cases do not establish that a shared production team can execute them together.

| Campaign | Meaningful difference | Current calculated result |
| --- | --- | --- |
| GIFT-320 | Ample one-day window | Complete in-house correction, $300; ready at minute 40 |
| GIFT-321 | Current time 1,410; cutoff 1,440 | External correction, $400; ready at 1,435; in-house finishes at 1,450 |
| GIFT-322 | Same urgency; external booking missing | No complete declared package fits |
| GIFT-323 | Booking names the previous insert revision | No complete declared package fits |
| GIFT-324 | Actual artwork and checkout reports narrow the faults | Replace printed inserts, $100; ready at 1,435 |
| GIFT-325 | Current time 1,420 | No declared package protects the original cutoff; escalate or revise the promise |

A conservative first screen retains all eight fault combinations and source receipts. The connected **evidence assessment** uses actual scoped diagnostic records to determine what correction must cover. Only those findings can justify the smaller $100 response; an attractive quote cannot remove a fault possibility.

The rules check quantity, correction coverage, availability, budget, permission, booking and cutoff together. Among feasible complete packages they prefer lower expense, then earlier handoff. Ten planned rehearsal minutes remain subject to the published five-minute minimum and do not establish that a test passed. Time positions are whole elapsed minutes from the configured origin.

## Public CLI path

[`src/journeyPreflight.mjs`](src/journeyPreflight.mjs) derives the conservative screen from the current business snapshot using the public composition mapping. It verifies the generated module against the pinned app, calls `run --reports all`, and retains the source receipt and native screen. It then solves the connected workflow through the installed CLI handler:

```js
await command([
  'workflow', 'solve', '--run', currentPath,
  '--created-at', at, '--timeout-ms', '30000',
]);
```

The wrapper's `command` function calls `runCLI` and retains arguments, output and exit code. The CLI orders dependencies and retains current native evaluations. The application owns ingestion, sequencing, the exception queue and file handoff; it does not implement evidence interpretation or rank packages.

The queue uses **current native planning results**, not a provisional screen presented as a final recommendation. Its latest-useful-start value is only a schedule bound from complete retained durations. For GIFT-321 that bound is minute 1,415; it does not guarantee supplier availability or spending authority until then.

## Continue the same case

```text
.output/queue-1/
  campaigns.html
  manifest.json
  commands.json
  GIFT-321/
    screening.case.json
    screening.run.json
    review.workflow.json       Open this in the React desk
    output.json
    planning.run.json
```

The workflow retains its exact definition/app pins, original promise, source receipts, applied answers, native evaluations, operations and history. React opens those same records; it does not reconstruct or silently approve them.

```sh
node continue-review.mjs \
  --review .output/queue-1/GIFT-321/review.workflow.json \
  --as-of 2026-11-18T23:36:00.000Z \
  --output .output/recalculated-1
```

Changing time explicitly invalidates dependent findings and recalculates the chain. The current operating choice, external authorization and actual completion remain separate records. `--choose` names an exact feasible arrangement with an identified recorder; operating records require original sourced values. The code keeps scope and original promises intact.

A `workflow solve` unavailable exit is retained with its native output: an incomplete assessment must not be conflated with proof that no arrangement is feasible. A complete blocked assessment is an ordinary business finding. Malformed imports receive diagnostics separately from ordinary blocked business findings.

The shared [`src/reviewJourney.js`](src/reviewJourney.js) adapter uses public workflow operations and an exact-definition whitelist. Historical reviewed definitions remain reviewed; the calculation release is a new definition rather than hidden acceptance buttons. [`src/giftingJourney.js`](src/giftingJourney.js) selects current SDK findings without re-evaluating business rules.

## Verification and limits

Tests check real CLI/SDK findings, the $100 evidence-supported correction, current-record mapping rather than stale same-ID fixtures, changed timing, backdating rejection and exact native handoff. The React browser test can import a generated file using `GIFT_PREFLIGHT_REVIEW`.

No ERP connector, shared-resource portfolio optimizer, source authentication or external production integration is supplied. Operating authority, actual correction, fresh rehearsal and a linked kit handoff must be recorded separately. Later failed tests supersede earlier positives. Revised scope or cutoff does not establish fulfillment of the original promise.
