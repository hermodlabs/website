# Promotion workflow implementation and business-story captures

This directory retains the technical implementation behind Sam's fictional business-focused promotion stories. It contains a complete portable source example, retained authored files and real Decision Lab screenshots. The public stories focus on operating choices, shared review responsibilities and changed circumstances; complete workflow authoring remains available in the linked repository.

## Source and build qualification

`source/` is a byte-for-byte copy of the working example at `sample_code/nightlife/street-team-deployment/` in the Decision Lab source checkout. It includes the model, workflow definition, individual binding-review fixtures, operating and workflow scenario suites, case inputs, staged CLI runner and verification script. The same files are available as `street-team-deployment-source.zip`; its top-level directory is `street-team-deployment/`.

The public source is [hermodlabs/sample_code/nightlife/street-team-deployment](https://github.com/hermodlabs/sample_code/tree/main/nightlife/street-team-deployment).

The example requires matching beta SDK and CLI archives. `source/qualified-build.json` records the tested archive hashes, not merely their `0.1.0` labels. Older archives with the same version may lack safe rounding, feasibility-only assessment or reviewed workflow authoring. No npm archives, installed dependencies or local runtime output are redistributed here.

The original instructions remain in `source/README.md`. The reviewed guide is retained in `retained/developer-walkthrough.md`; its upstream relative documentation links refer to the Decision Lab documentation checkout.

## Screenshots

The following captures were copied unchanged from the supplied, verified browser continuation in `artifacts/promotion/consumer/`. They were not newly captured for this article:

| File | Size | State shown |
| --- | --- | --- |
| `promotion-decision-brief.png` | 1208 × 841 | Sam's current one-person proposal and specific authorization, with the review complete. |
| `promotion-guest-thresholds.png` | 1158 × 672 | Expanded conditional guest thresholds. The one-person deployment needs five additional guests to cover $200 at $40 contribution; six produce a positive contribution after that expense. |
| `promotion-third-callout.png` | 1208 × 1131 | After a third callout and reassessment, the earlier choice and authorization no longer support the current decision. A fresh choice is required. |

The screenshot receipt is `retained/browser-qualification.json`. `provenance.json` records their source paths, hashes and dimensions. The original same-build check verifies the installed workflow, accepted CLI case, form-based staffing change, reassessment and reload. A collapsed “Feasible Deployments (1)” panel does not by itself show the remaining deployment's name; the retained revised output establishes that it is `hold`.

`promotion-author-reviewed.png` (1208 × 715) is an additional capture made for this article from the real local Decision Lab production build. It shows **Ready to publish**, all 13 current bindings reviewed, and the immutable-release export controls. The capture script imports the retained authoring draft through the normal UI, exports the workflow package and checks that it equals the retained CLI-authored package. It does not inject application state. `capture-author.mjs` and `retained/author-browser-qualification.json` retain the procedure and result.

### Matched business comparison

`promotion-five-staff-options.png` and `promotion-four-staff-options.png` are new 451 × 211 native operating-finding screenshots. They were captured at the same 720 × 1100 viewport after importing the retained complete workflow and then each retained case through Collections in a fresh browser context. The **Operating findings → Inspect result** controls open the current assessment. Only the unaltered native **Decision finding** card is captured; no DOM, text, style or application-state injection is used.

The first finding shows two fully checked options with two callouts: Hold and the one-person push. The second shows one fully checked option after the third callout: Hold. Those action names come from the retained assessment, while the screenshots themselves deliberately show the concise count and the rule that Sam chooses among eligible deployments. Neither image represents an automatic recommendation, Sam's final choice, or the complete workflow decision brief. The full decision brief images above remain available for context.

`capture-business.mjs` retains the repeatable procedure. `retained/business-browser-qualification.json` records input hashes, workflow identity, exact native text, screenshot hashes and the successful browser checks. The comparison table itself scrolls horizontally at this viewport; it is excluded rather than clipped into a misleading fragment.

## Retained authored files

- `retained/author/promotion.workflow.json`: runnable workflow package and pinned operating app; import this through **Collections → Import app, workflow or case file**.
- `retained/author/reviewed.workflow-draft.json`: editable authoring draft, including the reviewed declarations and check evidence; import through **Workspaces → Create workflow → Import workflow**.
- `retained/decision/run.json`: accepted fictional CLI review with Sam's one-person choice and scoped authorization; import separately to continue that case.
- `retained/changed-staffing/run.json`: retained CLI case after the third callout and reassessment. The browser qualification performs the equivalent change through the actual form and retains its own run hash.
- `retained/decision/complete.output.json` and `retained/changed-staffing/accepted.output.json`: full prepared outputs used to check the business findings.
- `retained/author/commands.sh`, `retained/decision/commands.sh` and `retained/changed-staffing/commands.sh`: exact recorded CLI invocations. Their arguments refer to generated checkpoint files in the qualification project. They are audit records, not clean-room scripts to paste into another directory.
- `retained/verification.md`, `retained/qualification.json`, `retained/browser-qualification.json` and `retained/qualified-archives.json`: retained scope and build evidence.

## Meaning and limits

The example implements an operating review, conditional financial thresholds, a human choice and a separately scoped authorization. The operating app is feasibility-only: it keeps viable deployments available rather than automatically preferring the zero-cost option. It does not predict turnout, estimate causal marketing effects, authenticate people, spend money or deploy staff.

The complete financial calculations use integer USD cents. Deployment charges are fixed in this app release; case questions expose staffing, timing, access, spending and contribution assumptions. Changing a deployment charge requires another authored release. Changing contribution or separate discount loss updates the financial thresholds but does not automatically invalidate the operating-basis choice; Sam must reconsider that choice.

The model assumes qualified people available for the whole same-day absence. It does not represent individual stations, breaks, overnight operations or competing staff assignments. Fictional review fixtures demonstrate the review gates and are not real permissions or verified business records.

The retained verification report distinguishes the passing promotion checks from seven reproduced pre-existing foundation failures. It is not a claim that every repository test passed.
