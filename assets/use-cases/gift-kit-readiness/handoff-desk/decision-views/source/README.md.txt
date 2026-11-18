# Gift-kit Handoff Desk

A small React app for an event operations team preparing 120 QR gift kits.
It uses the public Decision Lab SDK to compare complete correction packages
before the handoff deadline. The form is specific to the team's task; the
requirements and preference rules come from a pinned app configuration.

This is the second step after [Gift-kit Preflight](../../cli-app/gift-kit-preflight/README.md).
The CLI reviews several batches from exports. This screen lets the coordinator
open one batch, update its timing, quote, vendor confirmation or recorded
availability, and review the updated recommendation. Both use the same app
and native case inputs.

## Run

Use Node.js 22.19 or later; Node.js 24 is recommended. This directory is an
independent npm project using React and Vite, without SDK source aliases or
imports from the Decision Lab interface.

In the Decision Lab checkout:

```sh
npm run dev:gifting:react
npm run build:gifting:react
npm run test:gifting:react
npm run test:gifting:react:browser
```

To copy this directory into another repository, install matching SDK, CLI and React views
archives. They are currently `0.1.0` release candidates, rather than a promise
that these versions are available from the public registry:

```sh
cd react-app/gift-kit-handoff-desk
npm install --no-save --package-lock=false \
  /absolute/path/to/decision-lab-sdk-0.1.0.tgz \
  /absolute/path/to/decision-lab-cli-0.1.0.tgz \
  /absolute/path/to/decision-lab-react-views-0.1.0.tgz
npm run dev
```

`npm run release:pack` in the Decision Lab checkout creates archives in
`artifacts/npm/`. The CLI is a development dependency used for parity tests.
Keep SDK optional dependencies enabled, because its browser entry includes
workbook modules that Vite must resolve. After compatible versions are
published, ordinary `npm install` can resolve the dependencies.

Run `npm run build` and `npm run preview` here for a production build. Serve the
build over HTTP; a browser worker cannot run from `file://`.

## What the example reviews

A batch can contain an unreadable printed code, the wrong destination, a
checkout fault, or several faults together. The team has five authored
packages: rehearse unchanged kits, replace inserts, repair destination and
checkout, perform both corrections in-house, or obtain an external replacement
and repair package. The model retains all eight declared fault combinations.
Choosing a package is not a diagnosis of which fault actually occurred.

Every complete package includes correction work, a fresh rehearsal and handoff.
The review checks the current quantity, budget, deadline, resources and scoped
permissions. External work additionally needs a recorded confirmation covering
the same batch, revisions, device, account and work interval. Among eligible
packages, the app prefers the earliest finish, then the lower complete cost.

The teaching records are fictional:

| Prepared case | Result after **Review packages** |
| --- | --- |
| Confirmed external booking · GIFT-120 | External replacement and repair is preferred: $400, finish at minute 20. |
| Revised insert, older booking · GIFT-121 | Permission covers insert revision 4, but the external confirmation covers revision 3. In-house replacement and repair is preferred: $300, finish at minute 35. |
| Revised insert, older permissions · GIFT-122 | The confirmation covers revision 4, but permissions cover revision 3. No listed package passes. |

Use **Scenario set → One-day campaign** for the article's longer review window.
It uses the same app release, with a cutoff at minute 1,440 and a planned
ten-minute rehearsal:

| One-day case | Result after **Review packages** |
| --- | --- |
| GIFT-220: current confirmation | External package, $400, handoff at T+25 min. |
| GIFT-221: older insert confirmation | In-house package, $300, handoff at T+40 min. |
| GIFT-222: late start, expired records | No package passes: the earlier availability, permissions and confirmation do not cover the work. |
| GIFT-223: late start, current records | External package, $400, handoff at T+23 hr 25 min, 35 min before cutoff. |

The original one-hour cases remain available. The one-day horizon starts at
the review's fixed origin, not when the screen opens. The late-start cases
record review time at T+23 hr, leaving one hour before the cutoff. A day means
1,440 elapsed minutes, not a working day or a timezone-aware calendar date.

## Change the timing without changing the rules

**Review setup** edits these canonical case parameters:

| Form field | Native parameter | Meaning |
| --- | --- | --- |
| Recorded review time | `nowMinute` | The earliest time the current review can support work. |
| Handoff cutoff | `handoffDeadlineMinute` | The position by which the complete handoff must finish. |
| Planned rehearsal | `rehearsalMinutes` | Proposed rehearsal duration. |
| Handoff duration | `handoffMinutes` | Proposed time for the final handoff. |
| Candidate starts | `startOptions` | A comma-separated list of exact start positions to assess. |

All entries use whole minutes. Positions are measured from a fixed review
origin; durations are lengths of time. The concise comparison shows the SDK's
handoff finish in elapsed minutes, alongside cost, eligibility and blockers.
The cutoff stays visible in Review setup. Selected-option details retain its
start, full schedule and requirements. A timely finish alone does not satisfy
permissions, capacity or the other requirements.

The published **minimum** rehearsal is read from the pinned app rule and shown
read-only. It remains five minutes. Planning ten minutes is a case change;
making ten minutes mandatory is an authoring change and requires another
reviewed app release. The earlier strict gifting adaptation has a ten-minute
minimum and is a different policy. This example does not claim to reproduce it.

The planner checks only the supplied candidate starts, not every minute in the
day. Updating the recorded review time does not move a candidate start at zero.
Correction, rehearsal and handoff are consecutive activities; this is not an
overnight calendar scheduler with arbitrary waiting between tasks.

**Availability and permissions** lets the coordinator update the times on
existing production availability, bookings and permission records. Package,
actor, source and configuration scopes stay attached to their original records.
The vendor confirmation has its own recorded time and validity fields. Changing
a cutoff never extends any of these intervals. Import a complete revised case
to add or remove records, change permission scope, or change resource capacity.

In GIFT-222, choose **Review packages** to see why the late start fails. Compare
GIFT-223: its fictional replacement records explicitly cover the later interval.
They are separately stipulated inputs, not records inferred from the deadline.

Any timing or interval edit marks the result as needing reassessment, disables
the current run download, and retains the previous calculation for comparison.
Select **Review packages** to produce a current result; download the case inputs
to retain those edits.

## Reproduce the article's inputs

The maintained source is
[`examples/gifting/clients`](../../examples/gifting/clients/README.md). Its
generator copies canonical cases and descriptions into both standalone clients;
neither client imports the source folder at runtime. Do not maintain separate
article-only copies with undocumented differences.

From the Decision Lab checkout:

```sh
npm run generate:gifting:clients
npm run check:gifting:clients
npm run test:gifting:clients
```

The combined test runs both CLI manifests, imports their actual exported cases
into the production React app, and compares native results. Fixture generation
does not change the app package or its pinned rule version. A copied standalone
project already contains all generated inputs and does not need the generator.

A passing result describes a proposed complete plan. It does not establish
that corrections, rehearsal or handoff have already happened. Changing a
confirmation must not remove possible faults or update the scope of existing
permissions.

## Follow the SDK integration

Start with [`src/useGiftReview.js`](src/useGiftReview.js). The **Review packages**
handler contains the entire evaluation path:

```js
const inputs = buildCase(caseData, draft, config);
const snapshot = lab.cases.create({ app, inputs });
const validation = lab.cases.validate({ app, case: snapshot });
// Display validation.issues and return if validation.valid is false.
const result = await lab.run({
  app,
  case: snapshot,
  execution: { signal: controller.signal, timeoutMs: 15000 },
  reportOptions: { scope: 'all', locale: 'en-US' },
});
```

The hook creates `lab` with `createDecisionLab({ executor })` and the public
`createBrowserExecutor()`. An effect loads the app and initial case, verifies
the configured app binding, and owns worker cleanup. React StrictMode exercises
that setup/cleanup lifecycle in development. An abort controller plus a request
counter prevents a superseded evaluation from replacing newer form state.

Cases load without running automatically. Editing immediately marks the
recommendation as needing reassessment and retains the previous calculation
for comparison. Only a complete assessment supplies a current recommendation.
A complete assessment with no eligible package is a valid business result;
an incomplete evaluation is unavailable, rather than an approval or a finding
that every package failed.

The source has four small responsibilities:

| File | Responsibility |
| --- | --- |
| [`src/App.jsx`](src/App.jsx) | Team-specific forms and controls around the public decision view. |
| [`src/useGiftReview.js`](src/useGiftReview.js) | React state, public SDK calls, case switching and cancellation. |
| [`src/gifting.js`](src/gifting.js) | Exact form conversions and selection of public SDK findings. |
| [`public/data/config.json`](public/data/config.json) | Pinned app identity, prepared case locations, business labels and decision presentation. |

The helper reads native findings through the SDK's public
`commitment.resolveCommitmentAssessment()` function. It does not reproduce the
model's constraints or implement a second preference rule in JavaScript.

## CLI to React handoff

1. Run the companion preflight demo and open its batch report.
2. For GIFT-121, use **Download case for the React desk** to locate the native
   `campaigns/GIFT-121/case.json` artifact.
3. In this app, select **Import case** and choose that file.
4. Select **Review packages**. The SDK should prefer in-house work, because
   the external confirmation still covers insert revision 3.
5. If the team actually receives a replacement confirmation, record its real
   reference, source, recorder, current revision and validity interval. For the
   fictional demonstration, change the confirmation insert revision to `insert-4` and
   review again. External work should become preferred.
6. Download **Case inputs** to retain the edited records or feed the canonical
   inputs to the CLI. Download **SDK run** for the full native report artifact.

The CLI and UI do not transfer an accepted approval. They share the same
recorded inputs and calculation contract. Import also accepts a native
`decision-lab-case/1` artifact bound to the pinned app. Archived run restoration
and custom review bundles are intentionally outside this tutorial.

## Data boundaries

The complete imported case includes people, permissions, resources, calendars
and bookings. A new quote alone does not provide those prerequisites. The form
updates case timing, package quotes, one external confirmation, and numeric
fields on existing availability, booking and permission records. It preserves
the remaining data and all existing permission scopes. It rejects cases containing several current
confirmations instead of silently choosing one.

Amounts are complete package costs in USD, converted exactly to integer cents.
There is no foreign exchange conversion. Quoted quantity is an exact package
quantity, not a capacity that automatically covers any smaller batch. All times
are whole elapsed minutes on the case's preparation clock; they are not a live
wall clock. Retain and deliberately update the recorded review time when
preparing a real case.

There is no automatic local storage save. Download inputs before leaving if
you need to retain edits. The screen does not authenticate a permission, obtain
approval, book vendor capacity or complete any work. Separate batch results
also do not establish that several batches can share the same resources at
the same time.

To extend the example, replace the prepared case source and adapt the forms or
labels. A new business requirement belongs in a reviewed app release, followed
by a deliberate update of the pin. A React filter applied after evaluation
would create a competing rule system.

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

The handoff column selects the SDK's retained `handoff.end` activity time.
The cutoff remains an input in Review setup; both use elapsed minutes from the
same fixed origin. No extra margin calculation is assembled in React. Earlier
timing inputs and all operating checks remain available in technical inspection.

Task-specific forms, cancellation and downloads remain ordinary React code.
The SDK owns the evaluation, and the shared view owns report presentation. SDK
and CLI consumers that do not need React need not install the views package.
