# First-shipment calculation flow

These native browser captures document **Compare first-shipment arrangements 1.2.0** (`review-first-shipment`) in calculation mode. Inputs are supplied values; there is no reviewer identity, answer acceptance or finding signoff. Calculate runs the relevant app dependencies, and changed inputs require recalculation. These conclusions remain separate from operating permission, booking, release and actual delivery.

## Capture basis

The capture uses the frozen **local production preview**, build `db713f03462e3e776b6e`, of repository HEAD `6d4c867`. At capture time, the checked public site served an older build and the new 1.2.0 package URL returned 404. This is evidence of the implemented preview, not a claim of public deployment parity. `build-verification.json` records the exact runtime and the public check.

The workflow package is retained as `first-shipment-1.2.0.workflow.json`, byte-identical to the source publication. It has content hash `33f0db2995f8b6eeb8a25f76682ec7459e88316a40aed586134e2aedcc923e60` and definition hash `4e82e54e0e341039c8e35f8c6f9473d8c3c9d12cbb440540d6f28204a6bab0d4`.

## Native stages

- `starter.run.json`: a new supplied-input case, with no evaluations or reviews.
- `calculated.run.json`: the same complete case after Calculate; five supporting app evaluations, no reviews.
- `changed-inputs.run.json`: quantity deliberately changed from 100 to 101 to show dependent results becoming outdated. It is a UI boundary demonstration, not a new conclusion about the original 100-case shipment.
- `recalculated.run.json`: quantity restored to 100 and the original case recalculated. The complete shared case matches the starter exactly.

The original 100-case registration scenario supports Backup at $6,000 across the admitted states. Under its explicitly hypothetical 50/50 probabilities and exact verification model, the $200 fast check has $5,200 expected total cost. These are supplied fictional premises, not measured source probabilities, authenticated authority or an executed booking.

## Standalone tutorial refresh

The five `tutorial-*.app-case.json` exports retain the exact frozen app packages and complete diagnostic models from the earlier cost-first, arrival-first, tighter-budget and confirmation tutorials. Only the renderer now uses **Decision summary / Supporting reports**. The arrival-first confirmation tutorial remains separate from both the first-shipment registration workflow and the later cost-first operating continuation.

The custom CLI and SDK shipment clients retain their published reviewed-execution workflow and screenshots. These captures do not migrate that code or rewrite old native files, receipts or history.

## Reproduction

`scripts/capture-shipment-calculation-flow.mjs` uses ordinary file imports, Start analysis, visible input and report controls, native calculations and downloads. It performs no application-state, DOM, CSS, interface-text or result injection. The receipt records every capture’s native text, dimensions and SHA256, the exact native exports, and before/after source equivalence. Its `workflow` and `tutorials` phases preserve all earlier proof directories.
