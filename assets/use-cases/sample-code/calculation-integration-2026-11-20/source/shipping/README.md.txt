# Shipping samples

Standalone clients use the same shipment exception rules and native review format:

| Step | Client | Run from repository root |
| --- | --- | --- |
| Identify changed or closing commitments | [Shipment exception queue](shipment-exceptions/README.md), public CLI | `npm run demo:shipment:cli` |
| Compare shipment revisions and booking cutoffs | [Python shipment review](shipment-review/README.md), Python SDK | `python sample_code/shipping/shipment-review/review_shipments.py --output /tmp/python-shipment-review` |
| Assess whether a timely registration check is worth buying | [Readiness learning app](readiness-learning/README.md), Python ML and SDK | See its README for model training, estimate review and four worked cases. |
| Resolve one intervention and retain the handoff | [Shipment Reservation Desk](shipment-reservation-desk/README.md), public SDK | `npm run dev:shipment:react` |

The CLI writes a native `review.json` for each calculated shipment. Import that
file in the desk to keep its exact case, app/workflow versions, prior findings,
owner and source basis. In the current JavaScript clients, apply changed inputs,
then Calculate/Recalculate. The SDK supplies the focused Decision summary,
compact arrangement comparison and current supporting reports. Inspecting an
arrangement changes no choice or input. Record a chosen response, sourced
operating authority and actual reservation/delivery records separately.

Download the continuation to return it to `continue-review.mjs`. The same native
workflow history passes between clients; a new case is not silently substituted.
The SDK withdraws stale results when applied inputs change. Unknown inputs and
incomplete calculations stay distinct from a completed finding that no plan
passes. The SDK retains complete outputs while the clients present the few
findings needed for the next decision.

The Python sample retains `review.workflow.json` for each scenario, including
its provisional calculation, original case and source receipts. It can continue
in the same React desk; imported business answers still await explicit review.
The Python sample intentionally retains its reviewed 1.0.0 workflow. The current
desk can inspect/export that exact retained history and explicitly start a new
calculation from its inputs; it does not rewrite the old history. Its README
covers the bundled-runtime wheel and editable development setup.

The JavaScript CLI and React desk use calculation-mode workflow 2.0.0 around
the same frozen cost-first operating app. Reviewed workflow 1.0.0 is archived
for exact-hash imports. Native `output.decisionSummary`, supporting question
views, Decision process and Calculation dependencies are shared SDK projections.
Reproduce the workflow definitions with
`node scripts/build-integration-calculation-journeys.mjs`; verify them with
`--check`. See [shared integration contracts](../shared/README.md).

All clients retain source-aware operating requirements.
Authored quote validity and individual booking cutoffs make time consequential.
A reservation does not prove delivery; an escalation or revised customer promise
does not satisfy the original promise. All records are fictional and no external
business operation is performed.
