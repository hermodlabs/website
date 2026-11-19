#!/bin/sh
# Inspection transcript; replay with walkthrough.mjs and a fresh output root.
# Reviewers here are fictional fixtures, not authenticated users.
# Expected exit 0
decision-lab 'workflow' 'answer' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/run.json' '--question' 'staffing' '--status' 'accepted' '--value' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/01-staffing.value.json' '--actor' 'Fictional floor-lead' '--role' 'floor-lead' '--at' '2026-11-18T01:30:00.000Z' '--note' 'Explicit scripted review of the supplied fictional teaching value.' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/01-staffing.run.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/01-staffing.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/requires-reassessment.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/01-staffing.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/requires-reassessment.brief.json'

# Expected exit 0
decision-lab 'workflow' 'prepare' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/01-staffing.run.json' '--step' 'operations' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/prepared.json'

# Expected exit 0
decision-lab 'workflow' 'evaluate' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/01-staffing.run.json' '--step' 'operations' '--created-at' '2026-11-18T01:31:00.000Z' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/evaluated.run.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/evaluated.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/awaiting-review.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/evaluated.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/awaiting-review.brief.json'

# Expected exit 0
decision-lab 'workflow' 'review' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/evaluated.run.json' '--evaluation' 'workflow-evaluation-ca11f48ecdbef5961f72a040dc311aa75cb9c8a67b073df2' '--status' 'accepted' '--actor' 'Sam (fictional)' '--role' 'venue-manager' '--at' '2026-11-18T01:32:00.000Z' '--note' 'Reviewed the retained complete operating assessment for this fictional night; this is not deployment authorization.' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/run.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/accepted.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/accepted.brief.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/reassessed.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/changed-staffing/reassessed.brief.json'
