# Shipment exception queue

A Node integration around the public Decision Lab CLI. It screens company exports,
compares retained findings, and produces a portable operating review for the exact
shipment a coordinator continues in the companion React desk.

The records are fictional. They extend the
[consolidated-freight teaching example](https://www.hermodlabs.com/use-cases/supply-chain/shipment-readiness/add-consolidated-freight/).
The real supplier account motivating that example is background, not the source
of these orders, prices, permissions or results.

## Run

Use Node.js 22.19 or later; Node.js 24 is recommended. In this repository:

```sh
npm run demo:shipment:cli
npm run test:cli-apps
```

Copied to another repository, this folder is a standalone npm project. Install
matching local package archives while the `0.1.0` packages remain release candidates:

```sh
npm install --no-save --package-lock=false \
  /absolute/path/decision-lab-sdk-0.1.0.tgz \
  /absolute/path/decision-lab-cli-0.1.0.tgz \
  /absolute/path/decision-lab-react-views-0.1.0.tgz
npm run demo
npm test
```

`npm run release:pack` in the Decision Lab repository produces those archives.
Once compatible packages are published, ordinary `npm install` resolves the
normal public dependencies in `package.json`.

## The operating problem

Maya owns an accepted delivery commitment. New order, quote or confirmation
records can invalidate the previous proposal. She needs to identify the blocker,
find the responsible person, and choose a supported response before its useful
booking window closes—or explicitly escalate the commitment.

The authored policy is **lowest complete expense among arrangements meeting every
mandatory requirement, then arrival**. Earlier arrival alone does not justify a
premium. In the ample-window example Direct costs $4,000 and meets Friday's
promise, so it is preferred to the $5,000 Consolidated offer. After Direct's
11 a.m. carrier cutoff, Consolidated remains available until noon if its scoped
support is current. The review does not invent an updated confirmation.

| Snapshot | Result |
| --- | --- |
| Baseline | Direct is the least expensive supported complete arrangement. |
| Morning SHIP-105 | Direct lacks capacity for the revision; Consolidated's slot covers the old revision. Obtain an actual replacement record or escalate. |
| Morning SHIP-106 | Permissions cover the old revision. No listed arrangement passes. |
| Morning SHIP-107 | EUR quote is unsupported; input correction is distinct from a blocked assessment. |
| Baseline assessed at 11:30 a.m. | Direct's cutoff passed; Consolidated is preferred while its own booking window remains open. |

The original arrival-first app remains unchanged under `app/archive/`. The new
`shipment-exception-response` release and its operating workflow are authored in
`examples/shipping/clients/`, then copied into both standalone clients. No
marketplace release is rewritten.

## Screen records at an explicit time

```sh
node review-shipments.mjs \
  --input fixtures/morning \
  --retained fixtures/retained/morning \
  --as-of 2026-11-17T08:00:00-06:00 \
  --output .output/morning
```

Use a fresh output directory. `--previous` accepts a prior batch manifest using
the same app release. `--as-of` advances the actual case assessment time and
selection readiness; it cannot predate the supplied snapshot. Without that
option, each order's explicit `current_at` is used. `--created-at` is artifact
metadata and does not advance the business clock.

Open `shipments.html`. Each shipment also retains `case.json`, validation,
`run.json`, source receipts, and `review.json`. The native workflow continuation
contains the full screening run, prior run when available, exact app and workflow
definitions, source basis, supplied inputs and the current calculated findings.
`decision-summary.json` retains the same authored operational answer displayed in
React. Calculation does not choose a response or grant operating authority.

The importer owns order, quote and slot fields only. CSVs are complete current
snapshots, not event patches; a missing slot removes the previous slot. Other
readiness, calendars, resources and permissions come from the retained case.
Quotes have their own identity, revision, original order scope, knowledge and
validity times, and carrier booking cutoff. A changed order does not rescope an
old grant. File receipts detect local changes; they do not authenticate sources.

## Continue the same case

Import a shipment's `review.json` in the React desk. Its current finding opens
without another acceptance sequence. Apply received records, Recalculate, and
inspect the Decision summary before separately recording a chosen response.
Download **Continuation** to return the same case and history to CLI:

```sh
node continue-review.mjs \
  --review /path/to/SHIP-105-review.json \
  --output .output/continued
```

Changed records and time make the earlier result stale. For example, calculate
an unbooked case at a later time:

```sh
node continue-review.mjs \
  --review /path/to/SHIP-104-review.json \
  --as-of 2026-11-17T11:30:00-06:00 \
  --output .output/later-review
```

The command uses public `workflow solve` when a new calculation is needed. It
runs relevant assessments in dependency order, then exposes the shared Decision
summary as data. Reopening a current finding preserves it; it does not discard a
recorded booking by calculating the same basis again. No reviewer name or
analytical acceptance is needed for the new calculation workflow.

Reviewed workflow version 1.0.0 remains frozen under `app/workflow-releases/1.0.0/`.
Retained files keep that definition and its explicit review behavior. The legacy
`--review-inputs --actor NAME` option applies only to those old runs; it never
creates acceptance records in calculation-mode version 2.0.0.

Operating history records an external authorization, reservation, delivery or
escalation separately. The authored workflow checks full scope, current selected
assessment, source references and actual times. A carrier reservation alone never
establishes delivery. Recorded assertions still require trustworthy company
integrations; this example does not authenticate people or external systems.

Authorization, reservation and delivery each use the **last supplied complete
record for that kind, selected assessment and plan**. A later cancellation,
negative finding or incorrectly scoped replacement removes support; the review
cannot fall back to an older positive. The earlier records stay in history. A
replacement booking also needs delivery evidence linked to its own reference.
This is a current-status register supplied by the integration, not automatic
reconciliation of out-of-order source messages.

The planner is a **pre-booking comparison**. An expired offer does not cancel an
already confirmed reservation. Existing bookings stay in history; continuing an
executed shipment requires reviewing that contractual basis rather than blindly
booking it again. The sample does not model every remaining execution activity.

## Files and boundaries

- `src/batch.mjs`: orchestration through the public CLI, snapshots and retained results.
- `src/inputs.mjs`: strict CSV/unit/scope conversion; no feasibility rules.
- `src/report.mjs`: readable shared table views from retained reports.
- `src/reviewJourney.js`: copied shared integration around native SDK workflows.
- `app/shipment-review.app.json`: immutable business rules.
- `app/shipment.workflow.json`: authored operating conclusions and closure checks.
- `continue-review.mjs`: continue a portable review without overwriting it with old CSVs.

SDK/CLI comparison preserves primary-key record changes, affected feasibility,
preference and blockers. The batch's status still distinguishes unavailable,
blocked and changed reviews. Exit `0` means calculations completed, including
no-feasible-plan findings; `2` means invalid input, `3` unavailable execution, and
`4` operational failure. Inspect retained successful shipments in a partial batch.

All shipments stipulate independently allocated resources. Independent passes do
not prove the same dock, truck or cash can serve every order together. Remediation
is supplied as reviewed options and actual records; no recovery plan is invented.
