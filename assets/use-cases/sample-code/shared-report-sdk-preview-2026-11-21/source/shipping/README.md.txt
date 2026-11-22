# Shipping samples

These clients extend the shipment-readiness use case using public packages and
portable configuration.

| Task | Client | Run from repository root |
| --- | --- | --- |
| Identify changed or closing commitments | [Shipment exceptions](shipment-exceptions/README.md), CLI | `npm run demo:shipment:cli` |
| Resolve one exception and retain the operating handoff | [Shipment Reservation Desk](shipment-reservation-desk/README.md), React SDK | `npm run dev:shipment:react` |
| Assess whether a timely registration check is worthwhile | [Readiness learning](readiness-learning/README.md), Python ML and SDK | Follow its model-training, estimate-inspection and worked-case commands. |

## CLI to React continuation

The JavaScript CLI and React desk use calculation workflow **2.0.0** around the
same frozen cost-first operating app. The CLI writes a native `review.json` for
each calculated shipment. Import it in the desk to retain the exact case,
versions, source receipts and earlier findings.

Apply changed inputs, then Calculate/Recalculate. The SDK supplies the compact
Decision summary and arrangement comparison. Supporting reports, Decision
process and Calculation dependencies remain available. Inspecting an arrangement
changes no choice or input. A complete blocked finding is distinct from missing,
stale or incomplete calculations.

Record the chosen response, sourced operating authority and actual reservation
or delivery separately. Download the continuation for `continue-review.mjs`;
it preserves the same native workflow history rather than substituting a new
case. A reservation does not prove delivery, and a revised promise does not
satisfy the original promise.

The prior reviewed workflow **1.0.0** is retained only for exact-hash imports and
teaching history. Its reviews are not silently removed. Starting a current
calculation from its inputs creates a new run without copying operating authority
or completion records.

The self-contained current definition lives under
[product/use-cases/shipment-readiness/integrations](../../product/use-cases/shipment-readiness/integrations).
Reproduce and check its standalone copies with:

```sh
node scripts/build-integration-calculation-journeys.mjs
node scripts/build-integration-calculation-journeys.mjs --check
npm run check:samples:journeys
```

See [shared integration contracts](../shared/README.md).

## Python learning example

The [readiness-learning app](readiness-learning/README.md) is the supported Python
sample. Its model proposes uncertainty estimates from fictional training data;
a person inspects the estimates before the SDK compares a timely check with
acting now. Learning value remains separate from operating feasibility and
actual readiness evidence. Optional ML dependencies stay inside that project.

The earlier standalone Python shipment-review client is retired. All supplied
records are fictional; none of these clients books freight, authenticates an
approval or performs a shipment.
