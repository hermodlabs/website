# Restaurant roster repair: retained working example

This fictional application compares **four supplied complete repairs** for Elena’s three remaining Friday–Sunday services within one published week. It does not generate all possible rosters. It uses the public Decision Lab SDK and the `complete-a-commitment/1` pattern; the HTML is a small custom report renderer, not a screenshot of an installed Marketplace workflow.

## The worked decision

Every fixed four-hour service requires two distinct qualified cooks and one server. Nora calls out of Saturday dinner. Her cancelled $88 shift is unpaid and removed from the retained remaining-payroll baseline of **$656**. The complete remaining-payroll limit is **$856**, allowing **$200** additional labor.

| Supplied complete repair | Additional labor | Changed published positions | Finding with Rowan available until 10 p.m. |
| --- | ---: | ---: | --- |
| Leave the gap | $0 | 1 | Saturday cook position unfilled |
| Move Theo only | $0 | 2 | Sunday cook position unfilled |
| Bring in Rowan | $180 | 1 | Meets recorded requirements |
| Repair three assignments | $80 | 3 | Meets recorded requirements |

The linked repair moves Theo from Sunday cook to Saturday cook, Ben from Sunday server to Sunday cook, and Ava into the Sunday server position. Ben is qualified for both roles. Each position is covered for its entire interval. Earlier-week worked minutes and the latest shift end are retained separately. Declared weekly hours, rest, availability, qualifications, exclusive employee capacity and the hard expense limit are checked by the SDK.

Changing only Rowan’s availability to end at **8 p.m.** makes the relief repair fail the native full-interval availability check. Its assignment still nominally ends at 10 p.m.; the calculation does not shorten the shift or invent cover.

With the original full availability unchanged, a stability-first app prefers Rowan, then uses expense to break ties. A cost-first app prefers the linked repair, then uses changed positions to break ties. These priorities rank only feasible repairs. No mandatory rule is relaxed.

## Files and retained findings

- `model.mjs`: reviewed, portable canonical model authoring and editable case fixture. Rules use the public typed expression language.
- `*.model.json`: exact canonical models for feasibility-only, stability-first and cost-first variants.
- `*.app.json`: exact frozen app packages authored through public SDK services.
- `commitment.template.json`: the shared authored commitment template package.
- `run.mjs`: creates the packages, runs the four scenarios through the actual Node executor, retains complete output and generates the readable reports.
- `render.mjs`: formats native findings and assignments. It does not decide feasibility or preference.
- `verify.mjs`: Node-only byte/hash checks, lossless native report decoding and independent fixture checks against all 16 retained candidate findings.
- `verify-sdk.mjs`: optional native recalculation and focused boundary/negative-case qualification using an installed preview SDK.
- `../story-data.json`: derived article data with native IDs, costs, assignments, findings and source links.
- `../qualification.json`: exact source/output hashes and the qualified SDK distribution fingerprint. Version `0.1.0` alone is insufficient to identify a preview build.
- `../reports/{full-availability,short-availability,stability-first,cost-first}/`: each contains readable `index.html`, untouched `run.json`, resolved native `assessment.json`, and exact bound `case.json`.

The native run retains the complete normalized assessment; the separately saved resolved assessment contains the same information in ordinary JSON. No native result has been replaced by a hand-written success flag.

## Verify without the preview SDK

From the website repository root, with Node.js 22.12 or later:

```sh
node assets/use-cases/restaurant-roster-repair/source/verify.mjs
```

This checks the retained records and an independent interval/payroll/counting oracle. It does not recalculate through Decision Lab or validate an arbitrary imported package.

## Recalculate with an installed preview SDK

The current SDK is available to qualified beta consumers; this example does not imply a public package release. Use a consumer directory in which `@decision-lab/sdk` has already been installed. The scripts resolve its public exports, without importing private SDK paths or changing that directory.

```sh
DECISION_LAB_CONSUMER=/path/to/your/installed-consumer \
  node assets/use-cases/restaurant-roster-repair/source/run.mjs

DECISION_LAB_CONSUMER=/path/to/your/installed-consumer \
  node assets/use-cases/restaurant-roster-repair/source/verify-sdk.mjs
```

`run.mjs` intentionally replaces this example’s generated models, frozen packages, native findings, story data, report HTML and qualification hashes. It never publishes an app, updates a Marketplace collection or notifies employees. Recheck downstream screenshots and articles after editing the fixture.

## Scope

All people, records, staffing levels, qualifications and amounts are fictional. The recorded ten-hour rest and forty-hour weekly limits are authored assumptions, **not a labor-law compliance claim**. Earlier-week work is retained as totals and latest shift ends, not retrospectively audited. Every remaining recorded service is assessed.

Fees are flat amounts for these exact four-hour assignments, including the quoted relief fee. Earlier-week payroll, payroll premiums and taxes are outside the remaining-payroll comparison. The unchanged four-hour assignments in this fixture contain no in-shift breaks. A required break must be removed from working availability and explicitly covered; the negative SDK check verifies that an uncovered interval blocks the proposed assignment.

Demand forecasting, workload intensity, consent, seniority, actual staff communication and roster publication require further rules, records or integrations. A changed-position count measures edits to published positions, not employee fairness or consent. Elena remains responsible for agreeing and communicating an actual repair.
