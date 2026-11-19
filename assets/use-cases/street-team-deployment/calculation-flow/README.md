# Street-team calculation workflow

These captures show **Plan a street-team deployment 1.3.0**, a calculation-mode
workflow in the current local production build `db713f03462e3e776b6e`.
They do not claim that this build or release is already publicly deployed.
`build-verification.json` identifies the frozen production preview, source commit,
manifest assets and startup settings. The capture procedure independently checks
the preview runtime and settings hashes before opening Chrome.

The three articles use different parts of one fictional business situation:

- Five qualified staff available: holding and the one-person promotion meet the
  operating requirements. The one-person plan costs $200; at $40 contribution per
  genuinely additional guest, five break even and six exceed break-even.
- A third callout leaves four available: applying the input makes the earlier
  result stale. Recalculate leaves only holding feasible.
- The financial supporting report keeps the same five-staff inputs and compares
  conditional guest targets. It supplies no customer-response forecast or
  experimental effect estimate.

The procedure is `scripts/capture-street-team-calculation-flow.mjs`. It uses
ordinary Marketplace installation, native Forms edits and Apply inputs,
Calculate/Recalculate, report navigation and native exports. It injects no DOM,
CSS, results or application state. Excel begins collapsed and is optional.

`verification.json` records image dimensions and hashes, source packages, native
exports and browser assertions. The calculation runs contain no review records.
No reviewer identity, acting-role selector, answer-state selector or acceptance
button is used. `retained/pending-draft.run.json` is identical to the saved
five-staff run: navigation and switching Forms/YAML apply nothing. Between the
current five-staff and four-staff runs, only the unavailable staffing count
changes; the pinned definition and every other case fact remain unchanged.

Alex is the fictional editorial name. The sample retains identifiers and labels
using Sam. The current workflow calculates operating fit and break-even targets;
it has no deployment-choice or specific-authorization input. The venue's people
make and communicate those commitments through their actual operating process.
No deployment, authority, customer response or measured business return is
established by these captures.

Earlier Marketplace, reviewed-case and input/report-navigation artifacts remain
archived unchanged. They describe their own releases and capture procedures.
