# Promotion question-focused reports

The three active nightlife articles use the current authored promotion reports. Earlier `../cli/` source snapshots, screenshots and qualifications remain unchanged as historical evidence; they do not identify the current UI.

The operating model is unchanged. The supplied workflow is version **1.1.0**, definition `246fb8e7d7d7ea9099d53bd4d4b7977044989776f2d15cfd03f7a652712aa407`, package `966b0d13926da6ac0e600599d618b8f06c9b18524aa7db33456d076f570e8583`. The retained qualification names exact development archives, because a shared `0.1.0` package label does not identify a particular build.

## What the articles show

- The expense-recovery answer starts with $200 additional expense, $40 contribution per genuinely additional guest, five guests to cover expense and six to exceed it.
- The compact comparison has four authored columns. Operating eligibility stays visible with the inspected answer; a financial threshold does not establish operating feasibility or forecast response.
- Contribution assumptions and calculation basis are expandable. Complete findings remain available through deliberate inspection and the full SDK/CLI output.
- Brief and report inspection stay synchronized. Inspection changes no case answers, reviews, choice or authorization.
- The current authored choice fields retain the decision and authorization without automatically displaying every SDK field.
- With two callouts, holding and one promoter remain feasible. With three, only holding remains feasible and the former proposal no longer completes the current review.

## Captures and retained evidence

`provenance.json` records hashes, dimensions, origins and source receipts for every capture. `snapshot-files.json` identifies the byte-exact source files copied from the supplied working repository.

Three images are byte-exact copies of newly verified production browser captures supplied with the implementation:

- `promotion-guest-thresholds.png`: native focused financial answer, 537 × 447.
- `promotion-decision-brief.png`: completed authored decision brief.
- `promotion-third-callout.png`: decision brief after staffing reassessment.

Their original receipt is retained at `retained/browser-qualification.json`, with the exact workflow package and screenshot hashes.

`capture.mjs` imports the current package and both retained cases through the visible Collections import button. It captures the native four-column financial comparison and operating findings; no DOM, text, style or application state is injected. It also changes the inspected deployment between the brief and Expense recovery report, reloads, and exports the run. Equality against the original JSON verifies that inspection preserves the entire run, including Sam’s choice and authorization. The actual post-inspection export is retained at `retained/decision/inspection-only-export.run.json`; its receipt is `browser-qualification.json`.

The comparison and financial answers use a 1512-pixel browser viewport. The operating findings use a normal browser resize to 720 pixels so the native cards remain legible in article comparison panels. All are unaltered native element screenshots.

Reproduce from this directory with Node 24 and the supplied working repository:

```sh
node capture.mjs /absolute/path/to/hermod-review-lab
```

This starts a temporary server for the repository’s existing `dist/` build and a temporary browser profile. It reads the working repository and writes only into this capture directory. It does not rebuild or edit Decision Lab.

## Learning-story scope

`learning-bridge.svg` is an original explanation of the proposed next learning process, not a screenshot. The third article resolves a learning brief: spending decision, comparison, business measure and operating boundaries. Assignment, duration, total learning budget and analysis still require design and approval. The current promotion app does not assign experimental conditions, estimate a marketing effect or establish a winning promotion.

The current public implementation is linked at <https://github.com/hermodlabs/sample_code/tree/main/nightlife/street-team-deployment>. These captures qualify the supplied local artifacts; this refresh does not assert byte equivalence to a particular public commit.
