# Pinned data

All cases are fictional. The package `shipment-review.app.json` is copied byte
for byte from `cli-app/shipment-exceptions/app/shipment-review.app.json`, which
retains the published consolidated-shipment app. The application ID is
`shipment-review-with-consolidation`, release `1`; exact package and rule hashes
are recorded in `config.json`.

The three canonical case files were generated once while authoring this
example through the CLI example's `loadBatch()` adapter:

| Browser fixture | Source snapshot | Source shipment |
| --- | --- | --- |
| `cases/confirmed.json` | `fixtures/baseline` with `fixtures/retained/baseline` | `SHIP-104` |
| `cases/revised.json` | `fixtures/morning` with `fixtures/retained/morning` | `SHIP-105` |
| `cases/permissions.json` | `fixtures/morning` with `fixtures/retained/morning` | `SHIP-106` |

These paths are relative to `cli-app/shipment-exceptions`. The browser project
does not import that adapter or read files outside its own directory at runtime.

SHIP-105's current registration and permissions were supplied explicitly in
the authored source case. Its consolidation confirmation still covers revision
1. SHIP-106 has current registration but retains revision-1 permissions and
confirmation. Neither importer nor React form creates new authority by changing
an old record's scope.

Preparation actors have shipment-specific IDs. The model's fixed, case-local
`packing-bench` identifier represents a separately allocated bench in each
case. These independent cases do not establish a feasible shared schedule.

Costs are complete shipment expenses in integer USD cents. Times are elapsed
whole minutes from `2026-11-17T00:00:00-06:00`, with a fixed UTC−06:00 display
offset. The fixtures use a fixed review time so results remain reproducible.
They are not live carrier offers or confirmations.

`config.json` maps every authored constraint ID to a business label. These
labels do not modify the requirements or their calculations.
