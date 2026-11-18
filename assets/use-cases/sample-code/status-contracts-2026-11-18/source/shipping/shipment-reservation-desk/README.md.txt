# Shipment Reservation Desk

A focused React example using `@decision-lab/sdk`: edit a shipment's quotes or
consolidation confirmation, evaluate the recorded arrangements, and display the
recommendation in a team-specific screen. React owns the form and presentation.
The pinned shipment app supplies the requirements and preference rules.

## Run

Use Node.js 22.19 or later; Node.js 24 is recommended. This directory is a
standalone npm project with normal React, Vite and SDK dependencies. It has no
aliases into SDK source files and does not import the Decision Lab interface.

The SDK, CLI and React views packages are local `0.1.0` release candidates. Install
matching archives; the CLI is a development dependency for the parity check:

```sh
cd sample_code/shipping/shipment-reservation-desk
npm install --no-save --package-lock=false \
  /absolute/path/to/decision-lab-sdk-0.1.0.tgz \
  /absolute/path/to/decision-lab-cli-0.1.0.tgz \
  /absolute/path/to/decision-lab-react-views-0.1.0.tgz
npm run dev
```

In the Decision Lab checkout, `npm run release:pack` creates archives under
`artifacts/npm/`. Once compatible packages are published, ordinary `npm install`
can resolve them. Keep the SDK's optional dependencies enabled: its browser
entry includes workbook modules that Vite must resolve, even in this example.

Repository-root commands build the local SDK and React views before running the example:

```sh
npm run dev:shipment:react
npm run build:shipment:react
npm run test:shipment:react
npm run test:shipment:react:browser
```

For a production build from this directory, run `npm run build`, then
`npm run preview`. Serve the generated files over HTTP; `file://` cannot load the
browser worker.

## Follow the SDK call

Start with [`src/useShipmentReview.js`](src/useShipmentReview.js). Its
**Review arrangements** event handler shows the integration directly:

```js
const inputs = buildCase(caseData, draft, config);
const snapshot = lab.cases.create({ app, inputs });
const validation = lab.cases.validate({ app, case: snapshot });
// Show validation issues and return if invalid.
const result = await lab.run({
  app,
  case: snapshot,
  execution: { signal: controller.signal, timeoutMs: 15000 },
  reportOptions: { scope: 'all', locale: 'en-US' },
});
```

The hook creates `lab` with `createDecisionLab({ executor })` and
`createBrowserExecutor()`. An effect owns and closes the worker, including React
StrictMode's development cleanup cycle. Abort controllers and a request counter
prevent superseded evaluations from replacing a newer form or case.

SDK runs remain ordinary React state. `useMemo` derives the current and earlier
summaries; there is no separate controller or application framework. Selecting
or importing a case loads its form without running it. Evaluation is explicit.
Editing immediately withholds the current recommendation and retains the last
calculation as a comparison.

[`src/semantics.js`](src/semantics.js) names the small vocabularies used by the
form and hook. `REVIEW_STATE` describes React's loading, editing and evaluation
lifecycle; `REVIEW_OUTCOME` describes whether an available result is eligible
or blocked. A completed review can be blocked. `SLOT_CONFIRMATION_STATUS.NONE`
means no source record, so the form writes an empty table rather than a `none`
record. These frozen maps and JSDoc types preserve the existing wire values;
native SDK execution and assessment statuses keep their own meanings.

[`src/shipment.js`](src/shipment.js) contains the form conversions and
`summarizeRun()`. The summary uses the public
`commitment.resolveCommitmentAssessment(run.assessment, run.report)` helper to
read the SDK's plans, failed conditions, expenses, arrivals and preferred ties.
It does not decode report internals or calculate shipment rules. Incomplete
assessments withhold a recommendation; a complete result with no feasible
arrangement is a valid business finding.

[`src/App.jsx`](src/App.jsx) renders the hook's state using ordinary React
components. `src/main.jsx` mounts the app; `src/styles.css` provides the
responsive layout and normal page scrolling. Static configuration and complete
cases live in `public/data/`.

## Shipment context

A logistics coordinator has three complete arrangements. Consolidated arrives
earlier than Direct within the expense limit, but requires a confirmation for
the current order revision, ship point and loading interval. Revised orders and
updated records can therefore change the supported recommendation.

The fictional cases demonstrate these outcomes after **Review arrangements**:

| Prepared case | Expected result |
| --- | --- |
| Confirmed slot · ORD-104 | Consolidated is preferred: $5,000, Thursday 6 p.m. |
| Revised order · ORD-105 | Current registration and permissions cover revision 2; the slot covers revision 1. Consolidated is blocked; Direct is preferred: $4,000, Friday noon. |
| Old permissions · ORD-106 | Selection and release permissions cover the old revision. No listed arrangement passes. |

The background is the
[consolidated-freight example](https://www.hermodlabs.com/use-cases/supply-chain/shipment-readiness/add-consolidated-freight/)
and the [8th & Walton supplier case study](https://www.8thandwalton.com/blog/case-study-walmart-launch),
which describes order and freight-term corrections. These teaching records are
not a deployment for that supplier. See [data notes](public/data/README.md) for
fixture sources and the fixed November 17, 2026 review clock.

## Records and reuse

The complete case already contains readiness, resources, calendars and
permissions. A quote alone is insufficient. The form changes only its quote
and confirmation fields; it never rewrites an existing permission's scope to
match a revised order. A replacement confirmation must retain its actual
reference, scope and validity times.

Quotes are complete USD shipment expenses, including preparation, release and
transport. Form amounts convert exactly to integer cents without currency
conversion. Times are whole minutes from `2026-11-17T00:00:00-06:00`, displayed
with the configured fixed offset. Business labels in `public/data/config.json`
change presentation, not the rules.

Download **Case inputs** for canonical JSON that the CLI can validate and run.
Download **SDK run** for the complete native `decision-lab-run/1` result. Import
accepts raw canonical inputs or a `decision-lab-case/1` bound to the pinned app.
Archived-run restoration and custom review bundles are outside this example.
There is no automatic local-storage save; download inputs before leaving if
you need to retain edits.

Copy this directory to a team's repository, install the SDK, and replace the
prepared case loader with the team's supported case source. Adapt the forms
and labels while retaining the complete underlying case. To add a requirement,
publish and verify a new app release and deliberately update the pin. A React
filter applied after evaluation would introduce a second rule system.

The companion [CLI example](../shipment-exceptions/README.md)
evaluates the same cases in batches. Tests cover form conversions, real SDK
Node-worker outcomes, incomplete assessments and ties. Production browser
checks exercise React editing, cancellation, case switching, downloads and
agreement with the CLI.

Results still require human review. This screen does not authenticate
permissions, obtain approval or reserve freight. Each case stipulates its own
allocated resources; independent results do not prove several shipments can
share trucks, docks, workers or cash concurrently.


## Reuse the decision view

The current result uses the public `DecisionView`. It shows the supported finding,
comparison and material blockers. Selecting an option exposes its requirements
and schedule on demand. **Technical inspection → Inspect complete report** opens
the complete public report viewer; those reports are not appended to the page.
An earlier run is retained in a closed disclosure and labelled as a previous
calculation.

```jsx
import { DecisionView } from '@decision-lab/react-views';
import '@decision-lab/react-views/styles.css';

<DecisionView report={run.report} profile={config.decisionPresentation} />
```

`public/data/config.json` contains a versioned `decision-presentation/1` profile.
Its columns select SDK values, supply business labels, and declare display units.
The SDK prepares this projection; React does not rank options, infer readiness,
or recalculate failed conditions. Full native SDK downloads remain unchanged.

The arrival column selects the SDK's retained `arrival` consequence. Its explicit
ISO origin, time zone and minute unit produce calendar labels. The view never
guesses a calendar from the model's prose time origin.

Task-specific forms, cancellation and downloads remain ordinary React code.
The SDK owns the evaluation, and the shared view owns report presentation. SDK
and CLI consumers that do not need React need not install the views package.
