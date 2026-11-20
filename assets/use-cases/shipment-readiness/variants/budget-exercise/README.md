# Changed-fact exercise: $5,000 expense limit

This separate exercise leaves the original controlled two-app comparison unchanged. It uses the exact existing `../earliest-arrival-shipment.app.json` release and clones `../shared-case.inputs.json`. The sole changed case value is `parameters.expenseLimit`, from 650000 to 500000 USD cents ($6,500 to $5,000). The case identifier, other parameters, tables, provenance, app, template, mandatory rules and arrival preference remain unchanged.

## Verified result

The SDK returns a complete assessment with complete coverage. `plan-000001` / `direct` remains feasible at 400000 USD cents and becomes preferred. `plan-000002` / `backup` costs 600000 USD cents, fails exactly one mandatory constraint (`total-expense-limit`, requirement `COST`), and is not ranked. Preference cannot compensate for a mandatory failure. The unchanged cash limit is still 650000 cents.

## Reproduce in the app

1. Open **Collections**, choose **Import app, workflow or case**, and import the original `../earliest-arrival-shipment.app-case.json`.
2. Choose **Both**, then **Download Excel**. The workbook is prefilled with this case’s inputs.
3. In the **Parameters** worksheet, change **Parameters expense Limit** in cell **L2** from `650000` to `500000` USD cents ($6,500 to $5,000). Leave **Parameters cash Limit** in **M2** at `650000`, and leave every other value unchanged.
4. Choose **Upload Excel** and select the edited workbook. **Review workbook changes** lists one changed value under **Parameters: Parameters expense Limit**, with no added or removed values. Inspect the proposed inputs, then choose **Apply inputs**.
5. Wait for **Reports current** and **Saved locally**. Choose **Reports → Decision → Complete alternatives**. In **Complete plan comparison**, direct is preferred and backup is blocked, with one failed check.
6. Open `plan-000002`, then **Conditions and blockers**. **Total expense and cash · condition 1** fails; condition 2 passes. Expand **Complete selected operating-situation record and matched-record traces** to inspect the raw `total-expense-limit` identifier.
7. **Export case** saves a portable `.app-case.json`. The retained exercise download was imported into a separate fresh browser context and recomputed successfully on the public app.

The current commitment runtime supports the Excel review/apply flow and a **Canonical commitment case YAML** editor. For the equivalent YAML route, change only `parameters.expenseLimit` from `650000` to `500000`. Valid YAML updates reports automatically; **Run calculation** reruns the valid case. There is no dedicated expense-limit form field.

## Retained artifacts and capture boundary

- `expense-limit-5000.inputs.json` and `.inputs.yaml`: the changed case values.
- `expense-limit-5000.case.json`: SDK bound-case artifact, not the UI import format.
- `expense-limit-5000.run.json`: valid portable SDK run/report.
- `expense-limit-5000.app-case.json`: actual UI export with the exact existing app package; use this for Published apps imports.
- `expense-limit-5000-preview.png`: unedited public-app screenshot of the workbook change preview.
- `expense-limit-5000-report.png`: unedited public-app screenshot of the updated comparison.
- `exercise-manifest.json`: source package/input hashes, sole changed value, SDK findings and artifact hashes.
- `capture-provenance.json`: public deployment hashes, workbook cell change, actual UI actions, screenshot dimensions/hashes, retained export hash and independent reimport verification.

The screenshots were refreshed from `https://hermodlabs.github.io/review_lab/` on November 17, 2026, using a fresh temporary browser profile and the supplied fictional case. `scripts/capture-shipment-budget.mjs` reproduces the capture through ordinary import, Excel download/upload, review and apply controls. The changed workbook retains every ZIP archive part unchanged except the single worksheet containing the edited scalar. Native exports verify the exact app package and frozen module are unchanged and the only changed case value is `parameters.expenseLimit`. The existing portable case and all five mathematical fixture files retain their original bytes. No source app code, labels, controls or computed results were injected, and no shared publication occurred.
