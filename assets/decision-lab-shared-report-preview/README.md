# Shared report interface: local production previews

These manifests identify frozen copies of the user-verified local production builds used for the November 21, 2026 article refresh. The Decision Lab public site was unchanged when the captures were made. No publication is claimed.

`app-build-manifest.json`, `shipping-build-manifest.json` and `gifting-build-manifest.json` retain the exact built file identities. Each scenario capture receipt records the browser origin, workflow and captured results. `source-context.json` identifies accompanying local source, including uncommitted changes; it does not claim the builds were reproducibly generated from that source or equal a public GitHub revision.

The shared `WorkflowReportsView` presents SDK/workflow output. Host applications own inputs and operating actions; configured apps and SDK calculations determine findings. Changing a report tab or inspecting an option does not choose, authorize or execute it.
