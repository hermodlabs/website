# Gift-kit Handoff Desk

A focused React app for the person resolving one campaign flagged by [Gift-kit Preflight](../gift-kit-preflight/README.md). It continues the same native workflow from source records through a recorded kit handoff. Ordinary React hooks manage forms, cancellation, files and local persistence; the public SDK interprets evidence, evaluates packages, maintains review dependencies and renders reusable report data.

The business question is: **Which supported correction protects this handoff at the least expense, and what must actually happen before it is complete?**

## Run

Use Node.js 22.19 or later; Node.js 24 is recommended.

```sh
# Decision Lab checkout, with workspace packages installed:
npm run dev:gifting:react
npm run build:gifting:react
npm run test:gifting:react
npm run test:gifting:react:browser
```

This folder is a separate npm project. When copying it, install matching SDK/React views releases or local archives from `npm run release:pack`. The CLI is a development dependency for parity tests. Keep SDK optional dependencies enabled for the browser build. Serve the Vite build over HTTP; browser workers cannot run from `file://`.

## Follow one review

1. **Open continuing review** with the CLI's `GIFT-321/review.workflow.json`, or start a bundled fictional teaching case.
2. Inspect the current commitment and original source records. Enter your name and explicitly choose **Review current inputs**.
3. Calculate the evidence step. Inspect its result and explicitly accept that finding before planning can use it.
4. Calculate planning, compare the complete packages and accept the planning finding separately.
5. Choose one exact feasible plan as the operating decision.
6. Record actual external authorization, correction, rehearsal and handoff documents independently.
7. Save locally or download the native continuing review to retain the entire history.

Opening a review never accepts its inputs, findings or operating decision. Changed records lose their current recommendation until reassessed. Download and local save flush edited forms into pending native answers, preserving stale findings instead of silently exporting the previous inputs.

The new version 3 policy is cost-first among complete qualifying plans. With an ample window it selects $300 in-house work; at minute 1,410 only the $400 external package can finish by minute 1,440. Actual diagnostic records can establish that a $100 insert replacement is sufficient. Missing or old-scope booking records can block the external response. If all options miss the cutoff, the next task is escalation or a revised commitment, not a fabricated recovery recommendation.

## Input records are not interchangeable

The pinned composition uses the existing evidence and commitment engines. Exact batch, insert, destination, checkout, device and account scope is retained on diagnostic, booking and permission records. Editing the campaign does not update older source scopes.

The form edits review timing, actual diagnostic outcomes and source text, quantity-specific package quotes, and external booking records. It does not change the published package effects or rank packages in JavaScript. Production capacity and operating permissions remain visible as original supplied records; import another continuing review when their source records change.

Ten planned rehearsal minutes do not establish a successful checkout. Post-correction observations belong to a separate actual-event gate and corrected output configuration. They never rewrite the pre-correction diagnosis.

Operating forms preserve independent source values: the authority's scope and amount, the correction's original input and actual output scope, actual corrected/handed quantities, test scope and linked references. A matching plan is visible context, rather than an automatic upgrade to the external record.

## Separate review, authority and completion

The authored workflow checks sourced spending authority, actual correction for the chosen package, a successful fresh rehearsal on the corrected output, and a linked complete handoff with valid chronology. The event time and the time it was recorded are distinct editable values. Records are assertions supplied by the user; this app does not authenticate the person or document, spend money, perform work or issue permission.

The original quantity and cutoff are retained separately. A revised cutoff does not mark the original promise fulfilled. Missing, failed, short, wrong-scope, future-dated or late actual evidence leaves the original handoff unestablished.

This bounded sample treats each operating kind as one complete current record for the selected plan. The latest supplied authorization, correction, rehearsal or handoff supersedes earlier records of that kind. A later withdrawal, failed test or wrong-scope replacement cannot fall back to an older positive. History remains visible; a new correction record also requires a current rehearsal and handoff linked to it. Incremental deliveries or several parallel correction activities require a richer authored record model.

Before committing to work, changing the review time forces reassessment. Once work is underway, record actual events against the historical chosen plan rather than moving the planning clock to pretend production happened.

## Read the code

[`src/useGiftJourney.js`](src/useGiftJourney.js) is the application path. It owns one browser executor per effect, uses request tokens so an old calculation cannot replace a new case, and uses ordinary state/hooks for the form.

```js
const updated = updateReviewInputs({ lab, run, values }); // changed answers await review
const reviewed = reviewJourneyInputs({ lab, run: updated, actor });
const calculated = await evaluateReviewJourney({ lab, run: reviewed, stepId: 'evidence' });
const accepted = acceptReviewFinding({ lab, run: calculated, stepId: 'evidence', actor });
```

[`src/reviewJourney.js`](src/reviewJourney.js) is a verbatim shared integration helper used across shipping/gifting and CLI/React. It wraps the existing public workflow API. The portable workflow definition contains the diagnostic/planning mappings and final business gate. `openReviewJourney` verifies both the app pin and expected definition; a compatible raw format is insufficient.

`saveReviewJourney` uses `localStorage` with an expected-hash check so another tab's saved revision is not silently replaced. This is a small example persistence adapter, not a production database. Downloaded native workflow files are also usable by the CLI continuation script.

[`src/giftingJourney.js`](src/giftingJourney.js) selects current evidence, planning and operating findings for the screen. It does not re-evaluate correction coverage or infer feasibility. Compatible earlier/current planning runs are compared through `lab.reports.compareFindings`, including unavailable comparisons and tied preferences.

```jsx
import { DecisionView } from '@decision-lab/react-views';
import '@decision-lab/react-views/styles.css';

<DecisionView report={view.currentRun.report} profile={config.decisionPresentation} />
```

The SDK projection supplies the report values; a `decision-presentation/1` profile supplies business labels and units. `RecordsView` renders review stages, supplied records and operating history. Tables and expandable technical history use the shared views; the application does not implement its own recommendation table or evaluator.

## Verification

`test/journey.test.js` evaluates all six cases using the real SDK engines, checks successful and rejected actual-event records, verifies staleness and storage conflicts, and demonstrates why a revised promise is not original fulfillment. The browser test runs the actual worker through input/finding review, selection, actual-event capture, completion, dirty export and recovery. `GIFT_PREFLIGHT_REVIEW` can point to a real CLI-produced native workflow; the test imports it and checks its exact hash is preserved.

Older standalone helper/fixture tests remain as compatibility coverage for the prior immutable tutorial release. The primary interface loads `public/data/journey-config.json` and the new portable version 3 definition. Generated source lives in [`examples/gifting/clients`](../../../examples/gifting/clients); run `npm run check:gifting:clients` from the root to detect drift.
