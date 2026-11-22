# Gift-kit Handoff Desk

A focused React SDK app for resolving one campaign flagged by [Gift-kit Preflight](../gift-kit-preflight/README.md). It opens the **same portable workflow** as the CLI, applies current source records and calculates the connected evidence and planning assessments. A new calculation workflow **4.0.0** retains the existing version-3 cost-first app configuration and business rules. Version-3 reviewed workflows stay supported through an explicit archived-definition whitelist.

The business question is: **Which supported correction protects this handoff at the least expense, and what must actually happen before it is complete?**

## Run

Use Node.js 22.19 or later; Node.js 24 is recommended. In the Decision Lab checkout:

```sh
npm run dev:gifting:react
npm run build:gifting:react
npm run test:gifting:react
npm run test:gifting:react:browser
```

This folder is a standalone npm project. When copying it, install matching SDK/React views releases or local archives from `npm run release:pack`. Keep SDK optional dependencies enabled for browser workers, and serve the production build over HTTP.

## Follow one calculation

1. **Open continuing review** with the CLI's `GIFT-321/review.workflow.json`, or start a bundled fictional teaching case.
2. Inspect the commitment, diagnostics, source scope and booking. Edit records, then **Apply inputs**. Unapplied drafts remain separate; **Discard changes** restores the applied case.
3. Choose **Calculate / Recalculate**. The SDK runs current connected assessments in dependency order, without reviewer identity or analytical acceptance gates.
4. Read **Decision summary**. **Inspect** opens the exact complete arrangement in **Supporting reports**. **Decision process** explains business branches; **Calculation dependencies** explains assessment handoffs. Inspection never selects an operating response or changes a calculation.
5. Name the person recording an actual operating decision and choose one exact supported plan. This is separate from the calculation.
6. Record actual external authorization, correction, fresh rehearsal and handoff independently.
7. Save locally or download the portable workflow to retain applied records and history. Reopen it here or continue with the CLI.

The new default flow does not fabricate input acceptance or finding reviews. Historical version-3 imports retain their original explicit signoff behavior. Changed applied records invalidate dependent results and any earlier operating choice; pending drafts hide a current recommendation until applied or discarded. Downloads preserve the last applied native case, rather than silently treating drafts as applied inputs.

## Why context changes the recommendation

All cases and records are fictional. With an ample one-day window, the unchanged cost-first rules prefer $300 in-house work. At minute 1,410, only the $400 external package can finish by minute 1,440. Actual scoped diagnostic reports can establish that a $100 insert replacement is sufficient. Missing or old-scope bookings block the external response. If every package misses the cutoff, escalation or a revised commitment is appropriate; a passing plan is not invented.

Ten planned rehearsal minutes remain subject to the published five-minute minimum. Planning a rehearsal does not establish that it happened or passed. Changing the deadline does not renew booking or permission scope.

## Public SDK path

[`src/useGiftJourney.js`](src/useGiftJourney.js) owns one browser executor, cancellation and request tokens. Ordinary React state manages forms and files. The shared adapter [`src/reviewJourney.js`](src/reviewJourney.js) calls the public workflow API:

```js
const updated = updateReviewInputs({ lab, run, values });
const calculated = await solveReviewJourney({ lab, run: updated, execution });
const output = lab.workflows.output({ run: calculated });
```

The adapter's calculation operation is `lab.workflows.solve({ run, execution })`. It does not implement a second scheduler, evaluator or ranking policy. Native output supplies the summary, question views, process and calculation map. [`src/JourneyReports.jsx`](src/JourneyReports.jsx) renders them directly:

```jsx
<DecisionSummaryView
  summary={output.decisionSummary}
  onOpenReport={openReport}
  onViewProcess={output.decisionProcess ? () => setActive('process') : undefined}
/>
```

Inspection keys route to `QuestionView` supporting views. The display never converts an inspection into an operating choice. Complete native reports remain available where an authored question view is absent. Compatible previous/current planning runs use `lab.reports.compareFindings`; incomplete findings and tied preferences remain distinct.

## Keep authority and completion separate

The workflow retains the original quantity, cutoff and intended recipient scope. It checks sourced spending authority, actual correction for the chosen package, a fresh successful rehearsal on that corrected output, and a linked handoff before the **original** cutoff. Event time and recorded time are separate. A revised promise does not fulfill the old promise.

Each operating kind has one current complete record. A later withdrawn authorization, incomplete correction, failed test or wrong-scope record supersedes an earlier positive. Historical records stay retained, but recovery requires a new valid linked chain. Incremental deliveries and parallel corrections require a richer domain model.

Entering a record does not authenticate a person, spend money, perform production or obtain external authority. Once work starts, record actual events against the historical chosen plan; do not advance the planning clock to pretend the work happened.

## Verification

`test/journey.test.js` runs all six cases with the real evidence/commitment engines, checks the smaller correction, blocked outcomes, staleness, operating-chain validity, later negatives, original promise preservation, storage conflicts and explicit legacy compatibility. `test/browser.mjs` runs the production browser worker, summary/inspection/process navigation, pending/apply/recalculate controls, choices, actual records, local recovery and desktop/mobile page flow. Set `GIFT_PREFLIGHT_REVIEW` to a CLI-exported workflow to verify an exact-hash CLI-to-React handoff. `GIFT_CAPTURE_DIR` retains native screenshot evidence.
