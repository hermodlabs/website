# Gift-kit readiness: fictional worked example

This is a first-party Hermod Labs teaching example. The people, 120-kit campaign,
observations, quotes, operating permissions and confirmations are fictional.
It is not a report about a customer, an actual supplier commitment or a completed
gift-kit release.

This one-day adaptation is based on Decision Lab's **Gift-kit Readiness and
Correction 2.0.0** example. The handoff deadline is 1,440 minutes (24 hours), with
corresponding resource, permission and confirmation windows. The sealed template,
correction prices and work durations remain unchanged. The independent website
app and workflow releases do not replace the upstream releases. Their author
configurations, packages and independently authored scenario suites are retained
beside this document. `fixture-manifest.json` records the bytes and SHA-256 of
every generated verification artifact.

## Current presentation

The 18 November 2026 article refresh uses Decision Lab’s decision-focused screens: read the finding and next review task first, then open selected-option details, evidence explanations or the complete report when needed. These screens present the existing calculations; the one-day app/workflow releases, case inputs and original verification artifacts remain unchanged. Capture receipts identify the current local working build and preserve earlier capture history.

The first two stories still distinguish a five-minute minimum from the authored ten-minute minimum. The connected CLI/SDK clients still use their separate fixed five-minute-minimum app with ten minutes planned. Their current shared views do not merge those policies, extend a record’s validity or establish that work occurred. Exact working client source snapshots are identified separately where they are newer than the public sample repository.

## The business problem

A team has 120 gift kits to hand off within one day and a $600 spending limit.
The 24-hour window gives people time to gather records, confirm availability and
agree a correction. It is distinct from the short quoted work sequences below.
Its printed code does not decode on the declared phone; the approved artwork
points to the wrong destination. A separate checkout rehearsal is usable for the
declared account. Those observations do not establish a successful end-to-end
gift journey.

The two complete corrective arrangements are an internal replacement and journey
repair costing $300, reaching handoff at minute 35, and an external replacement
and repair costing $400, reaching handoff at minute 20. These times include
correction, a fresh five-minute scoped rehearsal and a five-minute handoff.
The cost-first and earliest-handoff apps use the same inputs and requirements;
their ranking policies produce different preferred arrangements.

The prepared workflow starter has no external confirmation. `case.shared.json` adds one
explicit fictional positive confirmation to both reviews for the controlled
comparison. That record matches the selected package, batch, insert revision,
destination revision, checkout revision, device and account. It is known at the
current review time, effective when work starts and valid through handoff.
`case.missing-confirmation.json` removes that record. Its absence leaves the
external requirement unestablished while the internal arrangement remains usable.
It does not prove that a supplier would refuse the work.

## The follow-up change

The app author raises the minimum fresh rehearsal from five to ten minutes.
The rule edit preserves the supplied case values. A case still supplying five
minutes supports no complete proposal; supplying ten minutes restores the
internal $300 correction with handoff at minute 40.

`longer-rehearsal` retains the public SDK rule preview, revised app, independent
app scenarios, explicit workflow dependency preview/application and whole-workflow
scenarios. The SDK draft deliberately retains author binding reviews as needing
renewal. Publishing a supporting app by itself never updates an existing workflow
pin. Browser-captured publications, where supplied, are separate artifacts.

## Connected CLI and SDK examples

Two later articles use the separate standalone **Gift-kit Preflight** and
**Gift-kit Handoff Desk** developer clients from the public sample-code repository.
Their native one-day cases GIFT-220 through GIFT-223 and fixed earliest-handoff
app are retained under `preflight/` and `handoff-desk/`. They are not adaptations
of the guided workflow artifacts described above.

Both clients share the exact same app and generated canonical inputs. Those
inputs plan ten minutes of rehearsal while the published minimum stays five.
The early cases prefer external work at $400/T+25 min when confirmed, or in-house
work at $300/T+40 min with an old insert confirmation. At T+23 hr, expired records
block the work; a separate case explicitly supplies current production
availability, permissions and confirmation and supports external handoff at
T+23 hr 25 min, with 35 min before the T+24 hr cutoff.

Unlike the first two website examples, these clients use the repository's native
one-day inputs without website-only extensions to availability, permission or
confirmation windows. A longer cutoff preserves existing intervals. Their
verification records identify the actual CLI report, complete exported cases,
React file imports and calculations. The exported case transfers recorded inputs,
not an accepted approval, diagnosis or completed-work record.

## What the original guided example establishes

There are 60 authored scenarios: 15 native app scenarios and 13 complete
workflow scenarios for each one-day policy, plus two native and two workflow
scenarios for the longer-rehearsal change. They cover missing, incorrect, late,
negative and expired confirmations, and preserve cost, time, permission,
capacity and rehearsal conditions. Whole-workflow tests also check missing
answers and the proposed next action.

A delayed-review scenario for each policy starts work 12 hours into the one-day
window. Internal correction then reaches handoff at minute 755, while confirmed
external correction reaches handoff at minute 740. Both still meet the
1,440-minute deadline, exercising the full-day availability and permission windows.

Full workflow calculations are retained as compressed `.json.gz` files. They can
be decompressed with standard gzip tools. Expected values were declared by the
example author; the runner calculates its actual answers independently. Synthetic
fixture reviews are test inputs and accept no live case.

The bounded model admits three declared faults and five complete correction
packages. It assumes the stated correction effects and one recorded person and
production resource performing correction, fresh rehearsal and handoff in that
order. It does not invent new diagnoses or synthesize an unlisted sequence of
partial repairs. A feasible proposal is conditional on accepted records and
assumptions. It does not establish actual repair, a passing fresh rehearsal,
external booking, operational permission or completed handoff.

The website repository reproduces the results with
`node scripts/build-gifting-use-case.mjs` and verifies retained artifacts with
`node scripts/check-gifting-use-case.mjs`. Reproduction uses a compatible local
Decision Lab SDK checkout, read-only, and writes only this website's assets.

## Question-focused report refresh

`question-focused/verification.json` records a presentation-only refresh through
normal file imports, visible inspection/navigation controls and native exports.
It checks the exact retained workflow hash before and after presentation changes,
records current production bundle hashes and retains desktop/mobile browser checks.
`node scripts/capture-gifting-question-focused.mjs` reproduces the captures using
the current native production build and an isolated copy of the current gifting
React sample built against the matching SDK and React-view packages.

The v2 teaching cases, separately adapted ten-minute-minimum authoring cases and
v3 cost-first operating cases preserve their original app/workflow definitions.
The v3 plan supplies ten minutes of rehearsal under its unchanged five-minute
minimum. None is silently migrated to a newly authored question-view release.
The current shared `DecisionView` presents their focused finding, comparison and
on-request details; full findings, sources and native histories remain available.
Earlier captures and their provenance remain retained at their original paths.
