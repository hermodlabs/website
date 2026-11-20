# Shipment interface capture

Captured November 20, 2026 from a fresh local production build of the current Decision Lab worktree. `verification.json` records build identity, screenshot hashes and native exports for first-shipment 1.4.0. `source-manifest.json` identifies the exact source snapshot, including changes beyond HEAD. No public deployment parity is claimed.

Use `scripts/capture-shipment-summary-ui.mjs` with the qualified production preview and build manifest to reproduce the ordinary native import, Calculate, Inspect, process/dependencies and changed-input journey. The supplied case remains unchanged by calculation. The quantity 101 state demonstrates invalidation only; the complete original 100-unit case is restored and recalculated. Inspection preserves the exported native run hash.

Historical calculation-flow and authoring receipts remain separate and unchanged.
