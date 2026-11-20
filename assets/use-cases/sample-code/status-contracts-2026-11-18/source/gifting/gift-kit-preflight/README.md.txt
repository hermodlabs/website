# Gift-kit preflight

A small Node.js application that calls the public `@decision-lab/cli` command
handler to review several independent gift-kit campaigns. Its output identifies
cases that need attention and exports native cases for the companion
[Gift-kit Handoff Desk](../gift-kit-handoff-desk/README.md).

This is the batch step. The React example is the next step: open one exported
case, update its timing, quote or external-booking record, and calculate a new proposal
through the SDK. Both examples use the same pinned app package.

## Run

Use Node.js 22.19 or later; Node.js 24 is recommended. This directory is an
independent npm project. It imports public package exports and has no aliases
into the Decision Lab source tree.

The current SDK, CLI and React views are local `0.1.0` release candidates. Install matching
archives before running the copied example:

```sh
cd sample_code/gifting/gift-kit-preflight
npm install --no-save --package-lock=false \
  /absolute/path/to/decision-lab-sdk-0.1.0.tgz \
  /absolute/path/to/decision-lab-cli-0.1.0.tgz \
  /absolute/path/to/decision-lab-react-views-0.1.0.tgz
npm run demo
```

In the Decision Lab checkout, `npm run release:pack` creates those archives under
`artifacts/npm/`. Once compatible packages are published, ordinary `npm install`
can resolve the dependencies. A checkout with installed workspace dependencies
can run this example directly.

The demo writes `.output/demo/campaigns.html` and checks the four expected
outcomes. Output directories must be new; use a different location to rerun:

```sh
node run-demo.mjs --output .output/demo-2
node review-campaigns.mjs \
  --input fixtures/campaigns.json \
  --output .output/preflight-1
npm test
```

The ordinary review command returns exit **2** for these fixtures because one
case intentionally has an invalid budget. The demo returns zero only when all
four expected outcomes occur, including that input error.

## What is being evaluated

The kits contain printed QR codes. A complete handoff can fail because the code
is unreadable, its destination is wrong, or checkout fails. Those faults may
coexist. The retained cases include all eight combinations; the script does
not infer a diagnosis or remove a possibility because a quote looks attractive.

The pinned app compares five authored packages, from an unchanged-kit rehearsal
to complete replacement and repair. A package must address the retained faults,
have current scoped permission and resources, cover the kit quantity, leave
time for rehearsal and handoff, and meet the budget and cutoff. The external
package also needs a booking covering the current campaign revisions and work
interval. The app prefers the earliest feasible complete package.

All names, records, prices and timings in the fixtures are fictional:

| Campaign | Recorded situation | Calculated result |
| --- | --- | --- |
| GIFT-120 | Current external booking and permissions | External replacement and repair, $400, handoff ready at minute 20 |
| GIFT-121 | Insert revision 4, current permissions, booking still covers revision 3 | In-house replacement and repair, $300, ready at minute 35 |
| GIFT-122 | Current booking, permissions still cover revision 3 | No package meets the requirements |
| GIFT-123 | Campaign budget is `null` | Input error; no recommendation |

Amounts in native cases are integer USD cents. Times are elapsed whole minutes
from the case's review origin, not dates or clock times. The correction package
is followed by the declared rehearsal and handoff durations.

## Run the one-day scenario

The original four cases keep their one-hour cutoff and five-minute planned
rehearsal. A second set provides reproducible inputs for an article using a
one-day cutoff and ten-minute planned rehearsal:

```sh
node review-campaigns.mjs \
  --input fixtures/campaigns.one-day.json \
  --output .output/one-day-1
```

This command returns zero: the deliberately blocked case is a complete business
finding, and all four inputs are valid. The published app, correction-package
effects, rules and eight retained fault combinations are unchanged.

| Campaign | Recorded situation | Calculated result |
| --- | --- | --- |
| GIFT-220 | Early start, current external booking, cutoff at minute 1,440 | External package, $400, finish at minute 25 |
| GIFT-221 | Same one-day cutoff, older insert scope on the booking | In-house package, $300, finish at minute 40 |
| GIFT-222 | Review and proposed start at minute 1,380; original short availability, permission and confirmation intervals | No package meets the requirements |
| GIFT-223 | Review and proposed start at minute 1,380; separately authored records cover minute 1,380 through 1,440 | External package, $400, finish at minute 1,405, with 35 minutes of slack |

Here **one day means 1,440 elapsed minutes from the case origin**, not a working
day or a calendar date. At minute 1,380, the cutoff is only one hour away.
Changing the cutoff does not extend production availability, permission or a
supplier's confirmation. GIFT-220 can finish while the original short records
still apply; GIFT-222 cannot. GIFT-223 includes explicit fictional replacement
records with their own sources rather than silently extending GIFT-222's records.

The HTML report distinguishes positions such as `T+24 hr` from durations such as
`10 min`. It shows the current review time, time remaining, cutoff, finite
candidate starts, planned rehearsal, published minimum, proposed start and
finish, and cutoff slack. Expand **Recorded availability, permissions and
confirmation** to inspect the supplied intervals, scopes and source records.
The report displays the app's failed conditions; it does not implement another
availability or permission checker.

These are the timing parameters in each canonical case:

| Parameter | Meaning | Who supplies it |
| --- | --- | --- |
| `nowMinute` | Position of this review after the case origin | Case worker |
| `handoffDeadlineMinute` | Position by which the complete handoff must finish | Case worker |
| `startOptions` | Explicit finite candidate start positions | Case worker |
| `rehearsalMinutes` | Planned rehearsal duration after correction | Case worker |
| `handoffMinutes` | Planned handoff duration after rehearsal | Case worker |
| Five-minute rehearsal minimum | Published rule applied to every candidate | App author |

The planner compares the supplied start candidates; it does not search every
minute in the day. Moving `nowMinute` while leaving the only start at zero
will make that candidate fail the app's not-in-the-past requirement.

A ten-minute **planned** rehearsal already fits this app. A ten-minute
**mandatory minimum** would require a new authored app rule version. The earlier
adaptation with a ten-minute minimum is therefore a different rule basis from
this example's five-minute minimum; an article should state which it demonstrates.

In the Decision Lab repository, both client copies come from the maintained
source [`examples/gifting/clients`](../../../examples/gifting/clients). To edit the
teaching scenarios and regenerate them, run these commands at the repository root:

```sh
npm run generate:gifting:clients
npm run check:gifting:clients
```

The generated inputs are ordinary standalone files. Running a copied CLI or
React example does not depend on the generator or on the other example folder.

## Input and handoff

The manifest is a list of complete canonical case files:

```json
{
  "campaigns": [
    {
      "id": "GIFT-121",
      "owner": "Jordan Reed",
      "case": "cases/stale.json"
    }
  ]
}
```

Paths are relative to the manifest directory. The campaign ID, case `id`, and
`parameters.batchId` must agree. A case is a complete snapshot: parameters,
quotes, retained fault scenarios, resources, permissions, and any external-booking
record. This is not an event log, and the script does not merge partial records.
It leaves source files unchanged and does not automatically update old scopes.
The supplied fixtures retain eight fault configurations. An imported case may
retain a different admitted set; the report shows its actual scenario count,
and its result applies only to that set.

Each readable, matching case is copied to the output before native validation.
For example:

```text
.output/preflight-1/
  campaigns.html                    Readable campaign comparison
  manifest.json                     Summary and source SHA-256 receipts
  commands.json                     Actual CLI arguments, exit codes and diagnostics
  app.json                          App opened and validated by the CLI
  campaigns/
    GIFT-121/
      case.json                     Native input; import this into the React desk
      validation.json               Native case-validation result
      run.json                      Complete native CLI run, including reports
```

In the React desk, choose **Import case** and select
`campaigns/GIFT-121/case.json`. The imported booking remains at revision 3. Record
a genuinely current external booking, then choose **Review packages**. The
comparison should change from the in-house package to the earlier external
package. A new booking does not repair old permissions or establish that the
work was performed.

The same handoff works for `campaigns/GIFT-220/case.json` through
`campaigns/GIFT-223/case.json` from the one-day run. The desk also lists the
matching one-day examples. Its **Review setup** form edits the timing parameters;
the recorded availability and permission tables remain as imported. Use complete
canonical inputs when a newly obtained source record changes those tables.

Missing or unreadable cases have no exported case. Invalid cases retain their
validation result but have no fabricated run. Fix a missing budget in the
canonical source and run preflight again; the React desk's focused form does
not edit every possible case field.

## Follow the CLI calls

Start with [`src/preflight.mjs`](src/preflight.mjs). The runner calls the public
handler exported by the installed CLI:

```js
import { runCLI } from '@decision-lab/cli';

const exitCode = await runCLI([
  'run', '--app', appFile, '--case', caseFile,
  '--reports', 'all', '--output', runFile,
], { stdout, stderr });
```

The real application first calls `app open` to validate the pinned package and
match its app/release hashes, then `case validate` for each case. Valid cases
reach `run --reports all`. No shell interpolation, private evaluator, workflow
review acceptance, or second set of JavaScript business rules is involved.

[`src/gifting.js`](src/gifting.js) selects plans and failed conditions with the
SDK's public `commitment.resolveCommitmentAssessment()` helper. The React
example has the same helper and pinned data, so the two displays use the same
SDK-supported findings. Its form-conversion exports are unused by this batch
runner; they support the companion interactive step.

The helper's `REVIEW_OUTCOME` names the projected business outcomes;
`PREFLIGHT_STATUS` adds the queue's input-error case. They retain the existing
manifest strings. An available assessment can be `BLOCKED`, because a complete
calculation can establish that no package fits. `BOOKING_CONFIRMATION` keeps
missing and explicitly negative evidence distinct when the case is edited.

[`src/report.mjs`](src/report.mjs) renders a standalone HTML document using
`RecordsView` from `@decision-lab/react-views` for the campaign queue and package
comparison tables. React DOM renders them to static HTML; no browser JavaScript
is required. The main view contains names, outcomes, costs, times, and failed
conditions. Full native artifacts remain available as downloads rather than the
primary view. The surrounding task guidance and recorded basis belong to this
example; the table renderer is shared with the React clients.

The importable entry point is:

```js
import { runPreflight } from './src/preflight.mjs';

const { manifest, exitCode, outputDir } = await runPreflight({
  inputFile: 'fixtures/campaigns.json',
  outputDir: '.output/review-2',
  // configFile: 'data/config.json',
  // timeoutMs: 30000,
  // maxPlans: 0, // Useful for exercising a native incomplete assessment.
});
```

## Failure and execution boundaries

| Exit | Meaning |
| --- | --- |
| 0 | Every case was assessed; a complete result with no feasible package is valid |
| 2 | Invalid manifest or case inputs; per-campaign input failures are isolated |
| 3 | An assessment was incomplete or unavailable; no current recommendation |
| 4 | Operational failure, such as inability to write artifacts |

When several outcomes coexist, operational failure takes priority, then
unavailable assessment, then invalid input. Duplicate IDs, unsafe case paths,
and existing or overlapping output locations fail before publication. Fresh
output is published as a directory only after the batch finishes; native
search limits and timeouts remain visible rather than producing partial
recommendations.

The app configuration and complete case determine the calculation. A slot
confirmation is neither authority to act nor completion evidence. Independent
campaigns may reuse the same resource names; passing separately does not prove
that a shared production team, vendor, or budget can serve all campaigns at
once. Neither example books work, obtains external approval, or claims that
production and handoff occurred.
