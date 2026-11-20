# Shipment Reservation Desk

A focused React client using the public SDK. Continue the exact shipment screened
by the CLI, review received records, compare complete arrangements, and retain a
separate operating decision and the resulting external evidence.

React uses ordinary hooks. The authored app owns feasibility and ranking;
the authored workflow owns operating conclusions. `DecisionView` presents the
concise assessment without rebuilding business rules in JSX.

## Run

Use Node.js 22.19 or later; Node.js 24 is recommended. In this repository:

```sh
npm run dev:shipment:react
npm run build:shipment:react
npm run test:shipment:react
npm run test:shipment:react:browser
```

This directory can be copied as a standalone npm project. While packages are
local release candidates, install matching archives:

```sh
npm install --no-save --package-lock=false \
  /absolute/path/decision-lab-sdk-0.1.0.tgz \
  /absolute/path/decision-lab-cli-0.1.0.tgz \
  /absolute/path/decision-lab-react-views-0.1.0.tgz
npm run dev
```

Keep SDK optional dependencies enabled for Vite's browser dependency resolution.
The CLI is a development dependency for actual parity checks. Serve production
builds over HTTP so the emitted browser worker can load.

## Follow one review

1. Import `review.json` from the CLI's shipment output, or select a fictional worked case.
2. Inspect the owner, order revision, expense limit, quote validity and booking windows.
3. Add only records actually received. Their real scope remains editable and visible.
4. Explicitly accept reviewed input records, then review arrangements.
5. Inspect the supported alternatives and blocker-specific responsible roles.
6. Accept the analytical finding separately, then record a chosen complete response.
7. Record an actual sourced authorization, reservation or delivery; escalate when necessary.
8. Save locally or download the native continuation to retain the complete history.

The policy is cost first among complete arrangements satisfying all requirements,
then arrival. The ample case prefers Direct ($4,000); an 11:30 a.m. review closes
Direct's carrier booking window and can prefer Consolidated ($5,000). Earlier
arrival by itself is not a reason to pay more. A revised capacity/slot case and an
old-permissions case show distinct all-blocked outcomes.

The original arrival-first release is archived rather than silently changed.
The new app and workflow are authored in `examples/shipping/clients/`; identical
copies power both clients. Fictional records extend the
[consolidated-freight teaching scenario](https://www.hermodlabs.com/use-cases/supply-chain/shipment-readiness/add-consolidated-freight/),
not an actual supplier deployment.

## SDK integration

Start in `src/useShipmentReview.js`. An effect owns `createBrowserExecutor()` and
`createDecisionLab({ executor })`; ordinary state retains the native WorkflowRun.
Abort controllers and request IDs prevent obsolete evaluations from replacing
new input or a restored review.

```js
const imported = openReviewJourney({ lab, value, app, definition });
const changed = updateReviewInputs({ lab, run: imported, inputs });
// The following operations correspond to separate, explicit user actions.
const reviewed = reviewJourneyInputs({ lab, run: changed, actor: 'Maya Chen' });
const assessed = await evaluateReviewJourney({ lab, run: reviewed });
const accepted = acceptReviewFinding({ lab, run: assessed, actor: 'Maya Chen' });
```

These integration helpers are copied from `sample_code/shared/reviewJourney.js`
for independent distribution. They wrap existing public workflow operations;
there is no new evaluator or custom saved-case format. Native continuations
retain exact app/workflow pins, prior assessments, source receipts, accepted
answers, decisions and external event history. Imports verify the expected
workflow as well as the planner package; a looser workflow cannot impersonate
this desk merely by referencing the same app.

`src/shipment.js` converts units and source forms. It uses the public native
commitment predicates after resolving assessments. Completion, feasible witness,
established preference and human acceptance remain separate questions. A complete
no-feasible-plan assessment is a useful finding.

Saving or exporting first flushes valid draft edits into the workflow as records
awaiting review. It does not lose edits or export a stale recommendation as
current. Local saves detect conflicting saved revisions; restore explicitly
reopens the stored history. This is a storage example, not an authenticated
company database.

`DecisionView` receives the report and versioned presentation profile. It shows
cost, arrival, booking cutoff and material blockers. Full reports are available
on inspection, and native SDK runs remain downloadable. Business labels do not
change calculations.

## Actual records and limits

Replacement-record forms retain the received record's actual order, revision,
destination, shipment date, profile, ship point and validity. Changing a quote
does not change permission scope. One reviewed registration state is supported;
unresolved factual alternatives require the separate evidence pattern rather
than a checkbox pretending to establish registration.

Operating forms collect original source references and actual scope and times.
The authored workflow checks source authorization and the quote-linked
reservation on the current selected assessment. Delivery additionally requires
the accepted quantity, receiving window and linked booking. A recorded event
label alone never establishes completion, and a future delivery time is not
actual delivery evidence. The tool does not authenticate external assertions.

The latest supplied complete authorization, reservation or delivery record for
the selected assessment and plan determines current support. A negative or
incorrectly scoped replacement never revives an older positive record. History
is retained; genuine replacement evidence can restore support once the complete
chain is valid, including the delivery's link to the current booking reference.
Reconcile source messages into a current-status record before submitting them;
the desk does not reorder an external event stream.

The assessment clock is a recorded input, distinct from event-recording time.
Advance it to reassess an unbooked opportunity. Expiration of the original quote
does not cancel a completed carrier reservation; retain its contractual evidence
and review changed circumstances before making another operating decision.

The example does not book freight, send messages, issue authority, reconcile
source event streams, or allocate resources jointly across shipments. A revised
promise must remain distinct from meeting the original delivery commitment.
