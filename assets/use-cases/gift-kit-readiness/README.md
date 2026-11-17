# Gift-kit readiness: fictional worked example

This is a first-party Hermod Labs teaching example. The people, 120-kit campaign,
observations, quotes, operating permissions and confirmations are fictional.
It is not a report about a customer, an actual supplier commitment or a completed
gift-kit release.

The source is Decision Lab's **Gift-kit Readiness and Correction 2.0.0** example.
The sealed template, two author configurations, exact app/workflow releases and
independently authored scenario suites are retained beside this document. The
`standard` and `earliest` directories preserve their source release bytes; their
`manifest.json` files record the original source hashes. `fixture-manifest.json`
records the bytes and SHA-256 of every generated verification artifact.

## The business problem

A team has 120 gift kits to hand off within 60 minutes and a $600 spending limit.
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

The published starter has no external confirmation. `case.shared.json` adds one
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

## What the example establishes

There are 58 passing authored scenarios: 15 native app scenarios and 12 complete
workflow scenarios for each original policy, plus two native and two workflow
scenarios for the longer-rehearsal change. They cover missing, incorrect, late,
negative and expired confirmations, and preserve cost, time, permission,
capacity and rehearsal conditions. Whole-workflow tests also check missing
answers and the proposed next action.

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
