# Pattern Explorer evidence

The exercise presents retained fictional comparisons. It does not run an assessment in the website or accept operating data from readers.

The baseline, accepted-scope and wrong-build presets link directly to the unmodified public-app SDK-run downloads under `assets/use-cases/release-recovery/current-ui/`. Their capture receipt remains in that directory. The two restaurant records remain under `assets/use-cases/restaurant-roster-repair/shared-report-preview/`; this exercise does not change their local-preview provenance.

`missing-estimate.run.json` and `missing-estimate.output.json` were generated through the public SDK from the retained published release-workflow definition and the unchanged missing-estimate source fixture. The core estimate is unanswered. No planning assessment is performed; the output says `needs-input` and the summary availability is `unknown`. This is not a calculated no-feasible-plan result.

`verification.json` identifies all native input/result bytes by SHA-256 and records the local SDK entry files used for qualification. It does not claim to archive every transitive SDK dependency.

From the website root, verify the retained evidence and every displayed release-result row:

```sh
node scripts/verify-pattern-explorer.mjs
```

To qualify the missing-estimate fixture again using an installed copy of the public SDK:

```sh
PATTERN_EXPLORER_SDK_ROOT=/path/to/packages/sdk node scripts/verify-pattern-explorer.mjs --refresh
```

The default SDK location is the neighboring development repository used for this qualification. Refreshing changes the native run's generated identity and timestamps, so it also regenerates the receipt. It does not modify the public workflow definition or any retained screenshots.

The independent checks verify exact single-fact changes from the release baseline, the unchanged original promise, no invented preference, and the latest native evaluation for the restaurant transfer. The UI’s answer labels are editorial summaries of those qualified native results.
