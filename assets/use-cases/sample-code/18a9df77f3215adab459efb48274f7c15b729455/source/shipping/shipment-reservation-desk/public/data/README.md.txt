# Pinned teaching data

`shipment-review.app.json` and `shipment.workflow.json` are identical to the CLI
client's new immutable cost-first profile and authored operating workflow. Exact
pins are retained in `config.json`. The earlier arrival-first package is archived
under `shipment-exceptions/app/archive/`; marketplace releases are unchanged.

Regenerate or verify copies from the repository root:

```sh
node examples/shipping/clients/generate.mjs
node examples/shipping/clients/generate.mjs --check
```

The complete cases come from the CLI's strict CSV adapter:

| Case | Source |
| --- | --- |
| confirmed | Baseline SHIP-104 at 08:00; Direct is preferred on cost. |
| revised | Morning SHIP-105; Direct lacks capacity and the consolidation slot covers the old revision. |
| permissions | Morning SHIP-106; reservation and release grants cover the old revision. |
| urgent | Baseline SHIP-104 assessed at 11:30; Direct's 11:00 cutoff has passed, Consolidated remains open until noon. |

Every case contains the whole declared resource, calendar, readiness and grant
basis. Shipments stipulate independent resource allocations. Money is whole USD
cents; times are whole minutes from `2026-11-17T00:00:00-06:00` with a fixed UTC−06
zone. They are reproducible fictional records, not current carrier offers.
