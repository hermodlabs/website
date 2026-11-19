# Try the street-team workflow in Decision Lab

The **Venue operations** marketplace collection contains **Review a street-team
deployment**, version **1.1.0**. It installs the same CLI-authored workflow and
pinned operating app used by the [developer walkthrough](build-a-promotion-workflow.md).
The UI renders the workflow's questions and prepared reports; it adds no
promotion rules.

There are two distinct starting points:

| Starting point | What opens |
| --- | --- |
| Install the workflow and select **Start review** for a new review | Prefilled fictional inputs awaiting review, with no calculated assessment, chosen deployment or authorization. |
| Import the separate `article.run.json` worked case | Sam's retained fictional review after two callouts, with its accepted assessment, one-person proposal, recorded authorization and history. |

Installing a workflow does not accept its inputs or import Sam's decision.

## Install and start your own review

1. Open **Marketplace** and search for **street-team** or **Venue operations**.
2. Open the **Venue operations** collection card. The entry is labeled
   **Guided workflow** and lists its included operating app.
3. Select **Install collection**. The collection appears in **Collections**.
4. Select **Start review** on **Review a street-team deployment**.

The initial brief says the review is in progress. Review the supplied staffing,
timing, access, spending and contribution assumptions for the night under
consideration. The workflow asks for the responsible role when accepting an
answer or assessment. A completed calculation still needs explicit review;
choosing a deployment and recording its scoped authorization are separate steps.

The starting model has seven qualified staff, four required inside, a $400
expense limit and four mutually exclusive alternatives: no further push, a
one-person standard push, a two-person standard push, or a two-person discounted
push. Those are teaching inputs, not facts about a real venue.

## Share an exact installation link

In the marketplace collection details, use **Copy install link for Review a
street-team deployment**. The generated URL keeps your Decision Lab deployment's
address and pins these values:

```text
install=workflow
id=street-team-deployment
version=1.1.0
publisher=decision-lab
collection=venue-operations
release=966b0d13926da6ac0e600599d618b8f06c9b18524aa7db33456d076f570e8583
```

Opening that link in a fresh browser installs the exact collection and opens an
unreviewed starter. Revisiting it resumes existing local work; it does not
replace a case with the article's completed example. Links use the host's
configured marketplace. They do not select a remote feed or transmit case data.

## Continue the article's fictional worked case

The distribution supplies a separate native workflow run at:

```text
app-configs/examples/street-team-deployment/1.1.0/article.run.json
```

Resolve that path relative to the Decision Lab installation, download the file,
and use **Collections → Import app, workflow or case**. Keep the exact workflow
installed first so its Excel interface is available. Importing this file
continues its retained review rather than creating a new unreviewed night.

The decision brief leads with **Expense recovery** for the one-person standard
push:

| Financial hurdle | Recorded amount |
| --- | ---: |
| Additional expense | $200 |
| Contribution per genuinely additional guest | $40 |
| Guests needed to cover expense | 5 |
| First count exceeding expense | 6 |

Open **Compare financial hurdles** for the compact comparison, or expand the
assumptions and calculation. Changing **Item to inspect** stays synchronized
between the brief and the **Expense recovery** report. Inspection does not
change Sam's recorded choice or authorization.

Two callouts leave five available staff. The one-person push leaves four inside;
the two-person alternatives fail that operating requirement. The financial
hurdle is conditional arithmetic. It does not predict five additional guests,
establish a causal promotion effect or show that the promotion was profitable.

## Use Excel without losing the other inputs

**Download Excel** is available immediately and contains prefilled values from
the current review. **What you can edit in Excel** lists its five supported
worksheets. They cover the declared scalar staffing, timing, spending-limit,
contribution and separate-loss inputs.

Access and spending-delegation records, Sam's proposed deployment and his scoped
authorization remain in the normal input controls. The workbook does not contain
every workflow answer. Inputs outside its sheets stay in the saved case when
Excel changes are applied. Uploading a workbook previews changes and validation
issues before the user applies them.

## Change the staffing and reassess

In the worked case, change **Unavailable qualified staff** from two to three
through the staffing form, then accept the revised answer. The previous finding
and the choice based on it require reassessment. Recalculate and review the
operating result: only **Make no further push** meets the recorded conditions.

The earlier answers, assessment, proposal and authorization remain in history.
They no longer establish a current deployment decision. The software does not
revoke an external permission, dispatch staff or authenticate a reviewer.

For editable rules, explicit author binding reviews, scenario checks and CLI
commands, continue with [Build a complete promotion workflow](build-a-promotion-workflow.md).
