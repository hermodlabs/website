# Street-team deployment

Three connected business articles follow fictional venue manager Alex: compare tonight's staff allocation, make the review repeatable, then define what the team needs to learn about customer response. The current working example is Marketplace's Venue operations → Review a street-team deployment 1.5.0.

## Current screenshots

`decision-summary-ui/` contains unedited native screenshots, workflow exports, SDK outputs and the exact capture receipt. The browser journey applies staffing changes, calculates, inspects Decision summaries and Supporting reports, and compares five available staff with four after another callout. Inputs use Forms or YAML; Excel tools sit in a disclosure.

With five staff and four required inside, holding or sending one meets the recorded operating requirements. With four available, only holding meets them. The one-person standard promotion costs $200; $40 contribution per additional guest gives a five-guest expense-recovery hurdle and a first positive result at six. These are conditional thresholds, not forecasts of attendance or profit. Choice, specific authorization and actual outreach remain separate business responsibilities.

## Decision map

`decision-map.json` is the typed explanatory model for the roles and business-effects illustrations. It separates declared stakeholder goals, reporting and influence from source-bound staffing inputs and coverage findings. The floor team and promoters influence Alex, who makes the deployment decision and reports to the owner. Reporting relationships create no additional app-assessed approval gate.

Floor staffing supports service capacity. Outreach uses that capacity, adds expense and may attract guests. Attendance, spending, offer use and customer needs can influence revenue and profit. Those relationships are qualitative hypotheses, without coefficients, response probabilities or measured effects.

The model's two calculated contexts bind to `decision-summary-ui/retained/five-staff.run.json` and `four-staff.run.json`. Coverage records preserve the native `staffing-coverage` condition under `SUFFICIENCY`; passing that one condition is distinct from whole-plan eligibility. The diagrams show the five-staff context by default.

`src/_data/streetTeamDecisionMap.js` copies the four complete alternatives' operating findings from the five-staff run and their guest thresholds from matching `five-staff.output.json`. Expense, contribution and discount-loss inputs are checked for agreement. The basis matrix neither calculates the rules nor represents an accepted or chosen deployment.

## Illustrations and limits

The covers, process charts and timing diagrams are original accessible SVGs. The separate seven-person timing scenario is an explanatory schedule: an 8:15 p.m. event exit fits the planned outreach window; a 9 p.m. exit does not. A conditional customer journey establishes no acceptance or arrival.

The proposed learning comparison has no measured results. It requires an appropriate study design, business authorization and actual evidence. The article's SBA, NIST and HM Treasury references support financial-method and experimental-design context, not any claim about a real venue.

Reproduce native captures with `scripts/capture-street-team-summary-ui.mjs`. The current decision-map checker verifies source pointers, normalized native assessments, diagram identity and the copied basis matrix. The complete workflow and creation code are linked through the scenario's optional repository reference.
