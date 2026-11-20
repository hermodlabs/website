#!/bin/sh
# Inspection transcript; replay with walkthrough.mjs and a fresh output root.
# Reviewers here are fictional fixtures, not authenticated users.
# Expected exit 0
decision-lab 'template' 'init' '--pattern' 'complete-a-commitment/1' '--id' 'bounded-promotion' '--version' '1.0.0' '--title' 'Review a bounded promotion' '--description' 'Check complete deployments; explain conditional guest thresholds without forecasting demand.' '--require-module-field' 'assumptions' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.template.yaml'

# Expected exit 0
decision-lab 'template' 'validate' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.template.yaml' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/template.validation.json'

# Expected exit 0
decision-lab 'template' 'pack' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.template.yaml' '--created-at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.template.json'

# Expected exit 0
decision-lab 'app' 'init' '--template' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.template.json' '--model' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/source/promotion.model.json' '--app-id' 'street-team-operating-review' '--release' '1' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.app.yaml'

# Expected exit 0
decision-lab 'app' 'validate' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.app.yaml' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/app.validation.json'

# Expected exit 0
decision-lab 'app' 'pack' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.app.yaml' '--created-at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.app.json'

# Expected exit 0
decision-lab 'app' 'check' '--app' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.app.json' '--suite' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/source/app.scenarios.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/app.checks.json'

# Expected exit 0
decision-lab 'workflow' 'create' '--source' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/workflow.source.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/workflow.definition.json'

# Expected exit 0
decision-lab 'workflow' 'draft' '--source' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/workflow.source.json' '--catalog' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/source/catalog.json' '--id' 'promotion-author' '--at' '2026-11-17T18:00:00.000Z' '--published-at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/workflow.draft.json'

# Expected exit 0
decision-lab 'workflow' 'inspect-draft' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/workflow.draft.json'

# Expected exit 2
decision-lab 'workflow' 'pack' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/workflow.draft.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/unreviewed.workflow.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/workflow.draft.json' '--binding' 'decision' '--actor' 'Fictional promotion module author' '--meaning' 'Support one same-evening deployment decision; never forecast customer response or rank profit.' '--scope' 'One fictional venue, event and operating date, with four mutually exclusive complete options.' '--units' 'USD cents and same-day minutes from local midnight.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-01.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-01.draft.json' '--binding' 'dependency:operations' '--actor' 'Fictional promotion module author' '--meaning' 'Pin the authored Complete a Commitment operating app exactly; the workflow reuses its complete feasibility findings.' '--scope' 'The embedded app package hash includes this module, option structures, requirements and assumptions.' '--units' 'The app uses USD cents, qualified people and local same-day minutes.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-02.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-02.draft.json' '--binding' 'question:staffing' '--actor' 'Fictional promotion module author' '--meaning' 'Same venue, event and operating date. Count only staff qualified and available throughout the complete absence; unavailable staff are subtracted once.' '--scope' 'Who remains available inside if we send the team? Responsible role: floor-lead. Shared path: promotion.staffing.' '--units' 'One venue/event/operating date. Times use same-day minutes from midnight; staff counts are qualified whole people.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-03.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-03.draft.json' '--binding' 'question:timing' '--actor' 'Fictional promotion module author' '--meaning' 'Same-day local minutes from midnight. Journey time is conditional on acceptance, not a customer-response forecast.' '--scope' 'Can we reach departing event guests while arrival is still useful? Responsible role: event-coordinator. Shared path: promotion.timing.' '--units' 'One venue/event/operating date. Times use same-day minutes from midnight; staff counts are qualified whole people.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-04.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-04.draft.json' '--binding' 'question:access' '--actor' 'Fictional promotion module author' '--meaning' 'Exact venue, event, date, street-promotion activity, sourced grant and validity interval. An empty register grants no access.' '--scope' 'Do current event records permit this activity for the whole contact window? Responsible role: event-coordinator. Shared path: promotion.access.' '--units' 'One venue/event/operating date. Times use same-day minutes from midnight; staff counts are qualified whole people.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-05.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-05.draft.json' '--binding' 'question:spending' '--actor' 'Fictional promotion module author' '--meaning' 'USD cents. Complete incremental expense comes from the operating option quotes; the limit and delegated permission are separate from Sam’s final specific authorization.' '--scope' 'What future expense and recorded spending delegation apply tonight? Responsible role: venue-manager. Shared path: promotion.spending.' '--units' 'USD cents; retain unknown and nonpositive values without coercion.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-06.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-06.draft.json' '--binding' 'question:contribution' '--actor' 'Fictional promotion module author' '--meaning' 'USD cents after the offer and variable costs. Unknown remains unknown; zero and negative contribution cannot recover a positive expense. Attributed visits need not be incremental.' '--scope' 'What contribution would one genuinely additional guest retain under each offer? Responsible role: finance-reviewer. Shared path: promotion.contribution.' '--units' 'USD cents; retain unknown and nonpositive values without coercion.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-07.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-07.draft.json' '--binding' 'question:discount-loss' '--actor' 'Fictional promotion module author' '--meaning' 'USD cents of additional loss not already included in incremental guest contribution or deployment expense; do not double count. Unknown leaves the economic threshold unassessed.' '--scope' 'Would an offer reduce contribution from guests who would have come anyway? Responsible role: finance-reviewer. Shared path: promotion.discountLoss.' '--units' 'USD cents; retain unknown and nonpositive values without coercion.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-08.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-08.draft.json' '--binding' 'question:proposal' '--actor' 'Fictional promotion module author' '--meaning' 'Record exact accepted assessment run hash and evaluation reference, venue, date, deployment and manager. Selecting a row in a report does not make this decision.' '--scope' 'Which passing deployment does Sam choose on this accepted assessment? Responsible role: venue-manager. Shared path: promotion.proposal.' '--units' 'One venue/event/operating date. Times use same-day minutes from midnight; staff counts are qualified whole people.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-09.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-09.draft.json' '--binding' 'question:authorization' '--actor' 'Fictional promotion module author' '--meaning' 'Record the same current assessment basis, venue, date and selected deployment with a sourced authorization, amount cap and validity interval. Recorded assertions do not authenticate Sam or dispatch staff.' '--scope' 'Has Sam authorized this chosen deployment, amount and operating window? Responsible role: venue-manager. Shared path: promotion.authorization.' '--units' 'One venue/event/operating date. Times use same-day minutes from midnight; staff counts are qualified whole people.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-10.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-10.draft.json' '--binding' 'step:operations' '--actor' 'Fictional promotion module author' '--meaning' 'Bind the four accepted operating answers into one native complete-static-plan assessment. Retain every passing deployment without preferring hold. Financial answers and Sam’s decision cannot alter the operating calculation.' '--scope' 'Exact venue/date/event and complete current staffing, timing, access and spending inputs. Output retains complete native plan expense, feasibility and blockers; accept only complete coverage.' '--units' 'Native expense in USD cents; native staffing in whole people; timing in same-day minutes.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-11.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-11.draft.json' '--binding' 'brief' '--actor' 'Fictional promotion module author' '--meaning' 'Use native complete expenses once for conditional thresholds. Require the exact current accepted run hash for Sam’s choice and a separate exact-scope authorization. Unknown or nonpositive contribution cannot become a zero threshold.' '--scope' 'All four deployment rows remain available. The selected deployment must be feasible on the accepted current basis; changed operating answers invalidate the chosen basis while preserving history.' '--units' 'ceilDivide(expense plus separate loss, positive contribution), both in integer cents, gives whole additional guests; first positive uses floorDivide plus one.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-12.draft.json'

# Expected exit 0
decision-lab 'workflow' 'review-binding' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-12.draft.json' '--binding' 'presentation' '--actor' 'Fictional promotion module author' '--meaning' 'Group the same questions by operating basis, conditional economics and Sam’s decision. Render native findings and prepared threshold records through generic reusable views.' '--scope' 'Every input question appears exactly once. Report labels do not add a business rule or hide operating blockers.' '--units' 'Currency USD, amount scale cents, time minutes from the operating date’s midnight; all guest counts are whole genuinely additional guests.' '--at' '2026-11-17T18:00:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-13.draft.json'

# Expected exit 0
decision-lab 'workflow' 'check' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/review-13.draft.json' '--suite' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/source/workflow.scenarios.json' '--draft-output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/reviewed.workflow-draft.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/workflow.checks.json'

# Expected exit 0
decision-lab 'workflow' 'inspect-draft' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/reviewed.workflow-draft.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/publication.json'

# Expected exit 0
decision-lab 'workflow' 'pack' '--draft' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/reviewed.workflow-draft.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.workflow.json'

# Expected exit 0
decision-lab 'workflow' 'package-validate' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.workflow.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/package.validation.json'

# Expected exit 0
decision-lab 'workflow' 'package-open' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/promotion.workflow.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/author/verified.workflow.json'
