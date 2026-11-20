# Shipping samples

Two standalone clients continue the same shipment exception review:

| Step | Client | Run from repository root |
| --- | --- | --- |
| Identify changed or closing commitments | [Shipment exception queue](shipment-exceptions/README.md), public CLI | `npm run demo:shipment:cli` |
| Resolve one intervention and retain the handoff | [Shipment Reservation Desk](shipment-reservation-desk/README.md), public SDK | `npm run dev:shipment:react` |

The CLI writes a native `review.json` for each calculated shipment. Import that
file in the desk to keep its exact case, app/workflow versions, prior findings,
owner and source basis. Imported facts await explicit review. After reviewing a
finding, record a chosen response and actual operating records separately.

Download the continuation to return it to `continue-review.mjs`. The same native
workflow history passes between clients; a new case is not silently substituted.
Saving or exporting preserves edited inputs as awaiting review rather than
accepting them. The SDK retains complete outputs while the clients present the
few findings needed for the next decision.

Both clients use the new cost-first app and source-aware operating workflow.
Authored quote validity and individual booking cutoffs make time consequential.
A reservation does not prove delivery; an escalation or revised customer promise
does not satisfy the original promise. All records are fictional and no external
business operation is performed.
