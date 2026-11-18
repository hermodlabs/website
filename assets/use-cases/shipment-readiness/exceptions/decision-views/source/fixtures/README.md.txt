# Fixture notes

All records in this directory are fictional. Order IDs and prices continue the public consolidation example; the extra orders make changes visible in a batch.

`baseline` and `morning` each contain complete CSV snapshots. `retained/baseline` and `retained/morning` contain the independently supplied canonical cases used with those snapshots. Both snapshots use the same calculation time so an unchanged shipment reproduces the original result; the directory names describe the comparison, not timestamps inferred by the program. The fixed time origin is `2026-11-17T00:00:00-06:00`.

| Shipment | Morning inputs | Intended review |
| --- | --- | --- |
| SHIP-104 | Same order, quotes, grants and slot | Consolidated remains preferred |
| SHIP-105 | Revision 2, explicit current registration and authorities, revision-1 slot | Consolidated is blocked; Direct becomes preferred |
| SHIP-106 | Revision 2 and current registration, revision-1 authorities and slot | No listed arrangement meets all recorded requirements |
| SHIP-107 | Direct quote reports EUR rather than USD | Input error; do not produce a new assessment |

The revision-2 readiness and authority records in SHIP-105 were authored explicitly as fixture inputs. The importer never creates these records, grants authority, or copies an old record onto a new scope. SHIP-106 deliberately has no current authority. The slot exports retain revision 1 throughout.

Packing and release actors have shipment-specific identifiers. The authored model uses the fixed, case-local `packing-bench` resource identifier; each retained case stipulates its own independent bench allocation. This example makes no claim that several shipments can share the same resource concurrently.

Quote prices are complete USD shipment expenses, not freight-only charges. Each complete quote includes preparation, release and transport; there are no inferred extra fees. Timestamps include their UTC offsets and use whole minutes. The single slot row per arrangement is a resolved current-status register, not an event stream.
