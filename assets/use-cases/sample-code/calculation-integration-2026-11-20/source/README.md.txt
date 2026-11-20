# Sample code

Standalone applications organized by domain, demonstrating the public Decision Lab CLI and SDK.
Each sample includes its own integration code, pinned app configuration,
fictional inputs, tests and setup instructions. Copy an individual application
into another repository and install the documented packages to use it independently.

| Domain | Node CLI integration | Python integration | React team interface |
| --- | --- | --- | --- |
| [Shipping](shipping/README.md) | [Shipment exceptions](shipping/shipment-exceptions/README.md) screens changed records and booking windows, then exports a continuing review with its source basis. | [Python shipment review](shipping/shipment-review/README.md) compares pinned shipment snapshots and booking cutoffs, retaining native findings and unreviewed workflows. | [Shipment Reservation Desk](shipping/shipment-reservation-desk/README.md) resolves one exception, records a chosen response and external booking, and preserves the review history. |
| [Gifting](gifting/README.md) | [Gift-kit Preflight](gifting/gift-kit-preflight/README.md) identifies campaigns needing intervention and exports portable reviews. | [Python gift-kit workflow](gifting/gift-kit-review/README.md) continues scoped evidence and planning through explicit input and finding reviews. | [Gift-kit Handoff Desk](gifting/gift-kit-handoff-desk/README.md) connects scoped diagnosis and cost-first planning to actual correction, rehearsal and handoff records. |

Each domain keeps its Node, Python and React projects together. The domain README explains
how their batch and individual-review steps relate and lists the commands to run
them from the repository root.

The [nightlife promotion workflow](nightlife/README.md) demonstrates a different
integration: author the operating app and workflow from source, check the
business scenarios, package it, and continue a reviewed case in Decision Lab.
Its feasibility-only assessment leaves the deployment choice to the manager.

The separate [shipment readiness learning app](shipping/readiness-learning/README.md)
uses Python machine learning to propose reviewed probability estimates, then
asks the SDK whether a timely registration check is worth buying. Its optional
ML dependencies and generated teaching data remain within that sample.

Run `npm run test:cli-apps` for both CLI samples. The React samples have
`npm run test:shipment:react` and `npm run test:gifting:react`; append `:browser`
to run their production browser checks. `npm run test:gifting:clients` verifies
the gifting CLI-to-React file handoff and agreement between the results.

The Node CLI and React clients use Node.js 22.19 or later; Node.js 24 is
recommended. Their root commands build the local workspace packages before
starting each sample. The individual READMEs explain installation with package
archives for use outside this checkout.

The Python clients use Python 3.10 or later and the local `decision-lab` 0.1.0
platform wheel, which bundles the matching SDK/CLI and Node runtime. The
currently qualified wheel targets macOS ARM64 and has not been published to
PyPI. Installed execution needs no system Node/npm or runtime downloads;
editable development can use an explicit Node override. Each Python README
documents both installation paths.

The CLI samples call `runCLI` from `@decision-lab/cli`, the public command entry
point used by the `decision-lab` executable. It accepts the same argument array
and returns an exit code without terminating the host process. CLI application
code handles external data, orchestration and report presentation; the CLI
evaluates the pinned rules.

The React samples use ordinary components and hooks with `@decision-lab/sdk`
and the shared decision views. Their forms and labels serve a team's task;
their immutable app configurations supply the requirements and preferences.
They do not depend on Decision Lab's React interface or import SDK source files.

The current journeys use native `decision-lab-workflow-run/1` files across the
CLI and browser. Imported records await explicit review. Assessment time is a
business input; operation timestamps and externally received completion records
remain separate. An unchanged accepted review can be reopened without repeating
the operating action. The [shared integration notes](shared/README.md) explain
how the four standalone copies use the same workflow and persistence helpers.
Run `npm run check:samples:journeys` to check those copies and
`npm run test:samples:journeys` for continuation, review, clock and save conflicts.

Importers and renderers must preserve calculated findings and the scope of
supporting records. A changed business requirement belongs in a reviewed app
release. A recommendation does not accept a review or grant operating permission.

The current SDK, CLI and React views packages are local `0.1.0` release
candidates; this repository does not imply that those versions are available
from npm. Each project documents installation with matching archives, or normal
npm dependencies after a compatible release is published.

See the [developer documentation](../decision-lab-developer-docs/README.md)
for the public SDK and CLI contracts.

For Python development, `npm run test:python` checks the bridge, client and
complete report parity. After preparing a native wheel, run both installed
consumer checks with its actual path:

```sh
npm run check:python:wheel -- --wheel /absolute/path/to/decision_lab-0.1.0-NATIVE.whl
npm run test:python:examples -- --wheel /absolute/path/to/decision_lab-0.1.0-NATIVE.whl
```

The latter copies both Python examples outside the checkout, installs only the
wheel into a clean environment, and verifies their findings and native workflow
handoffs against the React integration. Each command writes a qualification
report beside the wheel.
