# Continuing an analysis

`reviewJourney.js` is maintained sample integration code. Each CLI and React
project carries a byte-identical copy in `src/`, so copying one application does
not create a runtime dependency on another sample or on this repository.

```sh
node scripts/sync-sample-journeys.mjs
node scripts/sync-sample-journeys.mjs --check
node --test tests/sampleReviewJourney.test.js tests/integrationCalculationJourneys.test.js
node scripts/build-integration-calculation-journeys.mjs --check
node examples/gifting/clients/generate.mjs --check
```

The durable artifact is the SDK's ordinary `decision-lab-workflow-run/1`.
`createReviewJourney` uses an authored workflow or supplies a small planning
workflow. It adds two questions outside the planning inputs: the original
screening/source context and the operating record. The SDK owns validation,
app pins, calculation readiness, evaluations, staleness and history. Retained reviewed definitions also keep their original answer and finding reviews.
This module never evaluates business constraints itself.

Current JavaScript clients use calculation-mode definitions. Applied business
inputs are `supplied`; `solveReviewJourney` delegates to `lab.workflows.solve`
to calculate applicable assessments in dependency order. The SDK materializes
`output.decisionSummary`, `output.decisionProcess`, `output.workflowMap` and
supporting question views from the authored definition. The clients render those
outputs without recreating eligibility or preference rules.

A current complete calculation can support an operating choice only when its
native assessment contains a complete feasible plan. A complete blocked finding
is still a completed calculation; unknown, stale or incomplete findings cannot
stand in for it. Finishing the calculation is separate from the domain-authored
actual-event completion gate. Recording a selection creates no authority, and
recording an external reference neither authenticates it nor performs the work.

Historical reviewed definitions are retained at their exact hashes. They still
require explicit input/finding reviews. `openReviewJourney` accepts only the
expected authored definition or an explicitly supplied `compatibleDefinitions`
allowlist; it does not reinterpret old history as a calculation workflow.
Starting a current analysis from old case inputs creates a new run and copies no
operating authorization or completion records. The app-only default helper also
remains a reviewed example for compatibility.

Reproduce the new workflow releases without altering the frozen app packages:

```sh
node scripts/build-integration-calculation-journeys.mjs
node examples/gifting/clients/generate.mjs
node scripts/sync-sample-journeys.mjs
```

Shipping uses workflow 2.0.0 and gifting uses workflow 4.0.0; their underlying
operating apps and original business cases remain pinned. The prior reviewed
shipping 1.0.0 and gifting 3.0.0 definitions remain available for exact imports.

Each operating entry retains its selected complete plan and assessment basis.
Domain-authored gates check original scope, chronology, actual result and
required sources before describing a reservation, successful rehearsal or
handoff as recorded. `currentOperations` means entries linked to the currently
selected assessment and plan; it does not mean their contents are proven true.
Gifting's corrected-output rehearsal remains separate from the original fault
diagnosis. Shipping's reservation remains separate from delivery.

Both tutorial profiles use one complete operating record per event kind on the
selected assessment and plan. The latest supplied record is current; a later
negative or wrong-scope record cannot fall back to an older positive one. The
earlier records remain in history. Partial deliveries, several concurrent grants
or competing source assertions need an explicitly authored reconciliation model.

The source case is also retained once as `journeyContext.originalCase` and
checked against the first historical snapshot. A revised deadline or quantity
can support a new proposal, but cannot silently redefine the original promise.
Authored operating gates distinguish completion of the original commitment from
completion against revised terms.

Before action, a new quote, revision or assessment time creates changed answers
and makes dependent findings stale. The assessment clock is an explicit business
input. An event's `at` timestamp records when someone supplied an assertion;
it does not silently move that assessment clock. After work starts, retain the
historical decision basis and record actual progress against it. A later review
must consider remaining work and existing commitments, rather than book the same
shipment or repeat completed correction automatically.

`openReviewJourney` checks the native workflow and expected app, retains one
business-case identity across its history, and rejects unrelated screening
calculations. External references cannot silently migrate to another selected
plan. Repeated calculation of unchanged supplied inputs leaves the existing
decision intact. Changed premises use the SDK's normal reassessment gates.

`saveReviewJourney` is a small browser-storage boundary. It saves validated
native JSON and checks the expected saved hash to avoid silently overwriting
another tab. CLI examples use new output directories and native JSON files.
Neither storage approach is a production multi-user case database. SDK history
and artifact limits still apply; preserve completed runs in an external archive
when a longer operating history is needed.
