#!/bin/sh
# Inspection transcript; replay with walkthrough.mjs and a fresh output root.
# Reviewers here are fictional fixtures, not authenticated users.
# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/callouts/run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/basis.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/callouts/run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/basis.brief.json'

# Expected exit 0
decision-lab 'workflow' 'answer' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/callouts/run.json' '--question' 'proposal' '--status' 'accepted' '--value' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/01-proposal.value.json' '--actor' 'Sam (fictional)' '--role' 'venue-manager' '--at' '2026-11-18T01:30:00.000Z' '--note' 'Explicit scripted review of the supplied fictional teaching value.' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/01-proposal.run.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/01-proposal.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/awaiting-authorization.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/01-proposal.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/awaiting-authorization.brief.json'

# Expected exit 0
decision-lab 'workflow' 'answer' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/01-proposal.run.json' '--question' 'authorization' '--status' 'accepted' '--value' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/02-authorization.value.json' '--actor' 'Sam (fictional)' '--role' 'venue-manager' '--at' '2026-11-18T01:30:00.000Z' '--note' 'Explicit scripted review of the supplied fictional teaching value.' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/02-authorization.run.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/02-authorization.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/insufficient-cap.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/02-authorization.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/insufficient-cap.brief.json'

# Expected exit 0
decision-lab 'workflow' 'answer' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/01-proposal.run.json' '--question' 'authorization' '--status' 'accepted' '--value' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/03-authorization.value.json' '--actor' 'Sam (fictional)' '--role' 'venue-manager' '--at' '2026-11-18T01:30:00.000Z' '--note' 'Explicit scripted review of the supplied fictional teaching value.' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/03-authorization.run.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/03-authorization.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/other-venue.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/03-authorization.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/other-venue.brief.json'

# Expected exit 0
decision-lab 'workflow' 'answer' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/01-proposal.run.json' '--question' 'authorization' '--status' 'accepted' '--value' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/04-authorization.value.json' '--actor' 'Sam (fictional)' '--role' 'venue-manager' '--at' '2026-11-18T01:30:00.000Z' '--note' 'Explicit scripted review of the supplied fictional teaching value.' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/04-authorization.run.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/04-authorization.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/expired-window.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/04-authorization.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/expired-window.brief.json'

# Expected exit 0
decision-lab 'workflow' 'answer' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/01-proposal.run.json' '--question' 'authorization' '--status' 'accepted' '--value' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/05-authorization.value.json' '--actor' 'Sam (fictional)' '--role' 'venue-manager' '--at' '2026-11-18T01:30:00.000Z' '--note' 'Explicit scripted review of the supplied fictional teaching value.' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/05-authorization.run.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/05-authorization.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/other-assessment.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/05-authorization.run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/other-assessment.brief.json'

# Expected exit 0
decision-lab 'workflow' 'answer' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/01-proposal.run.json' '--question' 'authorization' '--status' 'accepted' '--value' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/06-authorization.value.json' '--actor' 'Sam (fictional)' '--role' 'venue-manager' '--at' '2026-11-18T01:30:00.000Z' '--note' 'Explicit scripted review of the supplied fictional teaching value.' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/run.json'

# Expected exit 0
decision-lab 'workflow' 'inspect' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/complete.output.json'

# Expected exit 0
decision-lab 'workflow' 'brief' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/complete.brief.json'

# Expected exit 0
decision-lab 'workflow' 'open' '--run' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/run.json' '--output' '/private/var/folders/0x/7yctlv_54bgbdnp6zb00nvvw0000gn/T/promotion-installed-NHfylI/.output/decision/reopened.run.json'
