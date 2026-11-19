# Promotion workflow verification

Implemented the shared integer operators, feasibility-only commitment mode,
portable CLI authoring example, reviewed case sequence and generic form-to-Excel
fallback. The promotion has no custom evaluator or React renderer.

## Checked outputs

- [Installable workflow](consumer/author/promotion.workflow.json)
- [Reviewed author draft](consumer/author/reviewed.workflow-draft.json)
- [Sam's completed case](consumer/decision/run.json)
- [Complete decision output](consumer/decision/complete.output.json)
- [Changed-staffing case](consumer/changed-staffing/run.json)
- [Installed-package qualification](consumer/qualification.json)
- [Browser qualification](consumer/browser-qualification.json)
- [Exact npm candidates](npm/manifest.json)

The external consumer check copies only the portable sample, installs ordinary
SDK/CLI archives offline into a temporary project, and runs the complete public
CLI journey. It also changes a question's meaning without changing its ID and
checks that the old fictional binding reviews cannot publish it.

## Results

| Verification | Result |
| --- | --- |
| SDK suite, final source | 445 passed |
| CLI suite | 122 passed |
| React views suite | 31 passed |
| Workbook suite including the new form fallback | 44 passed |
| Focused inspection/form-fallback checks | 8 passed |
| Authored operating scenarios | 9 passed; 28 expectations |
| Authored workflow scenarios | 12 passed; 43 expectations |
| Public CLI journey and outside-checkout package qualification | Passed |
| Production build and documentation links | Passed |
| Exact package import, case continuation, Excel download and UI reassessment | Passed; see browser receipt |

The broad foundation run completed 1,494 tests: 1,486 passed and eight failed.
One stale inspection test was updated to explicitly select the supporting
assessment and verify its current concise view; its focused suite now passes.
The remaining seven failures were reproduced on an isolated, rebuilt checkout
of unchanged HEAD `666d75b` (30 tests, 23 passed, seven identical failures).
They concern older expectations for fixture case IDs, saved navigation and exact
YAML source bytes. They are not promotion regressions and remain unresolved.

## Scope

Option charges are pinned to this workflow's app defaults. Workers can change
staffing, same-day timing, access, spending limits/delegation and economic
assumptions. Contribution changes update thresholds; the current-choice gate
binds to the operating assessment and does not automatically request a new
choice for changed economics. Excel covers declared scalar fields; unsupported
array records and nullable decision records remain in the normal forms.

The five-guest result is conditional cost coverage, not a forecast. Sam's
specific authorization is a recorded assertion, not authentication or dispatch.
