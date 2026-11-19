# Continuing a review

`reviewJourney.js` is maintained sample integration code. Each CLI and React
project carries a byte-identical copy in `src/`, so copying one application does
not create a runtime dependency on another sample or on this repository.

```sh
node scripts/sync-sample-journeys.mjs
node scripts/sync-sample-journeys.mjs --check
node --test tests/sampleReviewJourney.test.js
```

The durable artifact is the SDK's ordinary `decision-lab-workflow-run/1`.
`createReviewJourney` uses an authored workflow or supplies a small planning
workflow. It adds two questions outside the planning inputs: the original
screening/source context and the operating record. The SDK owns validation,
app pins, answer reviews, evaluations, finding reviews, staleness and history.
This module never evaluates business constraints itself.

Imported business answers await review. The person explicitly reviews changed
inputs, evaluates the relevant step, and accepts or rejects its exact finding.
A complete blocked finding can be accepted as a finding; it cannot become a
selected feasible response. Recording a selection does not create authority.
Recording an external authority or completion reference does not authenticate
that source or perform the operation.

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
plan. Repeated evaluation of unchanged accepted inputs leaves the existing
decision intact. Changed premises use the SDK's normal reassessment gates.

`saveReviewJourney` is a small browser-storage boundary. It saves validated
native JSON and checks the expected saved hash to avoid silently overwriting
another tab. CLI examples use new output directories and native JSON files.
Neither storage approach is a production multi-user case database. SDK history
and artifact limits still apply; preserve completed runs in an external archive
when a longer operating history is needed.
