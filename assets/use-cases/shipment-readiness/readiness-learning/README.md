# Python machine learning integration with Decision Lab

This article uses the standalone Python `shipping/readiness-learning` sample at
public repository commit `f3584a5ec5aef6594b640b5e9d10f8e06041d4eb`.

The article follows Python model inference, the adapter into authored case inputs,
public Python SDK evaluation and the application report. The fee comparison
demonstrates the same model feeding a changed decision context.

The original SVG use-case and component views have separate desktop and mobile
layouts (`use-case-view*.svg` and `component-view*.svg`). The use-case view separates
the analyst's calculation and Maya's use of the report from actual checking,
spending authorization and freight reservation. The component view distinguishes
sample-specific Python code, the public SDK and authored configuration artifacts.
It shows complete planning findings returning through the adapter into the
information-value assessment, with model training outside the assessment path.
These are explanatory architecture illustrations, not captured application screens.
The article uses selected viewpoints informed by Kruchten's 4+1 model rather than
presenting a complete five-view architecture specification.

The five reports under `reports/` are the sample's original qualified outputs,
copied byte for byte from its retained article run. They are not newly trained
or recalculated results. `qualification.json` is the original historical receipt.
All 131 output hashes and every qualified source hash matched before capture.
`public-source.json` records the published Git tree identities of all 25 sample
files, independently compared with the local source. The source files used for
excerpts are retained under `source/`.

`scripts/capture-shipment-readiness-learning.mjs` opens those actual local HTML
reports in Chrome. It captures the native finding and metrics at a responsive
640-pixel viewport and the complete report at 1280 pixels. It changes no DOM,
CSS, inputs, numerical results or report text. The five mobile layouts and their
model-validation disclosures were checked at 390 pixels. `verification.json`
records source identities, output hashes, PNG hashes and dimensions, and the
specific changed fields in each matched comparison.

The fee comparison changes only `check.feeMinor`; the timing comparison changes
only `check.durationMinutes`. Scenario IDs and titles identify separate artifacts.
All four features, the proposed probabilities, pinned app packages, arrangement
prices, permissions and reservation cutoff remain unchanged across those pairs.

The report is a separate Python application's interface. It is not a screenshot
of the Marketplace workflow or proof that its new calculation UI has an ML
integration. The sample's explicit numerical-basis acceptance is an application
policy, distinct from the per-answer and per-result acceptance steps removed
from current Marketplace calculation workflows.

The source history contains 1,200 synthetic teaching records. The probability,
check-result frequencies, expected costs and sensitivity results are conditional
illustrations. They establish no real supplier prediction quality, observed
savings, completed check, purchase, freight reservation or delivery. Authoritative
confirmation meanings are authored; a prediction cannot establish registration.

The timely case supports a check-and-response proposal with expected total cost
$5,772.96, compared with the supported $6,000 fallback now. A $2,500 fee reverses
the preference. A 15:00 response misses the noon cutoff. Unsupported model inputs
leave learning value unassessed while retaining the planning finding. The full
SDK artifacts and report links preserve those distinctions.
