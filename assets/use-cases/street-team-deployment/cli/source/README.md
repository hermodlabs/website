# Street-team deployment

Sam manages a fictional venue with seven qualified staff. Four must remain
inside. He is considering sending one or two people to a nearby event before
its exit window closes. Two callouts change what can run; they do not tell him
whether customers will respond.

This example creates the operating app and its guided workflow from editable
source using the public CLI. It then reviews one night, records Sam's bounded
proposal and authorization, and changes staffing again. There are no hidden
promotion rules in the runner or a custom React screen.

## Run with the matching development packages

Use Node 22.19+ (Node 24 recommended). The example requires the development build
with `ceilDivide`, `floorDivide` and commitment `feasibility-only` support.
Earlier archives also named `0.1.0` may lack them. The checked-in
`qualified-build.json` identifies the exact tested package SHA-256 values;
it does not announce an npm release.

Copy this entire directory to your own project, then install the matching
SDK and CLI archives together:

```sh
npm install /path/to/decision-lab-sdk-0.1.0.tgz /path/to/decision-lab-cli-0.1.0.tgz
node walkthrough.mjs all --accept-fictional-demo
```

The explicit flag simulates the named fictional author, case owners and Sam
after their review records have been supplied. Read those records first. It
does not approve arbitrary files, authenticate anyone or spend money. For real
work, run the recorded commands with the responsible person's actual reviews.

Run stages separately to inspect each handoff:

```sh
node walkthrough.mjs author --accept-fictional-demo
node walkthrough.mjs intake --accept-fictional-demo
node walkthrough.mjs callouts --accept-fictional-demo
node walkthrough.mjs decision --accept-fictional-demo
node walkthrough.mjs changed-staffing --accept-fictional-demo
node walkthrough.mjs verify
```

Each stage writes `.output/STAGE/commands.sh`, its argument/exit-code transcript
and immutable checkpoints. `commands.sh` documents the actual public commands;
its paths refer to files already created. To replay, rerun the stage sequence
with `--output-root /a/fresh/directory`. An existing stage is never silently
replaced. After a failed stage, inspect `commands.json`, correct the source,
and start a fresh output root. A publication failure leaves no installable
package at the rejected destination.

## Files and responsibilities

| File | Meaning |
| --- | --- |
| `source/promotion.model.json` | Module author's operating rules, allowed inputs, business labels and a starting case. |
| `source/workflow.source.json` | Workflow author's questions, roles, exact input/output mappings, conditional financial explanation and completion gates. The runner embeds the CLI-built app as its pinned dependency. |
| `source/binding-reviews.json` | Individual meaning, scope and units reviews tied to exact declaration hashes. Changed, new or removed bindings stop the runner before it applies any fixture review. |
| `source/app.scenarios.json` | Independently authored expectations about complete operating alternatives and failed requirements. |
| `source/workflow.scenarios.json` | End-to-end checks including unknown inputs, contribution boundaries and separate discount losses. Its reviews are explicitly synthetic fixtures. |
| `source/cases/` | Fictional case values, separate from published rules. |
| `walkthrough.mjs`, `case-stages.mjs` | Consumer orchestration through `runCLI`, checkpoints and explicit fictional reviews. They do not implement arithmetic or operating constraints. |
| `verify.mjs` | Checks retained native artifacts and independently expected business outcomes. |

## Read the result

The fixed alternatives are Hold, one-person standard ($200), two-person
standard ($400), and two-person discounted ($400). The initial $400 limit
permits all four. With two callouts, five staff remain available: one promoter
leaves four inside, while two promoters would leave only three.

This first workflow pins its option charges to the app's starting case. Workers
edit staffing, timing, access, spending limits/delegation and economic assumptions.
Changing a quoted option charge requires an authored app/workflow release until
quotes are exposed as reviewed workflow questions.

The app uses **feasibility-only** mode. It reports which complete alternatives
meet the recorded requirements. Hold is not automatically declared best because
it costs nothing. Sam's selected deployment is a separate case answer.

For positive contribution per genuinely additional guest, the workflow computes:

```text
recoverable amount = assessed incremental expense + separate existing-customer discount loss
guests to cover expense = ceilDivide(recoverable amount, contribution per additional guest)
first positive guest count = floorDivide(recoverable amount, contribution per additional guest) + 1
```

All amounts use integer USD cents. The $200 option at $40 contribution needs
five additional guests to cover its expense and six to exceed it. The $400
discounted option at $25 needs sixteen and seventeen. A separate $50 loss on
the $400 standard option makes both thresholds twelve. Sunk costs and discount
loss already included in contribution must not be counted again.

Unknown contribution remains unassessed; nonpositive contribution cannot recover
a positive expense. These cases do not prevent the operating review. Hold has
no promotion threshold. Attributed visits are not necessarily additional visits;
the example supplies no customer forecast, causal marketing estimate or expected
profit calculation.

Sam's proposal and authorization refer to the exact accepted assessment, chosen
deployment, venue, night, amount and time window. Changing staffing makes the
operating result and its proposal basis require reassessment. Earlier answers,
findings and recorded authorization remain in history; the software does not
revoke an external permission or dispatch staff.

Changing contribution or separate discount loss updates the financial explanation.
It does not automatically invalidate Sam's operating-basis choice. The manager
must reconsider that choice when its economic assumptions change.

## Continue in Decision Lab

1. In **Collections**, choose **Import app, workflow or case** and select
   `.output/author/promotion.workflow.json`. This installs the exact CLI package.
2. Import `.output/decision/run.json` separately to continue Sam's reviewed case.
3. Inspect the decision brief, the conditional economics and supporting operating
   findings. Edit staffing, accept the revised answer and reassess; review the new
   finding before supplying a new proposal and authorization.
4. To inspect the authoring work, use **Workspaces → Create workflow → Import
   workflow**, selecting `.output/author/reviewed.workflow-draft.json`. The draft
   retains the author binding reviews; the distribution package does not.

These are separate operations: packaging does not install a workflow, and
importing its package does not import a particular reviewed case.
