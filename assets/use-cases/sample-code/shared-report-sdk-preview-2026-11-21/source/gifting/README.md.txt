# Gifting integrations

These JavaScript clients form one continuing campaign process:

- [Gift-kit Preflight](gift-kit-preflight/README.md) uses the public CLI to screen campaigns and export a portable analysis with source receipts and the relevant next action.
- [Gift-kit Handoff Desk](gift-kit-handoff-desk/README.md) uses the SDK and ordinary React hooks to continue an exact campaign, calculate its alternatives and retain separate operating-event records.

Both use calculation workflow **4.0.0** around unchanged version-3 cost-first
evidence and planning apps. The tradeoff is concrete: in-house correction when
time permits, a premium external package when it alone protects the cutoff, and
less work only when actual scoped diagnostic evidence supports it.

Apply current facts, then Calculate/Recalculate. Valid supplied inputs and
current complete findings need no reviewer name or analytical acceptance. The
SDK supplies the focused Decision summary and compact comparison. Exact-option
Supporting reports, Decision process and Calculation dependencies remain
available. Inspecting an option does not choose it.

A complete feasible calculation can support a separate operating choice.
Sourced authorization, actual correction, a fresh rehearsal and actual handoff
remain distinct records. A later failed rehearsal supersedes an earlier positive
record. No client performs production, authenticates external approvals or
coordinates shared capacity across campaigns.

The two clients exchange ordinary native workflow runs and retain exact source
and assessment identities. Earlier reviewed **3.0.0** definitions remain only for
exact-version imports and teaching history. Starting a current calculation from
those inputs creates a new run; it copies no operating authorization or completed
work. Older version-2 scenario inputs remain clearly identified teaching cases.
The standalone Python gift-kit continuation client is retired.

The current definition lives under
[product/use-cases/gift-kit-readiness/integrations](../../product/use-cases/gift-kit-readiness/integrations).
Reproduce and verify the standalone copies with:

```sh
node scripts/build-integration-calculation-journeys.mjs
node examples/gifting/clients/generate.mjs
node scripts/build-integration-calculation-journeys.mjs --check
node examples/gifting/clients/generate.mjs --check
```

The frozen app packages, original assumptions and source cases remain pinned.
See [shared integration contracts](../shared/README.md),
[scenario maintenance](../../examples/gifting/clients/README.md), and the
[current marketplace app sources](../../product/use-cases/gift-kit-readiness).
