# Reassess shipments from company exports

This Node application wraps the existing Decision Lab shipment review with a
batch importer and an exception report. It uses the public
`@decision-lab/cli` command entry point. It does not import an evaluator or
reimplement shipment rules.

The starting point is an existing review: a supplier has compared Direct,
Backup and Consolidated freight. Consolidated requires a current confirmation
for the exact order revision, ship point and arrangement. Overnight order
revisions, carrier quotes or confirmation records can change which arrangement
the published review supports. A developer needs to repeat that review using
company exports and show the logistics team which recommendations changed.

The fixtures are fictional teaching records. The broader context comes from
[Hermod Labs' consolidated-freight review](https://www.hermodlabs.com/use-cases/supply-chain/shipment-readiness/add-consolidated-freight/)
and the [8th & Walton supplier case study](https://www.8thandwalton.com/blog/case-study-walmart-launch),
which describes purchase-order, item-alignment and freight-term corrections.
This example is not a deployment for that supplier.

## Run the example

Use Node.js 22.19 or later. The copied directory is a standalone npm project;
it uses `@decision-lab/cli` for evaluation and `@decision-lab/react-views` for
report tables, with the SDK and React as peer dependencies.

The current `0.1.0` packages are local release candidates. Install matching
SDK, CLI and React views archives together so npm can resolve the matching
Decision Lab packages locally:

```sh
cd sample_code/shipping/shipment-exceptions
npm install --no-save --package-lock=false \
  /absolute/path/to/decision-lab-sdk-0.1.0.tgz \
  /absolute/path/to/decision-lab-cli-0.1.0.tgz \
  /absolute/path/to/decision-lab-react-views-0.1.0.tgz
npm run demo
npm test
```

In a Decision Lab source checkout, the archives are under `artifacts/npm/`.
`npm run release:pack` at the repository root rebuilds local candidate archives.
After compatible packages are published, `npm install` can resolve the
dependencies declared in this directory's `package.json` normally. No source
checkout is needed by the application at runtime.

`npm run demo` evaluates a baseline batch, then a morning batch with the baseline
manifest as its comparison. Open `.output/demo/morning/shipments.html` for the
result. The morning batch deliberately includes one malformed quote, so its
application exit code is `2`; the demo verifies the expected outcome and keeps
the other shipments' results.

Output directories must be fresh. The application refuses to overwrite an
existing batch. For another demo run, choose a new parent directory:

```sh
node run-demo.mjs --output .output/another-demo
```

To run only the second batch after the default demo's baseline exists:

```sh
node review-shipments.mjs \
  --input fixtures/morning \
  --retained fixtures/retained/morning \
  --previous .output/demo/baseline/manifest.json \
  --output .output/morning
```

Open `.output/morning/shipments.html` in a browser. The CLI artifacts remain
available beside it for inspecting the full calculation and reproducing each
invocation.

In this source checkout, the existing root installation resolves the public
packages through npm workspaces. Run `npm run demo:shipment:cli` or
`npm run test:cli-apps` from the repository root to build the packages first.

## What the application owns

```text
company exports + retained shipment cases
                  |
                  v
        validate and map source records
                  |
                  v
        CLI case validation and run
        using one pinned app release
                  |
                  v
        prepared report output
                  |
                  v
        compare earlier results
                  |
                  v
        HTML / CSV exception report
                  |
                  v
        human review and operational handoff
```

The retained case supplies the complete recorded review basis: resources,
calendars, registration records, scoped permissions and other required inputs.
The exports update only the fields owned by this adapter. A new quote is not a
complete shipment case.

The adapter binds those values to the copied immutable app release, calls
`case validate`, and calls `run` for each valid shipment. The calls go through
`runCLI(args, { stdout, stderr, signal })`, with the same arguments accepted by
the `decision-lab` executable. The report adapter projects the returned report
data; it does not decide feasibility independently. HTML tables use
`RecordsView` from `@decision-lab/react-views`, rendered with React DOM on the
server. This produces a static document with no browser JavaScript requirement.
The surrounding batch queue, source links and CSV export belong to this example.

The app's requirements and ranking are the same ones used by the interactive
shipment review. To introduce a new business requirement, author and check a
new app release, then explicitly update the application pin. Adding a filter
to this script after the calculation would create a second, untracked rule
system.

The batch re-evaluates every supplied order. The earlier manifest is a
comparison input, not a calculation cache or a way to skip unchanged cases.
The application rejects a baseline bound to a different app/rule release.
Changes in the importer, records or reasoning capabilities need their own
review even if a preferred arrangement happens to retain the same name.

## Files and outputs

| Source | Responsibility |
| --- | --- |
| `review-shipments.mjs` | Command-line entry point for a batch review. |
| `run-demo.mjs` | Run the baseline and changed batches and verify the worked outcomes. |
| `config.json` | The exact app package, supported currency and time origin for this integration. |
| `app/shipment-review.app.json` | Copied immutable `shipment-review-with-consolidation` release `1`, matching the published interactive example. |
| `src/batch.mjs` | Orchestrate preparation, CLI validation/execution and comparison across independent shipments. |
| `src/cli.mjs` | Invoke the public `runCLI` entry point and retain its diagnostics/exit codes. |
| `src/inputs.mjs` | Validate company exports and map only their declared dynamic fields into retained cases. |
| `src/csv.mjs` | Read strict CSV and preserve row locations for diagnostics. |
| `src/report.mjs` | Render the application's HTML/CSV summaries from calculated results and diagnostics. |
| `fixtures/` | Source snapshots and retained case records, including intentionally invalid data. |
| `test/` | Input and end-to-end regression checks. |

Each batch output contains:

| Artifact | Purpose |
| --- | --- |
| `shipments.html` | Human-readable exception report; open locally in a browser. |
| `shipments.csv` | Flat summary for the logistics team's spreadsheet or another integration. |
| `manifest.json` | Machine-readable batch results and exact app identity, usable as the next comparison baseline. |
| `cli-commands.json` | Public CLI invocations and their returned exit codes. |
| `shipments/<id>/case.json` | The app-bound inputs prepared for that shipment. |
| `shipments/<id>/validation.json` | CLI case-validation receipt. |
| `shipments/<id>/run.json` | Full CLI run with prepared reports and retained calculation. |
| `shipments/<id>/sources.json` | The recorded source basis for that shipment. |

Early input errors can prevent creation of case, validation or run artifacts.
The manifest/report show the diagnostic rather than supplying a fabricated
assessment. One invalid shipment does not discard successfully calculated
shipments in the same batch.

`cli-commands.json` retains the actual argument arrays and `publishedArgs`,
which point to the artifacts after the output directory is published. To replay
an invocation, use a fresh `--output` file. The integration never uses `--force`.
Source receipts record the SHA-256 of the exact bytes imported. A changing source
snapshot aborts publication; local hashes detect changes, not authenticity.

## Record handling

Each input directory contains three CSV snapshots:

| File | Contents and ownership |
| --- | --- |
| `orders.csv` | One current row per `shipment_id`: order ID/revision, destination, ship date, quantity, spending limits, review time, reservation/receipt deadlines and responsible owner. |
| `quotes.csv` | One complete current quote per shipment/arrangement: exact order revision, ship point, cost, carrier departure, travel minutes and capacity. |
| `slot-confirmations.csv` | At most one current slot status per shipment/arrangement, retaining its actual order scope, reference, knowledge time and validity interval. A header-only file supplies no confirmations. |
| `--retained/<shipment_id>.json` | The canonical case containing the other recorded facts and obligations. The case ID must match the filename and shipment ID, and its order ID must match the export. |

The header names and validators are declared in
[`src/inputs.mjs`](src/inputs.mjs). The CSV reader supports quoted fields, escaped
quotes, CRLF and embedded newlines. Missing/unexpected columns, duplicate
current orders or quotes, and contradictory duplicate slot statuses produce
diagnostics rather than a “last row wins” decision.

These are complete snapshots, not patches. Quotes and slot confirmations
replace the corresponding dynamic tables in the retained case. An absent slot
record leaves no confirmation available to the assessment. Every arrangement
in the retained case must have exactly one current quote; silently dropping an
option would change the comparison. Adding or removing arrangements requires
an explicit case/model review.

Only shipments present in the current export are assessed. An order absent
from that export has no current result; absence is not interpreted as approval
or cancellation. Prior files are retained unchanged.

The application does not reconcile an event stream, fetch incremental updates
or determine current status from a sequence of messages. A source system must
first reconcile cancellations and amendments into one current status. The
snapshot and retained case are explicit inputs to each batch.

An order revision changes the order being assessed. It does not change the
scope of an existing authorization or confirmation. The adapter must preserve
the revision, location, arrangement, validity and source recorded on those
documents. In particular, it must never copy the current order revision onto
an old grant to make the grant match.

Order and quote rows require `currency=USD`. Monetary columns contain decimal
dollars with at most two decimal places; the adapter converts them exactly to
integer cents without foreign-exchange conversion. Blank currencies, commas in
amounts, negative amounts and unsupported precision produce diagnostics.
Timestamps require ISO format with an explicit UTC offset and whole-minute
precision, such as `2026-11-18T08:00:00Z`. The adapter converts them to whole
minutes relative to the configured origin. It does not infer a time zone from a
display string. Quantities, capacities and `travel_minutes` are whole numbers.

The example evaluates independent shipments. It does not establish that the
whole batch can execute together when shipments compete for the same truck,
dock, worker or cash. Use already allocated resources for independent cases,
or author a combined model for shared allocation.

The report adapter targets this static shipment profile: one complete plan per
arrangement and one arrival value across its admitted situations. It preserves
preferred ties. A different profile with several plans per arrangement or
situation-dependent arrivals needs an explicit report mapping; unsupported
projections are shown as unavailable rather than summarized optimistically.

## Reading the report

[`src/semantics.mjs`](src/semantics.mjs) names the sample's separate vocabularies:
`REVIEW_OUTCOME` describes an available eligible or blocked finding, while
`BATCH_STATUS` describes the comparison with an earlier review. Neither is an
SDK execution status. `SLOT_CONFIRMATION_STATUS` names source-record states;
no CSV row means no confirmation record. The frozen maps and JSDoc types retain
the existing serialized strings. [`src/classify.mjs`](src/classify.mjs) keeps the
comparison order explicit, preserves preferred ties, and treats an unrecognized
comparison status as requiring reassessment.

The worked inputs cover four outcomes:

| Shipment / morning input | Report meaning |
| --- | --- |
| `SHIP-104`: no relevant change | Consolidated remains preferred under the recorded basis. |
| `SHIP-105`: revised order; registration and permissions are current; Consolidated's confirmation covers the old revision | Consolidated is blocked. Direct becomes preferred. |
| `SHIP-106`: revised order; permissions cover only the previous revision | No listed arrangement passes the recorded permission requirements. |
| `SHIP-107`: a quote reports EUR instead of USD | The importer cannot prepare a supported case; no new calculation is reported. |

The two snapshots use the same calculation time so an unchanged shipment can
reproduce the earlier result exactly. Their directory names identify the
comparison scenario; the application does not infer chronology from them.
See [fixture notes](fixtures/README.md) for the deliberately supplied current
records and independent resource allocations.

Every calculated row still requires human review. “Unchanged” means the
comparison did not find a changed calculated recommendation; it is not an
approval or proof that the underlying records are true. “No feasible plan” is a
valid conclusion about the listed plans and recorded requirements, not a CLI
execution failure. An import error is shown separately from such a conclusion.

The report does not book freight, issue authority, authenticate a permission,
accept a workflow review or establish actual completion. It prepares the
information a responsible person needs for that work.

## Troubleshooting

Check the import diagnostics before investigating a calculated blocker.
An unmatched order revision, missing source record or ambiguous unit must be
fixed in the input or its reviewed mapping. Do not repair a mismatch by
rewriting the scope of supporting evidence.

CLI diagnostics are JSON on stderr. The general CLI exit codes are `0` for a
delivered artifact, `2` for invalid input/binding, `3` for cancelled, timed-out
or resource-limited execution, and `4` for operational/delivery failure.
`app check` and `workflow check` also use `1` for a completed calculation that
disagrees with an authored expectation. A successful `run` can still establish
that none of the listed shipment arrangements is feasible.

The **batch application** summarizes those individual outcomes into its own
process exit code:

| Exit | Batch meaning |
| --- | --- |
| `0` | Every supplied shipment completed its calculation. Some or all may have no feasible arrangement. |
| `2` | At least one shipment has an input error, or the batch itself is malformed. |
| `3` | A calculation is unavailable or incomplete, including a timeout or computation limit. |
| `4` | An operational failure prevented completion or delivery. |

Check the manifest and report even when the application exits nonzero: valid
shipments can have retained results alongside another shipment's diagnostic.
Do not interpret a partial batch as a completed review of every order.

The entry point also accepts `--config`, `--created-at`, `--max-plans` and
`--timeout-ms`. The latter two constrain execution; they do not relax business
requirements. An unfinished calculation must remain unavailable instead of
being relabelled “no feasible plan.”

Keep the complete run artifact when investigating a result. It contains the
app identity, input basis, execution status and prepared report, rather than
just the summary chosen for the HTML report. When using a new app release,
re-establish the comparison basis explicitly; a prior recommendation from a
different rule release is not an equivalent baseline.
