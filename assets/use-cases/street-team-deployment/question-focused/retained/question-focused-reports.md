# Organize workflow reports around questions

A workflow can retain a complete finding without showing every field at once.
Use an authored question view to give one item a focused answer, a compact
comparison, and grouped supporting details. The SDK materializes these
projections in `WorkflowOutput.questionViews`; the optional React package renders
them with `QuestionView`.

This capability belongs to the current development candidate. Use matching SDK
and React-view package archives qualified for the example. A version string
alone does not distinguish older `0.1.0` candidates that predate question views.

## Give each part a purpose

| Part | Purpose | Promotion example | Shipment example |
| --- | --- | --- | --- |
| Question | State what the view answers | What would this deployment need to recover? | Which complete arrangements meet this delivery commitment? |
| Focused summary | Show the few facts needed to understand one item | $200 expense, $40 contribution, 5 guests to cover, 6 to exceed | Complete expense, receipt deadline, reservation cutoff |
| Context | Keep material qualifications visible beside the answer | Operating fit, threshold status, separate discount loss | Operating fit and unmet conditions |
| Comparison | Expose relevant differences between all supplied items | Deployment, expense, two guest thresholds | Arrangement, operating fit, expense, blockers |
| Grouped details | Explain the inspected item's assumptions and basis | Contribution and separate losses; calculation and basis | Delivery by possible situation; shipment and timing basis |

Four summary facts and a comparison of approximately four columns often suffice.
These are design recommendations, not business rules. Different templates can
ask different questions and supply different detail groups. A shipping view does
not need a promotion's expense-recovery section.

Inspecting an item is separate from choosing or authorizing it. Clicking a row
changes only presentation state. It records no answer, review, preference,
spending permission or operational action.

## Declare a projection in the workflow

The following JSON is a `metadata.presentation.report` fragment. It assumes the
workflow already has a `guest-thresholds` brief section whose value is an array
of calculated records. The view does not calculate those records.

```json
{
  "questionViews": [
    {
      "id": "expense-recovery",
      "sectionId": "guest-thresholds",
      "title": "Expense recovery",
      "question": "What would this deployment need to recover?",
      "selection": {
        "group": "deployment",
        "keyField": "deployment",
        "labelField": "deployment",
        "defaultKey": "small-standard"
      },
      "summary": {
        "title": "The financial hurdle",
        "fields": [
          { "key": "expenseMinor", "label": "Additional expense", "format": { "type": "money", "currency": "USD", "scale": 100 } },
          { "key": "contributionMinor", "label": "Contribution per additional guest", "format": { "type": "money", "currency": "USD", "scale": 100 } },
          { "key": "breakEvenGuests", "label": "Guests needed to cover expense", "format": "number" },
          { "key": "firstPositiveGuests", "label": "First count exceeding expense", "format": "number" }
        ]
      },
      "contextFields": [
        { "key": "feasible", "label": "Meets operating requirements", "format": "boolean" },
        { "key": "status", "label": "Threshold status", "format": "name" },
        { "key": "existingCustomerDiscountLossMinor", "label": "Separate existing-customer discount loss", "format": { "type": "money", "currency": "USD", "scale": 100 } }
      ],
      "comparison": {
        "title": "Compare financial hurdles",
        "columns": [
          { "key": "deployment", "label": "Deployment", "format": "name" },
          { "key": "expenseMinor", "label": "Additional expense", "format": { "type": "money", "currency": "USD", "scale": 100 } },
          { "key": "breakEvenGuests", "label": "Guests to cover", "format": "number" },
          { "key": "firstPositiveGuests", "label": "First count exceeding", "format": "number" }
        ]
      },
      "details": [
        {
          "id": "assumptions",
          "title": "Contribution and separate losses",
          "question": "Which reviewed assumptions make this hurdle applicable?",
          "fields": [
            { "key": "recoverableAmountMinor", "label": "Total amount to recover", "format": { "type": "money", "currency": "USD", "scale": 100 } },
            { "key": "meaning", "label": "What these thresholds mean" }
          ]
        }
      ]
    }
  ],
  "tabs": [
    {
      "id": "financial",
      "kind": "records",
      "label": "Expense recovery",
      "sectionId": "guest-thresholds",
      "viewId": "expense-recovery"
    }
  ]
}
```

`sectionId` names the existing brief section. `rowsPath`, when present, selects
an array inside that section's value; omit it for a top-level array. Fields use
safe dotted paths such as `schedule.arrivalMinute`. Paths traverse own data
properties; they cannot inspect prototypes or evaluate expressions.

`selection.group` identifies shared inspection state across related views.
Views in one group must declare the same `keyField`, `labelField` and
`defaultKey`, including whether a default exists. Keys must be unique nonempty
strings or finite numbers; labels must be nonempty strings or finite numbers.
The current contract also rejects a numeric key and an equivalent text key in
the same list, such as `1` and `"1"`.

`defaultKey` is an author's explicit starting inspection, not an SDK
recommendation. Omit it to start with no inspected item. Never substitute the
first, cheapest or feasible record when an inspected item disappears.

The brief and report tab reference the same view through its section and
`viewId`. There is no second financial projection to maintain. Existing record
tabs without a question view continue to use their authored columns.

Formats match `RecordsView`: `text`, `number`, `boolean`, `money`, `time`,
`duration`, `percent`, `probability`, `name`, and `label`. Format objects can
declare `currency`, positive `scale`, `unit`, and `origin`. Business names,
roles, labels and units can also come from `metadata.presentation.display` and
`report.units`/`report.labels`. Declared `display.nameSources` read names only
from accepted answers. The SDK includes the resulting `displayContext` in the
materialized view, so consumers need no private label lookups.

## Render exclusively from SDK or CLI output

Obtain the complete portable output through the existing public interface:

```js
const output = lab.workflows.output({ run });
```

Or use the corresponding CLI command:

```sh
decision-lab workflow inspect --run review.run.json --output review.output.json
```

Use `inspect` for the complete `WorkflowOutput`; `workflow brief` exports only
its brief section. `questionViews` contains the view definitions, availability issues, display
context and projected rows. Each row has `{ key, label, record }`. `record`
retains the selected fields in their nested shape, including fields used by
detail groups. The original `brief.sections`, app assessments, full reports and
review history remain available in the same output.

The following React component consumes that output without an executor,
workflow definition, business calculation or domain-specific component:

```jsx
import { useState } from 'react';
import { QuestionView } from '@decision-lab/react-views';
import '@decision-lab/react-views/styles.css';

function ReviewQuestions({ output }) {
  const [inspections, setInspections] = useState({});
  const views = output.questionViews || [];
  if (!views.length) return <p>This workflow has no authored question views.</p>;

  return views.map(view => {
    const group = view.selection.group;
    const inspectionKey = Object.hasOwn(inspections, group)
      ? inspections[group]
      : view.selection.defaultKey ?? null;

    return <QuestionView key={view.id} view={view}
      inspectionKey={inspectionKey}
      onInspectionChange={key => setInspections(previous => ({
        ...previous, [group]: key,
      }))} />;
  });
}

export function WorkflowReview({ output }) {
  // Keep selections through revisions of this case, but start a new inspection
  // state when opening another run or workflow definition.
  return <ReviewQuestions
    key={`${output.identity.runId}:${output.identity.definitionHash}`}
    output={output} />;
}
```

The selector, summary, comparison and details stay synchronized through one
inspection key. If a later result no longer contains that key, `QuestionView`
displays that loss and asks for a current item. It retains no earlier item's
summary under a new result. A click does not mutate the supplied output.

## Keep missing information and limits visible

Missing projected fields become `null`; existing `null`, `false` and `0` remain
distinct. A missing field is not a zero expense, a failed requirement or an
observed guest count. Unknown contribution therefore remains unavailable rather
than becoming a zero-guest threshold.

A missing or duplicate item key, missing label, unavailable source array, or
display-bound violation produces a view with `status: "unavailable"`, no rows,
and explicit issues. It does not silently fall back to an unfiltered table or
change the workflow's completion finding. An empty current array is a valid,
empty view. Authoring errors such as unsafe paths, unknown section references,
unsupported formats or inconsistent inspection groups reject create/import.

The contract supports at most 16 question views, six summary fields, eight
comparison columns, 16 context fields, and eight detail groups with 16 fields
each. Each materialized view is bounded to 4,096 rows, 2 MiB and 100,000 portable
nodes. Complete findings remain in SDK output when a display bound is exceeded.

Keep calculations and business eligibility in the app or workflow expressions.
View metadata selects paths, labels and formats; it accepts no predicates,
formulas, finding overrides or custom JavaScript. Adding a field to the full
SDK result does not automatically create another visible column.

See the [promotion walkthrough](build-a-promotion-workflow.md) and
[first-shipment walkthrough](review-a-first-shipment.md) for worked business
inputs. [Reusable React report views](react-report-views.md) cover complete
native assessments and lower-level record tables.
