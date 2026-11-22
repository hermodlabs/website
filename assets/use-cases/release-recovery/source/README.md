# Plan an at-risk release

This example turns a scoped Jira snapshot and a separate operating basis into a
release-arrangement comparison. It uses the public Decision Lab CLI to author
the supporting app, publish the workflow package locally, calculate cases and
retain the complete outputs. The Marketplace opens that same workflow package
with the standard input forms, reports and decision-process graph.

The fictional release has 12 hours of remaining core QA and eight hours of
reporting QA. Its existing qualified allocation has a 16-hour working window.
Four authored arrangements make the alternatives concrete:

| Arrangement | What changes |
| --- | --- |
| Original release | Full scope, original date, existing QA allocation. |
| Core only | Defer reporting, requiring explicit acceptance of the scope revision. |
| Additional qualified help | Keep the original promise; buy the four-hour independent regression package for $400. |
| Later release | Keep full scope and use the proposed later deadline, requiring acceptance of that exact deadline. |

A smaller release or later date does not become delivery of the original promise.
Every result retains the original scope and deadline. The app checks feasibility;
it deliberately does not rank the arrangements or choose for the release owner.

## Run it

Use Node 22.19 or later. From the repository root:

```sh
npm install
npm run build:packages
node sample_code/software-delivery/release-recovery/walkthrough.mjs all \
  --accept-fictional-demo --output-root /tmp/release-example-01
```

Choose a new output directory each time. Existing output files and completed
stages are never overwritten. The `--accept-fictional-demo` flag permits replay
of the individually documented authoring judgments in
[`source/authoring-reviews.json`](source/authoring-reviews.json). Read them first:
this flag does not approve changed declarations, authenticate a reviewer or grant
permission to release software. A changed binding hash stops the walkthrough.

The npm package names are `@decision-lab/cli` and `@decision-lab/sdk`. This example
is qualified against the local workspace builds; no npm publication is implied.
The sample's `package.json` records the package versions used. A developer using
packed builds can install those supplied packages instead of the workspace.

Run the stages separately against the same output root to inspect each boundary:

```sh
node walkthrough.mjs author --accept-fictional-demo --output-root /tmp/release-example-02
node walkthrough.mjs cases --output-root /tmp/release-example-02
node walkthrough.mjs changes --output-root /tmp/release-example-02
node walkthrough.mjs import --output-root /tmp/release-example-02
```

Those commands run from this directory. `cases` needs `author`; `changes` needs
the baseline calculated by `cases`; `import` needs `author`.

Each stage writes `commands.json` with arguments, exit codes, stdout and stderr,
plus a readable `commands.sh`. The latter is an inspection transcript whose
output paths already exist; repeat the walkthrough with fresh paths instead of
replaying it over retained files.

## Authoring is different from supplying a case

| File | Responsibility |
| --- | --- |
| `profile.json`, `model.mjs` | App author: the four arrangements, resources, validation phases, transferable work package, prerequisites and constraints. |
| `workflow.mjs`, `workflow-config.json` | Workflow author: questions, exact app dependency, bindings, next actions and shared report configuration. |
| `source/` | Portable authored JSON, immutable packages, workbook mapping and individually reviewed binding declarations. |
| `cases/` | Case worker: remaining effort, operating windows, qualification records, bookings, expense limit and recorded acceptance/permission. |
| `import-profile.json`, `import-jira.mjs` | Adapter author: the source columns, units, release scope and two supported work-package meanings. |

The `author` stage validates and repacks the template, initializes the app from
its canonical model, and packs the app through public commands. App initialization
uses `--format json` so a large model never needs to fit a YAML output budget.
It then creates the workflow, proves unreviewed bindings prevent publication,
replays only the exact reviewed declarations, and packs the workflow and Excel
definition. Each package must equal the supplied fixture.

Representative commands, with paths shortened for readability:

```sh
decision-lab template validate commitment.template-definition.json
decision-lab template pack commitment.template-definition.json \
  --created-at 2026-11-16T12:00:00.000Z --output commitment.template.json
decision-lab app init --template commitment.template.json \
  --model source/release.model.json --app-id compare-release-arrangements --release 1 \
  --format json --output release.app-definition.json
decision-lab app pack release.app-definition.json \
  --created-at 2026-11-21T18:00:00.000Z --output release.app.json
decision-lab workflow create --source source/workflow.source.json \
  --output workflow.definition.json
```

Use the generated transcript for exact timestamps and every binding-review and
publication command. `workflow create` produces a runtime definition;
`workflow pack` produces the separately installable publication.

## Calculate the arrangements

```sh
decision-lab workflow start --definition source/workflow.definition.json \
  --case cases/baseline.json --run-id release-local \
  --created-at 2026-11-21T18:00:00.000Z --output release.started.run.json
decision-lab workflow solve --run release.started.run.json \
  --created-at 2026-11-21T18:00:00.000Z --output release.solved.run.json
decision-lab workflow inspect --run release.solved.run.json --output release.output.json
decision-lab workflow brief --run release.solved.run.json --format markdown \
  --case-name "Release 2026.11" --output release.brief.md
```

`*.solved.run.json` retains the definition, inputs, history and evaluations.
`*.output.json` exposes the complete SDK workflow output: native planning
assessment, every candidate's blockers, prepared views and decision-process
nodes/edges. The Markdown brief is a convenient summary of the recorded basis,
not a replacement for the complete output or an instruction to deploy.

The `cases` stage verifies these outcomes:

| Case | Arrangements meeting the recorded requirements |
| --- | --- |
| `baseline` | Additional qualified help. |
| `accepted-scope-change` | Core only; additional qualified help. |
| `accepted-date-change` | Additional qualified help; accepted later release. |
| `no-passing-plan` | None of the supplied arrangements. |
| `unqualified-help` | None; availability and price cannot substitute for qualification. |
| `wrong-build-help` | None; qualification for another build does not apply. |
| `late-help` | None; qualification arriving after the required activity interval does not apply. |
| `changed-date-without-acceptance` | Additional qualified help; the changed later deadline lacks matching acceptance. |
| `missing-estimate` | Comparison unavailable; unknown work is not zero. |

CLI exit `0` means the calculation completed, including a completed comparison
with no passing arrangement. Exit `3` means the required comparison is unavailable.
The walkthrough expects that distinction and keeps both outputs.

The `changes` stage branches from the baseline run. One branch accepts deferring
reporting. Another removes the external qualification record. A third records
the core estimate as unknown. Previously calculated findings become stale, the
original evaluations remain retained, and only recalculation can provide a new
current result. No branch mutates the original saved run.

## Import a Jira snapshot

```sh
node import-jira.mjs --source fixtures/jira-release.csv \
  --mapping import-profile.json --output /tmp/release-source-01.json \
  --case-output /tmp/release-inputs-01.json
```

The normalized source snapshot preserves issue keys, original update timestamps,
source status, source line, estimate unit, directed blocking links, exact release
scope, build/environment and source/profile hashes. `REL-101 blocks REL-103`
has one meaning; the adapter never reverses the relationship. An external
prerequisite remains an explicit missing endpoint with a blocking diagnostic.
Internal links also require deliberate review against the fixed authored QA
phases. The fixture's core-checkout link to reporting aligns with those phases;
that does not establish that a different exported dependency structure fits.
The adapter neither applies arbitrary imported dependencies to the schedules
nor checks them for cycles. An unfamiliar dependency structure requires an
adapted authored app before confirming its prerequisites.

The case file contains only the two estimated workloads, in whole minutes:

```json
{ "release": { "coreMinutes": 720, "reportingMinutes": 480 } }
```

All other operating facts remain unanswered. A blank estimate becomes `null` and
keeps its package total unknown. A `Done` ticket still supplies no acceptance
finding. The import stage starts this incomplete case, verifies it cannot yet
calculate, and then explicitly supplies the separate fictional operating values
from `cases/baseline.json` through individual `workflow answer` commands. Those
values are demonstration inputs, not information obtained from Jira.

The profile declares the supported project, exact release version, two work
packages and column names. Estimates can declare `hour`, `minute` or `second`;
conversion must result in whole minutes. Story points are rejected. This fixture
uses an explicit remaining-QA-hours field: importing a generic development
estimate as QA effort would be a different meaning requiring author review.

CSV support includes UTF-8/BOM, CRLF, quoted commas/newlines and escaped quotes.
The adapter bounds files to 2 MiB, 5,000 issues and 64 columns. Duplicate issue
keys/headers, ambiguous mappings, unrelated versions/packages, bad units and
malformed numbers fail before output files are written. Locale-specific dates
must be normalized explicitly to ISO timestamps with a timezone; they are never
guessed. Duplicate Jira link headings must be made explicit in the selected
export and mapping. There is no OAuth, live synchronization or source mutation.

## Modeling boundary

The app evaluates four supplied schedules rather than searching arbitrary Jira
task graphs. Core QA has authored primary, independent-regression and integration
phases. Only the independent four-hour package can use the additional QA resource.
Changing those dependencies, adding work packages or introducing another resource
requires an adapted authored app.

Effort and elapsed time differ. The 16-hour resource window represents an
exclusive qualified team allocation that can span shifts; it is not a claim
that one person works a 16-hour shift. Real operating windows, qualification
intervals and existing bookings must describe the actual allocation. Calendar
gaps are unavailable time, and concurrent bookings consume the same resource.

Money uses USD cents; work and clock offsets use whole minutes. Recorded scope
acceptance, exact-date acceptance, prerequisite confirmation and release permission
are distinct inputs. The calculation does not obtain external approvals, run
tests, certify quality, estimate a delivery probability or publish the release.

The Marketplace package uses reusable reports. Domain vocabulary and question
grouping come from configuration; this example adds no software-specific renderer.

## Tests and possible article continuations

```sh
node --test test/import.test.mjs test/cli.test.mjs
```

Start an article series from the verified fixtures: compare the at-risk release,
lose the extra tester's qualification, accept a specific scope/date amendment,
and bootstrap the comparison from Jira. A later compatibility-investigation
article would need a separately authored learning app, reviewed probabilities,
report reliability, costs, timing and resource use. That learning branch is not
implemented by this example.
