# Sample code

Standalone applications organized by domain demonstrate the public Decision Lab
CLI, SDK and reusable views. Each carries its integration code, exact app or
workflow configuration, fictional inputs, tests and setup instructions. Copy an
individual application and install the documented packages to run it independently.

| Domain | Sample | Purpose |
| --- | --- | --- |
| [Shipping](shipping/README.md) | [Shipment exceptions](shipping/shipment-exceptions/README.md), CLI | Screen changed shipment records and booking windows, then export a continuing analysis with its source basis. |
| Shipping | [Shipment Reservation Desk](shipping/shipment-reservation-desk/README.md), React SDK | Resolve one exception, calculate the available arrangements, and separately record a choice and external reservation or delivery. |
| Shipping | [Readiness learning](shipping/readiness-learning/README.md), Python ML and SDK | Train on fictional data, inspect proposed probability estimates, and calculate whether a timely registration check improves the choice. |
| [Gifting](gifting/README.md) | [Gift-kit Preflight](gifting/gift-kit-preflight/README.md), CLI | Identify campaigns needing intervention and export their portable analyses. |
| Gifting | [Gift-kit Handoff Desk](gifting/gift-kit-handoff-desk/README.md), React SDK | Continue an exact campaign through scoped diagnosis, complete correction planning and actual event records. |
| [Nightlife](nightlife/README.md) | [Street-team deployment](nightlife/street-team-deployment/README.md), CLI authoring | Build and test operating rules and a workflow, then explain the conditional guest hurdle. |
| Hospitality | [Roster repair](hospitality/roster-repair/README.md), CLI and SDK authoring | Compile a roster profile, compare complete repairs and switch priorities while keeping the same operating facts. |

The original [restaurant roster-repair article example](https://www.hermodlabs.com/use-cases/hospitality/restaurant-roster-repair/index.html)
retains its own packages with the public website. The new roster workflow is
available in the Restaurant operations Marketplace collection.

## Calculate and continue a case

Current JavaScript shipping clients use operational workflow **2.0.0**. Current
gifting clients use **4.0.0** around unchanged version-3 cost-first operating
apps. Apply the current facts, then Calculate/Recalculate. Supplied valid inputs
and current complete findings need no reviewer name or analytical signoff.

The SDK supplies the concise Decision summary, exact-option Supporting reports,
Decision process and Calculation dependencies. CLI and React exchange the
ordinary `decision-lab-workflow-run/1` artifact. They retain exact definitions,
source receipts, earlier calculations and stale dependencies instead of silently
starting a different case. Inspecting an alternative does not select it.

Historical shipping 1.0.0 and gifting 3.0.0 reviewed definitions remain only for
exact-version imports and retained teaching exercises. They keep their original
contract. A new calculation from old inputs creates a new run and copies no
operating authorization or completed-work records.

Operating selection, sourced authority, reservation, correction, rehearsal and
handoff are separate domain records. A calculation does not perform the work or
authenticate an external source. See the [shared integration notes](shared/README.md).

## Run and verify

Use Node **22.19.0+**; Node **24** is recommended. Root development commands build
the linked workspace packages first. Individual READMEs explain normal package
installation outside this checkout.

```sh
npm run demo:shipment:cli
npm run dev:shipment:react
npm run demo:gifting:cli
npm run dev:gifting:react
npm run test:cli-apps
npm run test:gifting:clients
npm run check:samples:journeys
npm run test:samples:journeys
```

The React samples also have `test:shipment:react` and `test:gifting:react` suites;
append `:browser` for their production browser checks. The current integration
definitions are maintained under `product/use-cases/*/integrations`. Fixture
synchronization verifies standalone copies without adding runtime dependencies
between samples.

The Python ML sample requires Python **3.10+**, the matching local `decision-lab`
wheel, and its separately declared ML dependencies. The qualified platform wheel
bundles Node and the SDK/CLI runtime; installed execution needs no system Node or
npm. Follow the sample's training, estimate-inspection and calculation commands.
The old standalone Python shipment/gifting continuation clients are retired.

For core Python development, `npm run test:python` checks the bridge and client.
Qualify a prepared wheel with its actual path:

```sh
npm run check:python:wheel -- --wheel /absolute/path/to/decision_lab-0.1.0-NATIVE.whl
```

## Package boundaries

CLI samples call the public `runCLI` entry point. Their integration code handles
external records, orchestration and presentation; the CLI evaluates the pinned
rules. React samples use ordinary hooks and public SDK imports. They contain no
business-rule copy or imports from the Decision Lab UI.

The SDK, CLI and React views remain local **0.1.0** release candidates unless
release documentation says otherwise. Matching archives can be installed before
registry publication. See the [developer documentation](../decision-lab-developer-docs/README.md)
for public contracts and complete report output.
