# Changed-fact exercise: $5,000 expense limit

This separate exercise leaves the original controlled two-app comparison unchanged. It uses the exact existing `../earliest-arrival-shipment.app.json` release and clones `../shared-case.inputs.json`. The sole changed case value is `parameters.expenseLimit`, from 650000 to 500000 USD cents ($6,500 to $5,000). The case identifier, other parameters, tables, provenance, app, template, mandatory rules and arrival preference remain unchanged.

## Verified result

The SDK returns a complete assessment with complete coverage. `plan-000001` / `direct` remains feasible at 400000 USD cents and becomes preferred. `plan-000002` / `backup` costs 600000 USD cents, fails exactly one mandatory constraint (`total-expense-limit`, requirement `COST`), and is not ranked. Preference cannot compensate for a mandatory failure. The unchanged cash limit is still 650000 cents.

## Reproduce in the app

1. Open Published apps, choose **Import app, workflow or case**, and import the original `../earliest-arrival-shipment.app-case.json`.
2. Choose **Both** (or **YAML**) in the workspace layout.
3. In **Canonical commitment case YAML**, locate `expenseLimit: 650000` and change the value to `500000`. Leave `cashLimit` and every other case value unchanged.
4. Valid YAML updates reports automatically. Wait for **Reports current** and **Saved locally**; **Run calculation** also reruns the valid case.
5. Choose **Reports**. In **Complete plan comparison**, direct is preferred and backup is blocked, with one failed check.
6. **Export case** saves a portable `.app-case.json`. The retained exercise export was imported into a second fresh browser context and recomputed successfully.

The current commitment runtime exposes YAML rather than a dedicated business form. Do not instruct readers to fill in a nonexistent expense-limit form field.

## Retained artifacts and capture boundary

- `expense-limit-5000.inputs.json` and `.inputs.yaml`: the changed case values.
- `expense-limit-5000.case.json`: SDK bound-case artifact, not the UI import format.
- `expense-limit-5000.run.json`: valid portable SDK run/report.
- `expense-limit-5000.app-case.json`: actual UI export with the exact existing app package; use this for Published apps imports.
- `expense-limit-5000-report.png`: unedited runtime screenshot.
- `exercise-manifest.json`: source package/input hashes, sole changed value, SDK findings and artifact hashes.
- `capture-provenance.json`: local build hashes, actual UI actions, screenshot dimensions/hash, export hash and independent reimport verification.

The screenshot was captured from the read-only local production build at `../hermod-review-lab/dist`, served only on loopback with all external browser network requests blocked. It is a genuine working-app capture; it is not asserted to be the public deployment. No source app code, text, controls or computed results were injected. No shared publication occurred. The fictional fixtures stayed in the local browser. The screenshot caption identifies the local-build provenance.
