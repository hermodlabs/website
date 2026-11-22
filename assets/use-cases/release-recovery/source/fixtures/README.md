# Fictional Jira snapshots

These CSV files are teaching inputs, not exports from a real organization.
`import-profile.json` declares their exact release, build, validation environment,
source columns and remaining-QA-hours unit.

- `jira-release.csv`: two core issues total 12 hours; reporting totals eight.
  The core-checkout issue blocks reporting. That relationship aligns with the
  bounded app's primary/integration phases; the adapter retains it for deliberate
  review rather than converting arbitrary links into a new schedule.
- `jira-missing-estimate.csv`: one core estimate is blank. The entire core total
  remains unknown; the known seven hours must not become the package total.
- `jira-external-dependency.csv`: `OPS-42` blocks core checkout but is absent from
  the snapshot. Its key/direction remain visible with a blocking diagnostic.

The reporting issue intentionally says `Done` while retaining a remaining QA
estimate. Jira workflow status is not acceptance evidence for this example.
Review conflicting source meaning rather than silently treating its work as zero.

Issue update timestamps and snapshot capture time are preserved; the adapter does
not decide whether they remain fresh enough for a later operating commitment.
Staffing intervals, qualification, spending boundaries, prerequisite satisfaction,
scope/date acceptance and release permission are separate case inputs.
