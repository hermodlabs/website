# Gift-kit intervention queue

A Node.js integration for a team preparing QR gift kits. The CLI screens independent campaigns, identifies the next responsible action and exports a **continuing native workflow review** for the [Gift-kit Handoff Desk](../gift-kit-handoff-desk/README.md).

The useful result is an on-time, usable kit handoff, or an explicit escalation. A preferred correction package is one intermediate finding. The script does not order replacements, obtain authority, test checkout or hand over kits.

## Run

Use Node.js 22.19 or later; Node.js 24 is recommended. This is an independent npm project using public package exports. In the Decision Lab checkout, installed workspace packages resolve without publishing. When copying the folder, install matching `@decision-lab/sdk`, `@decision-lab/cli` and `@decision-lab/react-views` releases or the archives produced by `npm run release:pack`.

```sh
cd sample_code/gifting/gift-kit-preflight
npm install --no-save --package-lock=false \
  /absolute/path/to/decision-lab-sdk-0.1.0.tgz \
  /absolute/path/to/decision-lab-cli-0.1.0.tgz \
  /absolute/path/to/decision-lab-react-views-0.1.0.tgz

# Ordinary screening: no input or finding is silently accepted.
node review-journeys.mjs \
  --input fixtures/journey-v3/campaigns.json \
  --output .output/queue-1

# Explicit fictional demo, including synthetic input and finding reviews.
npm run demo -- --output .output/demo-1
npm test
```

Output directories must be new. Demo review judgments are restricted to manifests explicitly marked `fictional: true` and the `--accept-fictional-demo` option. That option is a test convenience, never a production approval mechanism. Ordinary execution retains pending questions for a person to review.

The pinned cost-first policy is a **new version 3 profile**. The older version 2 marketplace releases and one-hour/one-day teaching inputs remain unchanged. `review-campaigns.mjs` and its original fixtures remain compatibility examples; the primary tutorial uses `review-journeys.mjs`.

## Why these campaigns need different responses

All records, people and amounts are fictional. Each campaign has its own independently allocated production resource. Passing separately does not establish that one shared vendor or team can handle them together.

The policy first requires a complete package to satisfy the cutoff, quantity, correction coverage, resources, budget, permission and any required booking. Among qualifying packages it prefers lower expense, then earlier handoff. Finishing earlier alone does not justify paying a premium.

| Campaign | Meaningful difference | Reviewed result |
| --- | --- | --- |
| GIFT-320 | Ample one-day window | In-house complete correction, $300; ready at minute 40 |
| GIFT-321 | Review starts at minute 1,410; cutoff is 1,440 | External complete correction, $400; ready at 1,435. In-house would finish at 1,450 |
| GIFT-322 | Same urgent window; external booking missing | No declared complete package fits |
| GIFT-323 | Booking still names the previous insert revision | No declared complete package fits |
| GIFT-324 | Actual artwork and checkout reports establish that only printed inserts need correction | Replace inserts, $100; ready at 1,435 |
| GIFT-325 | Review starts at minute 1,420 | No declared package protects the original cutoff; escalate or revise the promise |

The native evidence app interprets the actual reports. The application does not remove fault possibilities because a quote looks attractive. The ordinary initial screen conservatively retains all eight declared fault combinations. Its result is visibly **unreviewed**. Accepted scoped evidence can justify a smaller correction in the continuing review.

The recorded ten-minute rehearsal is a planned duration, subject to the five-minute published minimum. It does not establish that the rehearsal happened or passed. All times are elapsed whole minutes from the configured origin, not working hours or calendar-day arithmetic.

## Inspect the integration

Start with [`src/journeyPreflight.mjs`](src/journeyPreflight.mjs). The wrapper uses the installed CLI's actual public command handler:

```js
import { runCLI } from '@decision-lab/cli';

await runCLI([
  'workflow', 'evaluate', '--run', currentRunFile, '--step', 'evidence',
  '--output', nextRunFile,
], { stdout, stderr });
```

It first derives conservative screening inputs from the **current business snapshot** through the portable template's public composition mapping, checks that the generated rule module matches the pinned app, and calls `run --reports all` using that pinned app. It never trusts a separately saved same-ID screening fixture: a changed quantity or quote must reach the calculation. It then creates a native workflow run retaining that screen and source receipts. When a person explicitly supplies `--reviewer NAME`, the shared adapter records the input reviews through public SDK workflow operations. Calculation and finding reviews use the CLI. A normal calculation stops at `awaiting-review`; the synthetic demo explicitly accepts its fictional findings to show the complete comparison.

[`src/reviewJourney.js`](src/reviewJourney.js) is shared integration code copied into all four shipping/gifting clients. It uses native workflow revisions, answers, evaluations and reviews. It is neither another workflow engine nor another business evaluator. [`src/giftingJourney.js`](src/giftingJourney.js) selects existing findings and formats the gifting-specific next action. The pinned portable definition contains the domain rules and actual-event closure gate.

The queue shows a schedule-only latest useful start from the SDK's retained activity durations. For GIFT-321 the external package needs 25 minutes, so the schedule bound is minute 1,415. This does not promise a vendor response, continued capacity or authority until then. Acquiring support and performing work have their own records.

## Continue the same case

```text
.output/queue-1/
  campaigns.html
  manifest.json
  commands.json
  GIFT-321/
    screening.case.json
    screening.run.json
    review.workflow.json       Import this into the React desk
    output.json
    planning.run.json          Present after planning has been evaluated
```

The workflow file retains its exact definition and app pins, original commitment, sources, provisional screening, reviewed answers, native evaluations and review history. Importing it into React preserves those records; it does not automatically accept them.

You can also continue headlessly:

```sh
# Explicitly review the imported answers and calculate evidence.
node continue-review.mjs \
  --review .output/queue-1/GIFT-321/review.workflow.json \
  --review-inputs --actor 'Campaign reviewer' \
  --output .output/evidence-1

# After inspecting the evidence, accept that finding and calculate planning.
node continue-review.mjs \
  --review .output/evidence-1/review.workflow.json \
  --accept-finding evidence --actor 'Campaign reviewer' \
  --output .output/planning-1

# After inspecting planning, accept it separately.
node continue-review.mjs \
  --review .output/planning-1/review.workflow.json \
  --accept-finding planning --actor 'Campaign reviewer' \
  --output .output/reviewed-1
```

Use the exact plan ID in `output.json` with `--choose PLAN_ID --actor NAME` to record the operating selection. That is distinct from accepting the analytical finding. Actual operating assertions use `--kind authorization|correction|rehearsal|handoff|escalation --record ORIGINAL_RECORD.json --recorded-at ISO_TIMESTAMP`. The JSON contains the original reference, source and domain fields; recording it neither authenticates the document nor performs the event.

The generic CLI remains available for direct `workflow answer`, `workflow review`, `workflow inspect` and `workflow brief` operations. The sample convenience script calculates the next executable step and stops for its finding review.

## Time and reassessment

```sh
node continue-review.mjs \
  --review .output/reviewed-1/review.workflow.json \
  --as-of 2026-11-18T23:36:00.000Z \
  --review-inputs --actor 'Campaign reviewer' \
  --output .output/time-advanced-1
```

This explicitly moves the pre-action review time to minute 1,416. It does not extend resource availability, permissions or a booking. Dependent findings become stale and must be recalculated and reviewed. At that time the 25-minute external package would miss minute 1,440.

Once work is underway, preserve the historical decision basis and record actual event/recording times separately. Advancing the planning clock is a new decision revision, rather than a method for recording completed production.

When two compatible planning runs exist, the continuation writes `changes.json` using `lab.reports.compareFindings({ before, after })`. SDK comparison preserves rule/case identity, completeness and ties. It can report unavailable; it never fabricates a recommendation change from an incomplete assessment.

## What closes the original commitment

The authored workflow gate requires all of these, tied to the current chosen planning run:

1. A recorded operating selection after the current planning finding was accepted.
2. A separate sourced spending authorization covering the recorded amount and original work scope.
3. Actual correction completion for that selected package, quantity and input scope, naming the corrected output revisions.
4. A successful fresh rehearsal covering that corrected configuration, linked to the correction record and allowing the declared duration.
5. A complete quantity-specific handoff linked to that rehearsal, with valid chronology and completion no later than the **original** cutoff.

The gate checks event times against their separately recorded times. An old-scope test, short rehearsal, future observation, missing authority or late handoff cannot close it. Extending the proposed cutoff or retargeting the campaign, device or intended account does not rewrite the original promise.

For each selected plan, the latest supplied complete record of each operating kind is authoritative. Later negative or wrong-scope records supersede older positives. A replacement correction requires current linked rehearsal and handoff records. Earlier assertions remain in history. This bounded contract does not aggregate partial deliveries or several parallel work records.

The application does not infer probabilities, compare sequential study policies, construct unlisted recovery packages or allocate resources across campaigns. Those would need explicitly authored models or additional capabilities.

## Maintain the authored inputs

Maintained source is [`examples/gifting/clients`](../../../examples/gifting/clients). The new `journey-v3/template.json`, author configuration and native workflow are portable. The author script only creates a new fictional immutable release; ordinary clients run the generated JSON without importing author code.

```sh
# At repository root:
node examples/gifting/clients/journey-v3/author.mjs --check
npm run generate:gifting:clients
npm run check:gifting:clients
```

No production article or external system is required to understand or run this example.
