# Street-team Marketplace walkthrough evidence

The current Street-Team Deployment Review is distributed through **Marketplace → Venue operations → Review a street-team deployment**, version **1.1.0**. The exact workflow package hash is `966b0d13926da6ac0e600599d618b8f06c9b18524aa7db33456d076f570e8583`; its definition hash is `246fb8e7d7d7ea9099d53bd4d4b7977044989776f2d15cfd03f7a652712aa407`.

The workflow and operating model match the previously qualified question-focused release. This folder adds distribution, starter and Excel evidence. Historical `../question-focused/` and `../cli/` files remain unchanged.

## Two different starting points

Installing the workflow starts a private review containing supplied fictional inputs. Every supplied answer awaits review; the proposal and authorization are unanswered. There are no evaluations or accepted reviews. The starter preserves the complete initial case, including seven qualified staff, no callouts, four required inside and a $400 limit.

The separate [article.run.json](article.run.json) continues Sam’s fictional worked case after two callouts. It includes his retained accepted findings, one-person $200 proposal, recorded authorization and history. Importing it is a deliberate operation after installation. Installing or revisiting an install link never substitutes this case for a person’s existing review.

The worked case’s focused answer shows $200 expense, $40 contribution per genuinely additional guest, five guests to cover expense and six to exceed it. These are conditional thresholds, not observed customer response or a measured marketing effect.

## Actual captures

All PNGs are unaltered native element screenshots from the existing production build, operated through ordinary controls:

- `marketplace-details.png`: collection details with the guided workflow, version, included operating app and installation controls.
- `starter-staffing.png`: the fresh staffing answer, visibly prefilled and awaiting review.
- `excel-coverage.png`: immediate Excel availability, its five supported worksheets and retention of out-of-sheet inputs.
- `article-financial-hurdle.png`: the imported article case’s four financial facts and current operating fit.
- `article-financial-comparison.png`: the authored four-column comparison.
- `excel-change-preview.png`: one staffing change awaiting application in the native workbook review dialog.
- `third-callout-financial.png`: the same conditional hurdle after three callouts, with operating fit now No.
- `third-callout-operating-finding.png`: the native reassessed finding, leaving only no further push eligible.

`verification.json` records source and capture hashes, dimensions, exact package identities, checks and retained native exports. `retained/public-marketplace-verification.json` is the independently captured public-site availability and browser verification; its base URL and check time are retained in that receipt. Local capture success alone is not presented as evidence of public availability.

## Excel scope and continuation

The five Excel worksheet names are exactly those authored in the release; Excel’s length limit truncates two of them. The first sheet, **Qualified staffing and evening**, contains **Unavailable qualified staff**. The example edits that cell from two to three, uploads the workbook and previews one change before selecting **Apply inputs**.

Applying the workbook submits the changed staffing answer for review. It does not accept an answer, calculate a finding or authorize a deployment. The capture explicitly accepts the revised answer, reassesses the operating result and accepts that finding. Only holding then meets the recorded requirements, while the earlier proposal and authorization no longer complete the current review.

The entire spending object, including its scoped permission records, remains unchanged. Event access, proposal, authorization and retained earlier findings also remain in the saved case. The outside records are not represented as Excel inputs. The downloaded workbook, the one-cell edited workbook and the resulting native runs are retained in `retained/`.

Changing the inspected deployment between brief and report, and reloading, leaves the entire original article run unchanged. The actual post-inspection export is `retained/article-inspection-only.run.json`. The separately created private starter is also re-exported and verified unchanged after the worked-case journey.

## Reproduction

Run the repository-native capture script with Node 24 and the supplied Decision Lab checkout containing its existing `dist/` build and installed matching packages:

```sh
node scripts/capture-street-team-marketplace.mjs /absolute/path/to/hermod-review-lab
```

The script reads that checkout, serves its build through a temporary local server and uses temporary browser contexts. It writes only this website’s dedicated capture directory. It does not rebuild or modify Decision Lab. Clipboard permission is granted to the temporary local origin solely to verify the actual **Copy install link** control.

The installation query pins `install=workflow`, `id=street-team-deployment`, `version=1.1.0`, `publisher=decision-lab`, `collection=venue-operations` and the exact release hash above. The native copy control retains the current deployment’s address. Repeated links resume existing local work.
