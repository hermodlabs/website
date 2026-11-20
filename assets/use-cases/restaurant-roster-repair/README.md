# Restaurant roster repair

This dedicated fictional example supports two connected business articles:

- `/use-cases/hospitality/restaurant-roster-repair/keep-dinner-covered/`
- `/use-cases/hospitality/restaurant-roster-repair/choose-a-roster-repair/`

The custom report application uses Decision Lab's public SDK and the
`complete-a-commitment/1` pattern. It assesses four supplied complete remaining
rosters for one restaurant. It does not generate all possible schedules, contact
employees, establish their agreement or publish an operating roster.

## Read the worked reports

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

The article screenshots are unmodified Chrome captures of these generated
reports, not Marketplace screenshots. `capture-provenance.json` identifies each
report hash, image rectangle, PNG hash and mobile check. `figures.json` supplies
the article images. Reproduce the captures with
`scripts/capture-restaurant-roster.mjs` and an external Playwright/Chrome
installation; no findings or interface elements are painted into the images.

The original SVG covers and interests diagrams use the site's navy, teal and
purple palette. `scripts/render-restaurant-roster-timelines.mjs` derives both
roster timetable variants from `source/model.mjs`, retaining its hash. They show
the three affected positions; the other six remaining positions are unchanged.
The diagrams explain the supplied assignments rather than independently proving
feasibility. The recorded employee conditions, actual service delivery and
external publication remain distinct.
