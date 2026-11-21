# Restaurant roster repair

This dedicated fictional example supports two connected business articles:

- `/use-cases/hospitality/restaurant-roster-repair/keep-dinner-covered/`
- `/use-cases/hospitality/restaurant-roster-repair/choose-a-roster-repair/`

The articles now follow **Restaurant operations → Repair a published restaurant
roster 1.1.0** in the Decision Lab Marketplace. It uses the
`complete-a-commitment/1` pattern through three exact pinned apps. Feasibility
always runs; selecting a stability-first or cost-first priority activates that
comparison app against the same staffing facts and mandatory conditions.

Current public-app screenshots, exact native runs and calculation comparisons
are retained in [marketplace-ui/verification.json](marketplace-ui/verification.json).
The [current sample source download](marketplace-ui/roster-repair-source.zip)
contains the author profile, canonical models, workflow mappings and CLI
walkthrough. The installed fictional example compares four supplied complete
remaining rosters. It does not generate all schedules, contact employees, record
their agreement or publish an operating roster.

The source archive is a snapshot of the implemented local example. Its
[manifest](marketplace-ui/source-manifest.json) identifies all 28 retained files;
the workflow definition and three app packages match the captured public release.
It makes no claim about a public GitHub commit. The restaurant folder was not
available in the public sample repository when these articles were updated.

The release supports changes to records and assignments within its authored
employee, position and repair catalog. Another bounded roster can be authored
through an adapted profile that generates its complete checks, followed by new
packages and publication. Adding an arbitrary input row does not extend an
installed app’s catalog.

## Retained earlier calculation basis

These earlier custom report pages preserve four native calculations and the
independent interval, payroll and change-count checks behind the original
example. They are historical supporting records; the articles’ screenshots
now show the installed Marketplace workflow.

- [Full relief availability](reports/full-availability/index.html): two feasible
  supplied repairs; no authored preference.
- [Relief availability ending at 8 p.m.](reports/short-availability/index.html):
  the relief repair fails full-interval availability; the coordinated repair
  remains feasible.
- [Preserve published assignments first](reports/stability-first/index.html):
  Rowan is preferred, adding $180 and changing one published position.
- [Minimize remaining payroll first](reports/cost-first/index.html): the
  coordinated repair is preferred, adding $80 and changing three positions.

The two ranked profiles keep the same staffing inputs and mandatory conditions.
Additional expense uses a $656 retained remaining-payroll baseline after Nora's
cancelled, unpaid shift is removed. The remaining-payroll limit is $856.
Earlier-week payroll is outside these amounts. Fixed fees, rest and weekly-hour
limits are declared teaching assumptions, not actual employment requirements.

## Source and verification

[Source notes](source/README.md) explain the authored models, frozen app packages,
retained native runs and optional recalculation for qualified beta consumers.
[qualification.json](qualification.json) identifies the exact SDK distribution
and source/output hashes. The portable verifier checks 16 retained candidate
findings against independent interval, expense and change-count calculations;
the separate SDK checks retain focused boundary and negative scenarios.

`capture-provenance.json` and `figures.json` retain the earlier custom report
captures and their original hashes. They are separate from the current
Marketplace captures and are not a claim that the old renderer is the current
Decision Lab interface. `scripts/capture-restaurant-roster.mjs` reproduces only
that retained renderer. Current capture provenance is in the Marketplace
verification record linked above; `scripts/capture-restaurant-marketplace.mjs`
reproduces that public-app journey and its native scenario exports.

The original SVG covers and interests diagrams use the site's navy, teal and
purple palette. `scripts/render-restaurant-roster-timelines.mjs` derives both
roster timetable variants from `source/model.mjs`, retaining its hash. They show
the three affected positions; the other six remaining positions are unchanged.
The diagrams explain the supplied assignments rather than independently proving
feasibility. The recorded employee conditions, actual service delivery and
external publication remain distinct.
