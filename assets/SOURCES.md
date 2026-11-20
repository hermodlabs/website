# Current asset sources

## Brand and product images

The Hermod wordmark and symbol were reused from [hermodlabs.com](https://hermodlabs.com/). The site's typography, colors and spacing develop the same visual identity. `hermod-gg-composition.png` and `hermod-gg-contribution.png` are actual [Hermod.gg](https://hermod.gg/) product captures; champion imagery within them belongs to Riot Games.

The current homepage hero is the native shipment Decision summary selected by `src/_data/shipmentUIRefresh.json`. It is stored with the other current shipment captures.

## Decision Lab interface captures

`use-cases/{shipment-readiness,gift-kit-readiness,street-team-deployment}/decision-summary-ui/` contains screenshots of the working Marketplace workflows, their native exports and capture receipts. The receipts identify the exact local production build, workflow package, case, dimensions and image hash. The workflows are first-shipment 1.4.0, gift-kit 2.3.0 and street-team 1.5.0.

Screenshots use ordinary input, Calculate/Recalculate and inspection controls. They show the focused Decision summary, separate Supporting reports, Decision process and Calculation dependencies. They contain fictional teaching cases. A calculated finding does not authenticate records, authorize spending, book capacity or establish completed work. `decision-lab-public-build-check.json` records the separate public-deployment build comparison; a local capture receipt alone makes no deployment-parity claim.

The current `capture-*-summary-ui.mjs` scripts reproduce these journeys. Each capture directory's README describes its case and verification boundaries.

`decision-process-refresh/` supplements those captures with the connected Decision process graphs from the public production app, build `619264e6c9e2fdf24b19`. Three overview images and three selected-question details show the same shipment 1.4.0, gifting 2.3.0 and street-team 1.5.0 definitions. The independent receipt retains the public runtime manifest, verified runtime hashes, workflow packages and native exports before and after inspection. All authored graph nodes and paths match the table representation; inputs, findings and history remain unchanged. `scripts/capture-decision-process-graphs.mjs` reproduces the public installation and ordinary-control journey. Earlier summary and comparison receipts retain their original build identities.

## CLI, SDK and Python examples

`use-cases/{shipment-readiness,gift-kit-readiness}/calculation-integration/` contains the working custom clients' screenshots, portable native workflows, generated reports and verification receipts. Shipping uses its calculation-mode workflow 2.0.0; gifting uses its calculation-mode workflow 4.0.0 around the pinned cost-first app. The receipts distinguish a calculation from a recorded business choice and from sourced authorization, reservation, correction, rehearsal, delivery or handoff events.

The exact code used for the selected CLI and SDK excerpts is retained under `use-cases/sample-code/calculation-integration-2026-11-20/`, including a downloadable source archive. Its manifest identifies every retained file by byte length, SHA-256 and Git blob identity. It identifies the tested implemented working copy separately from the public repository reference; it does not claim that reference commit contains later changes. `scripts/check-use-case-source-snapshots.mjs` checks each displayed excerpt against those exact bytes.

The Python machine-learning integration is retained under `use-cases/shipment-readiness/readiness-learning/`, with source, model inputs, generated reports, architecture illustrations and capture records. Its estimates and numerical results are fictional demonstration inputs, not validated predictions for a real supplier.

`use-cases/restaurant-roster-repair/` contains the custom SDK report application, native findings, interval checks, report screenshots and source qualification for the restaurant examples. These are screenshots of that generated report application, not Marketplace screens.

## Illustrations and article sources

The decision-summary companion article reuses the current native shipment baseline, ample-time gift-kit and five-staff promotion captures, with their existing hash-checked verification records. Their different calendars and domain records remain separate. `articles/covers/what-should-a-decision-summary-help-you-decide.svg` and `articles/decision-views/reading-a-decision{,-mobile}.svg` are original accessible vectors explaining the reading structure; they are editorial illustrations and introduce no calculated findings.

Page and article covers, navigation icons, business-process charts, timing diagrams and explanatory decision maps are original native SVGs. They use the site's visual system and include accessible titles and descriptions.

The shipping and gifting `decision-maps/model.json` files bind their active illustrations to current calculation-integration records. The nightlife `decision-map.json` and basis-matrix dataset bind to current street-team Decision summary exports and the matching native financial output. The site copies those findings; it does not calculate business eligibility in its diagrams. Declared stakeholder interests and qualitative business effects remain distinct from evaluated conditions and measured outcomes.

`articles/first-principles/` and `blog/planning-series/` retain the supplied essay sources and content-integrity records used by the current First Principles collection. Formula markup and explanatory diagrams belong to those conceptual articles. Business references and worked-case limits are linked directly from the relevant articles' Sources and scope disclosures.

Only current public assets are retained here. Retired screenshots, authoring exercises, source snapshots and reproduction scripts are excluded from the published bundle.
