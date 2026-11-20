# Why a Complete Plan Is Only the Beginning

*Completeness, feasibility, established preference, and human acceptance answer different questions. Planning keeps those questions open when circumstances change.*

**Jonathan Nacionales, Founder, Hermod Labs**  
November 18, 2026

“Plans are worthless, but planning is everything.”

Dwight D. Eisenhower used those words at the National Defense Executive Reserve Conference on November 14, 1957, introducing them as a saying he had heard in the Army. His explanation concerned preparation for emergencies: events would differ from the anticipated situation, while the understanding developed through planning would help people respond intelligently.[^eisenhower]

That gives us a useful question for business planning. When a plan changes, what understanding do we need to preserve?

Consider a shipment recommendation. We need to know what the proposal includes, which conditions allow it to work, and why anyone prefers it to the alternatives. We also need to know who has accepted the next action. A single label such as “complete” cannot carry all of those meanings.

Our interpretation of Eisenhower’s point starts there: planning develops the basis for a proposal and helps us recognize when that basis needs reconsideration.

Maya’s shipment story makes the distinction concrete. The people, records, and outcomes in this article’s shipment and gifting examples are fictional teaching cases.

Maya has a revised purchase order and a $5,000 expense limit. Direct shipping costs $4,000 and arrives Friday at noon. Consolidated freight costs $5,000 and arrives Thursday at 6 p.m. The launch team wants the earlier arrival, but the consolidation confirmation still names the previous order revision.[^shipment-cli]

The proposed Consolidated arrangement can specify the route, timing, resources, and supporting records. That makes it definite enough to examine. It does not make the old confirmation applicable to the revised order.

**Arrangement completeness asks whether the required choices have been resolved.** A proposal that leaves the carrier or a necessary task owner undecided is unfinished in that respect. A proposal that fills every required position can still fail a constraint. Assigning someone to a task does not establish that they are available when the task must happen.

Completeness also depends on scope. If the commitment includes preparation, transport, and receipt, a transport choice alone cannot cover it. If an important obligation was omitted from the model, completing the modeled arrangement does not establish that the real commitment has been covered.

There is another meaning of completion to keep separate: finishing the assessment. In the examples discussed here, the case must have been validly admitted for evaluation, the evaluation must have finished, and the declared search must have been covered completely. These conditions concern what was assessed, not whether a passing plan exists.

An assessment may finish checking its declared alternatives and establish that none passes. That is a completed investigation with a negative business finding. Alternatively, a search may stop early with some candidates still unchecked. Both situations can leave a team without a recommendation, but they call for different responses.

A completed command, a complete assessment, and a complete retained report also describe different things. The command has an execution outcome. The assessment has an evaluation and coverage claim. The report has a retention claim about the material available to inspect. A finished command or fully retained document does not by itself establish that a shipment can proceed.

**Feasibility asks whether the choices satisfy the applicable requirements together, under the stated conditions.** In Maya’s case, the confirmation must cover the actual order and movement. Timing and spending must also fit. Checking these conditions together matters because a locally attractive choice may depend on something the full proposal cannot supply.

A complete, checked plan that passes the required conditions provides a *feasible witness*. It supports an existence claim: at least one arrangement works within the assessment’s declared basis. Finding such a witness can be useful even when other candidates remain unexplored. It does not establish how that witness compares with every unchecked candidate.

This is also a scoped claim. The supplied records, modeled requirements, and treatment of uncertainty determine what has been established. Whether those records are authentic and whether the model fits the operation remain responsibilities for the people using the assessment.

**Established preference answers a comparative question.** Given the alternatives, information, and decision criteria, what supports preferring one arrangement over another?

Maya receives a new consolidation confirmation for the revised order. With the remaining conditions satisfied, Consolidated now passes. Direct continues to pass too. The example’s priority is earliest arrival among passing arrangements, so Consolidated becomes preferred. Its additional $1,000 buys the earlier arrival while remaining within the expense limit.[^shipment-sdk]

The comparison has a reason that finance and launch can inspect. Lower cost alone does not determine the answer because the declared priority values earlier arrival first. A different priority could produce a different preference.

“Established” therefore belongs with an explicit basis: preferred by whose criteria, among which alternatives, using which information? Evidence helps establish the consequences of a choice. The decision owner supplies the priorities used to judge those consequences.

A preference can also be established without producing a unique winner. If several alternatives tie under the declared rule, retaining all of them is a valid result. A tie means the comparison supports equal standing under that rule. It differs from an unfinished comparison or missing information that prevents a preference from being established. Choosing an arbitrary first row would conceal that distinction.

Three possible assessment outcomes show why the claims need separate names:

| Retained assessment outcome | Assessment complete? | Checked feasible witness? | Preference established? |
| --- | --- | --- | --- |
| The declared evaluation finishes and no admitted plan passes | Yes | No | No |
| A limited search finds a fully checked passing plan, with coverage and ranking still unresolved | No | Yes | No |
| A complete assessment supports several alternatives tied under its preference rule | Yes | Yes | Yes |

Finding one fully checked witness can establish scoped feasibility. Establishing that no candidate works, or that a candidate is best, requires the relevant coverage or another sound proof or bound. Exhaustive enumeration is one way to supply that support; it is not the only possible method. The published examples use their declared completion and coverage contracts before presenting a ranked proposal.

Diagnostics matter for the same reason. A missing required input, an unavailable assessment, and a completed finding that no plan passes are different findings. They should direct attention to different work: correct the input, obtain a usable assessment, or change the arrangements or conditions. An empty recommendation list alone cannot tell a team which response is appropriate.

**Human acceptance answers a further question: who has accepted which action on the basis of this proposal?**

Existing permissions may already be requirements inside a feasibility assessment. That still leaves the responsible person’s decision about the particular proposal and next action. A calculated preference supports that decision; it does not record it.

A useful acceptance record would identify the proposal and reviewed basis, the person accepting it, the action covered, and any conditions. People can make conditional decisions under uncertainty. Recording acceptance should preserve those limitations so that later readers understand the commitment actually made.

Acceptance also leaves execution to be observed. Accepting a shipment proposal does not establish that freight was reserved or goods delivered. Those later events need their own records.

Leah’s gift-kit story shows the same distinctions in a different operation. She must prepare 120 usable kits within a $600 correction limit. An in-house correction costs $300 and finishes 40 minutes after the case’s starting point. An external correction would finish after 25 minutes for $400, but its confirmation covers an old insert revision. Once a separately supplied confirmation covers the current insert, the external package becomes preferred under the declared earlier-handoff priority. The in-house package remains feasible.[^gifting-sdk]

Another campaign has an hour left before its cutoff, yet its recorded availability, permissions, and external confirmation have already expired. Finishing before the deadline would not satisfy those other requirements. The completed assessment finds no passing package under the supplied conditions.[^gifting-cli]

These outcomes tell Leah what needs attention. One case has a supported proposal whose extra expense needs review. Another needs records that cover the intended work or a revised plan. Neither outcome can be communicated adequately by saying that the review is simply “done.”

The questions also explain what planning must preserve when something changes. A new confirmation can change feasibility. A new price can change preference while leaving an arrangement feasible. A newly discovered obligation can change what counts as complete. An earlier acceptance may cover only the proposal and conditions reviewed at that time.

These are revisable claims, rather than stages completed once and forgotten. Planning connects a changed fact to the conclusions and commitments it affects. That is the practical connection we draw from Eisenhower’s observation.

Decision Lab’s current shipment and gifting CLI/SDK walkthroughs make those distinctions inspectable. They retain the case basis and calculated findings while keeping human review and operating action separate. Their public helpers also give integrations names for the questions: `inspectReportCompleteness`, `isAssessmentComplete`, `hasFeasibleWitness`, and `hasEstablishedPreference`. `inspectAssessmentCompleteness` supplies structured completion diagnostics. These helpers inspect retained metadata and assessment claims. Evaluating the model, checking source records, and accepting an action remain separate responsibilities.

The four walkthroughs follow the business situations into implementation:

- [The purchase orders changed. Which shipment recommendations need review again?](https://hermodlabs.com/use-cases/supply-chain/shipment-readiness/review-changed-orders/index.html) follows revised orders into a CLI exception report, preserving the difference between changed proposals, blocked shipments, and input problems.
- [Resolve a shipment exception with the Decision Lab SDK.](https://hermodlabs.com/use-cases/supply-chain/shipment-readiness/resolve-a-shipment-exception/index.html) follows Maya’s new confirmation into a reassessment and an explainable shipment proposal.
- [A day to prepare. Which gift-kit campaigns need attention?](https://hermodlabs.com/use-cases/gifting/gift-kit-readiness/screen-campaigns/index.html) follows repeated campaign reviews into an owner’s working list and an individual case handoff.
- [Build a gift-kit app with the Decision Lab SDK.](https://hermodlabs.com/use-cases/gifting/gift-kit-readiness/resolve-a-handoff-exception/index.html) follows Leah’s revised confirmation through complete assessment, feasible packages, and established preference.

The standalone examples leave acceptance and operational execution with the responsible people and their process. Their results remain bounded by the supplied choices, scenarios, and records. Applying them to shared trucks, workers, or budgets requires a model that represents those shared demands.

Before treating a proposal as ready for action, finish this statement:

> This proposal covers ________. We have established ________ under ________. We prefer ________ because ________. Acceptance of the next action is ________, with ________ responsible and these conditions: ________. We must reconsider if ________ changes.

When the situation changes, those answers give the team a place to begin again.

[^eisenhower]: Eisenhower Presidential Library, [“Quotes”](https://www.eisenhowerlibrary.gov/eisenhowers/quotes), identifying the November 14, 1957 remarks. The [full speech](https://www.presidency.ucsb.edu/documents/remarks-the-national-defense-executive-reserve-conference), retained by the American Presidency Project, supplies the emergency-planning context. The distinctions developed here are our interpretation, not a framework attributed to Eisenhower.
[^shipment-cli]: Hermod Labs, [“The purchase orders changed. Which shipment recommendations need review again?”](https://hermodlabs.com/use-cases/supply-chain/shipment-readiness/review-changed-orders/index.html). Fictional orders and supporting records; the example retains a fixed review-time basis.
[^shipment-sdk]: Hermod Labs, [“Resolve a shipment exception with the Decision Lab SDK.”](https://hermodlabs.com/use-cases/supply-chain/shipment-readiness/resolve-a-shipment-exception/index.html). The new confirmation changes the supplied record while retaining the example’s other conditions and review clock.
[^gifting-cli]: Hermod Labs, [“A day to prepare. Which gift-kit campaigns need attention?”](https://hermodlabs.com/use-cases/gifting/gift-kit-readiness/screen-campaigns/index.html). The late blocked campaign is GIFT-222; it is assessed independently with its recorded resources and permissions.
[^gifting-sdk]: Hermod Labs, [“Build a gift-kit app with the Decision Lab SDK.”](https://hermodlabs.com/use-cases/gifting/gift-kit-readiness/resolve-a-handoff-exception/index.html). The finish positions are T+40 minutes and T+25 minutes on the fictional case clock. The confirmation change concerns GIFT-221; the article also explains limited searches and valid preferred ties.
