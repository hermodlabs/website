"""Bind reviewed estimates to the existing planning and learning contracts.

This module is an adapter, not a second decision engine. Complete planning runs
supply operational eligibility; the learning evaluator chooses among the
remaining responses. A probability never establishes transportation readiness.
"""

from __future__ import annotations

import copy
import json
from datetime import datetime, timezone
from pathlib import Path

from decision_lab import DecisionLab, EXECUTION_STATUS

DATA = Path(__file__).resolve().parent / "data"
STUDY = "registration_check"
STATES = ("registered", "not_registered")
REPORTS = ("confirmed_registered", "confirmed_not_registered", "no_result")
TIME_ORIGIN = datetime.fromisoformat("2026-11-17T00:00:00-06:00")
QUALIFICATION = (
    "Fictional teaching inputs. A prediction is not confirmation; accepting an "
    "estimate is not purchase permission, a freight reservation or completed work."
)


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save(lab: DecisionLab, path: Path, value: dict) -> None:
    path.write_text(lab.sources.render_json(value, max_bytes=50_000_000), encoding="utf-8")


def load_apps(lab: DecisionLab) -> tuple[dict, dict, dict]:
    """Use the pinned authored packages, not whatever apps happen to be installed."""
    config = load_json(DATA / "config.json")
    apps = {}
    for name in ("planning", "learning"):
        app = lab.apps.open(lab.sources.parse_artifact((DATA / f"{name}.app.json").read_text()))
        if app["contentHash"] != config["packages"][name]["contentHash"]:
            raise ValueError(f"The {name} app differs from its reviewed package pin.")
        apps[name] = app
    return apps["planning"], apps["learning"], config


def validate_business_case(business: dict) -> None:
    if not isinstance(business.get("id"), str) or not business["id"].strip():
        raise ValueError("A shipment case needs an id.")
    instant = datetime.fromisoformat(business["asOf"].replace("Z", "+00:00"))
    if instant.tzinfo is None:
        raise ValueError("asOf needs an explicit UTC offset.")
    elapsed = (instant - TIME_ORIGIN).total_seconds() / 60
    if elapsed < 0 or not elapsed.is_integer():
        raise ValueError("asOf must be a whole minute within the authored shipment horizon.")
    now = business["planning"]["currentTime"]
    if isinstance(now, bool) or now != elapsed:
        raise ValueError("planning.currentTime must match asOf relative to the declared time origin.")
    for field in ("feeMinor", "durationMinutes", "responseMinutes"):
        value = business["check"][field]
        if type(value) is not int or value < 0:
            raise ValueError(f"check.{field} must be a nonnegative whole number.")


def planning_case(base: dict, business: dict, *, study: bool) -> dict:
    """Supply values to authored rules; retain both logical registration states."""
    inputs = copy.deepcopy(base["case"])
    supplied = copy.deepcopy(business["planning"])
    tables = supplied.pop("tables", {})
    reserved = {"actionReady", "studyFee", "studyFeeAt"}
    if reserved.intersection(supplied):
        raise ValueError("Action timing and study fees are derived from the check input.")
    if set(tables).intersection({"states", "scenarios", "readiness"}):
        raise ValueError("This example retains the authored logical states and readiness meanings.")
    inputs["parameters"].update(supplied)
    inputs["tables"].update(tables)
    check, parameters = business["check"], inputs["parameters"]
    now = parameters["currentTime"]
    parameters.update(
        actionReady=now + check["durationMinutes"] + check["responseMinutes"] if study else now,
        studyFee=check["feeMinor"] if study else 0,
        studyFeeAt=now,
    )
    if {row["id"] for row in inputs["tables"]["arrangements"]} != {"direct", "backup"}:
        raise ValueError("This app compares the authored direct and backup action meanings.")
    inputs["id"] = f"{business['id']}-{'check' if study else 'now'}"
    inputs["provenance"].append({"id": "CURRENT-BUSINESS-CASE", "caseId": business["id"],
                                 "asOf": business["asOf"], "qualification": QUALIFICATION})
    return inputs


def evaluate(lab: DecisionLab, app: dict, inputs: dict, business: dict, tag: str) -> dict:
    run = lab.run(app=app, case=inputs, timeout_ms=30_000,
                  run_id=f"{business['id'].lower()}-{tag}", created_at=business["asOf"])
    if run["execution"]["status"] != EXECUTION_STATUS.COMPLETED:
        raise ValueError(f"The {tag} evaluation did not finish; no recommendation is asserted.")
    return run


def resolve_planning(lab: DecisionLab, run: dict) -> dict:
    result = lab.commitment.resolve_commitment_assessment(run["assessment"], run["report"])
    if not lab.commitment.is_assessment_complete(result):
        raise ValueError("A complete current planning assessment is required for this handoff.")
    return result


def summarize_planning(lab: DecisionLab, run: dict) -> dict:
    result = resolve_planning(lab, run)
    module = run["input"]["model"]["module"]
    constraints = {row["id"]: module["labels"].get(f"constraint.{row['id']}", row["id"])
                   for row in module["constraints"]}
    preferred = set((result.get("recommendation") or {}).get("tiedPlanIds", []))
    plans = []
    for plan in result["plans"]:
        plans.append({"id": plan["id"], "action": plan["choices"]["arrangement"],
            "feasible": plan["feasible"], "expenseMinor": plan["expense"],
            "peakCashMinor": max(s["finance"]["peakCash"] for s in plan["scenarios"]),
            "blockers": [{**row, "label": constraints[row["constraintId"]]} for row in plan["blockers"]],
            "scenarios": [{"stateId": s["inputs"]["stateId"], "passed": s["passed"],
                "failedChecks": [{"id": c["id"], "label": constraints[c["id"]]}
                                 for c in s["constraints"] if not c["passed"]]} for s in plan["scenarios"]]})
    return {"complete": True, "feasible": lab.commitment.has_feasible_witness(result), "plans": plans,
            "preferredActionIds": [p["choices"]["arrangement"] for p in result["plans"] if p["id"] in preferred],
            "runHash": lab.hashing.canonical_hash(run),
            "actionReadyMinute": run["input"]["model"]["case"]["parameters"]["actionReady"]}


def learning_case(lab: DecisionLab, base: dict, business: dict, proposal: dict,
                  contexts: dict[str, dict]) -> dict:
    """Map exact current planning results into the public learning contract.

    The no-result branch retains both states even if its fitted frequency is
    zero. Trusted scoped confirmations have fixed logical meanings; the ML
    model supplies their frequencies, not their evidentiary authority.
    """
    inputs = copy.deepcopy(base["case"])
    now_case = contexts["no-study"]["input"]["model"]["case"]
    parameters, check = now_case["parameters"], business["check"]
    probability = proposal["probabilityRegistered"]
    inputs.update(id=f"{business['id']}-learning", currentTime=parameters["currentTime"],
                  cashBudget=parameters["cashLimit"])
    inputs["probabilityBasis"] = {"source": "Proposed model basis " + lab.hashing.canonical_hash(proposal),
                                  "scope": inputs["scope"]}
    inputs["priors"] = [{"state": "registered", "probability": probability},
                        {"state": "not_registered", "probability": 1 - probability}]
    inputs["acceptedFacts"] = []
    baseline = resolve_planning(lab, contexts["no-study"])
    inputs["actions"] = [{"action": plan["choices"]["arrangement"],
        "cash": max(s["finance"]["peakCash"] for s in plan["scenarios"]),
        "deadline": parameters["reservationDeadline"]} for plan in baseline["plans"]]
    # Read complete operating expenses from the planner. A study-context check
    # below verifies that the learning contract may subtract its fee once.
    expenses = {(plan["choices"]["arrangement"], s["inputs"]["stateId"]): s["finance"]["expense"]
                for plan in baseline["plans"] for s in plan["scenarios"]}
    inputs["payoffs"] = [{"action": action, "state": state, "value": -expense}
                         for (action, state), expense in expenses.items()]
    duration = check["durationMinutes"] + check["responseMinutes"]
    inputs["studies"] = [{"study": STUDY, "fee": check["feeMinor"], "duration": duration,
                          "likelihoods": copy.deepcopy(proposal["likelihoods"])}]
    stamps, eligibility = [], []
    for context_id, run in contexts.items():
        result = resolve_planning(lab, run)
        current = run["input"]["model"]["case"]["parameters"]
        stamps.append({"context": context_id, "currentTime": current["currentTime"],
                       "fee": current["studyFee"], "duration": current["actionReady"] - current["currentTime"],
                       "cashBudget": current["cashLimit"]})
        run_hash = lab.hashing.canonical_hash(run)
        for plan in result["plans"]:
            if not plan["complete"]:
                raise ValueError("Every response needs a complete planning check.")
            for scenario in plan["scenarios"]:
                state = scenario["inputs"]["stateId"]
                if scenario["finance"]["expense"] != expenses[(plan["choices"]["arrangement"], state)] + current["studyFee"]:
                    raise ValueError("The check changes operating expense beyond its fee; this bounded learning binding must be reviewed.")
                eligibility.append({"context": context_id, "action": plan["choices"]["arrangement"],
                    "state": state, "eligible": scenario["passed"],
                    "reasons": [c["id"] for c in scenario["constraints"] if not c["passed"]],
                    "source": f"decision-lab-run:{run_hash}#plan={plan['id']}&state={state}"})
    report_support = copy.deepcopy(base["case"]["executionFeasibility"]["reportSupport"])
    inputs["executionFeasibility"] = {"admittedStateIds": list(STATES), "contexts": stamps,
                                      "reportSupport": report_support, "eligibility": eligibility}
    return inputs


def summarize_learning(lab: DecisionLab, run: dict) -> dict:
    result = run["assessment"]
    if result["status"] != lab.learning.LEARNING_ASSESSMENT_STATUS.COMPLETE or not result["coverage"]["complete"]:
        raise ValueError("An incomplete learning assessment cannot support this comparison.")
    study, baseline, recommendation = result["studies"][0], result["baseline"], result["recommendation"]
    responses = []
    for branch in study["branches"]:
        actions = branch["bestActionIds"]
        responses.append({"reportId": branch["id"], "label": branch["label"],
            "probability": branch["probability"], "actionId": actions[0] if actions else None,
            "actionIds": actions, "available": bool(branch["eligibleActionIds"]),
            "supportedStateIds": branch["supportedStateIds"],
            "reason": "; ".join(reason for entry in branch.get("eligibility", [])
                                 for reason in entry["reasons"]) if not actions else "",
            "expectedCostMinor": -branch["expectedPayoff"] if branch["expectedPayoff"] is not None else None})
    ids = recommendation["bestIds"]
    return {"status": "assessed", "reason": None,
        "baselineCostMinor": -baseline["expectedPayoff"] if baseline["expectedPayoff"] is not None else None,
        "expectedCostMinor": -study["netValue"] if study["netValue"] is not None else None,
        "netBenefitMinor": study["incrementalValue"], "studyFeasible": study["feasible"],
        "recommendedOption": ids[0] if ids else None, "recommendedOptionIds": ids,
        "responses": responses, "reasons": study["reasons"], "completionTimeMinute": study["completionTime"]}


def assess_case(lab: DecisionLab, business: dict, proposal: dict, output: Path,
                *, reviewer: str | None = None) -> dict:
    validate_business_case(business)
    planning_app, learning_app, config = load_apps(lab)
    planning_base = load_json(DATA / "planning.model.json")
    learning_base = load_json(DATA / "learning.model.json")
    contexts, planning = {}, {}
    files = {"case": "business.case.json", "proposal": "estimates.proposal.json"}
    save(lab, output / files["case"], business)
    save(lab, output / files["proposal"], proposal)
    for label, context_id in (("baseline", "no-study"), ("study", STUDY)):
        inputs = planning_case(planning_base, business, study=label == "study")
        run = evaluate(lab, planning_app, inputs, business, f"planning-{label}")
        contexts[context_id] = run
        planning[label] = summarize_planning(lab, run)
        for suffix, value in (("case", inputs), ("model", run["input"]["model"]), ("run", run),
                              ("report", run["report"]), ("assessment", resolve_planning(lab, run)),
                              ("bound-case", lab.cases.create(app=planning_app, inputs=inputs))):
            filename = f"planning-{label}.{suffix}.json"
            save(lab, output / filename, value)
            files[f"planning-{label}-{suffix}"] = filename
    status = "unsupported" if not proposal["supported"] else "accepted" if reviewer else "awaiting-review"
    accepted_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z") if reviewer and proposal["supported"] else None
    review = {"reviewer": reviewer, "acceptedAt": accepted_at,
              "basisHash": lab.hashing.canonical_hash(proposal), "qualification": QUALIFICATION} if accepted_at else None
    reason = "; ".join(proposal["reasons"]) if not proposal["supported"] else "The proposed numerical basis needs explicit reviewer acceptance."
    preferred_costs = [p["expenseMinor"] for p in planning["baseline"]["plans"]
                       if p["action"] in planning["baseline"]["preferredActionIds"]]
    learning = {"status": "unassessed", "reason": reason,
                "baselineCostMinor": min(preferred_costs) if preferred_costs else None, "expectedCostMinor": None,
                "netBenefitMinor": None, "studyFeasible": None, "recommendedOption": None,
                "recommendedOptionIds": [], "responses": [], "reasons": [], "completionTimeMinute": None}
    sensitivity = []
    proposed_case = learning_case(lab, learning_base, business, proposal, contexts) if proposal["supported"] else None
    save(lab, output / "learning.proposal.json", {"format": "shipment-learning-input-proposal/1",
        "status": status, "review": review, "case": proposed_case, "reason": None if proposed_case else reason})
    files["learning-proposal"] = "learning.proposal.json"
    if reviewer and proposal["supported"]:
        save(lab, output / "estimates.review.json", review)
        files["estimates-review"] = "estimates.review.json"
        proposed_case["probabilityBasis"]["source"] = (
            f"Numerical basis accepted by {reviewer}; proposal {review['basisHash']}")
        run = evaluate(lab, learning_app, proposed_case, business, "learning")
        learning = summarize_learning(lab, run)
        for suffix, value in (("case", proposed_case), ("model", run["input"]["model"]), ("run", run),
                              ("report", run["report"]),
                              ("bound-case", lab.cases.create(app=learning_app, inputs=proposed_case))):
            filename = f"learning.{suffix}.json"
            save(lab, output / filename, value)
            files[f"learning-{suffix}"] = filename
        # These are explicit what-if assumptions, not confidence bounds. The
        # same fresh operating checks remain valid because only priors change.
        for probability in (0.1, 0.3, 0.5, 0.7, 0.9):
            scenario = copy.deepcopy(proposed_case)
            scenario["priors"] = [{"state": "registered", "probability": probability},
                                  {"state": "not_registered", "probability": 1 - probability}]
            scenario["probabilityBasis"]["source"] = f"Illustrative sensitivity assumption p(registered)={probability}; not a confidence interval."
            label = f"sensitivity-{int(probability * 100)}"
            sweep = evaluate(lab, learning_app, scenario, business, label)
            row = summarize_learning(lab, sweep)
            sensitivity.append({"probabilityRegistered": probability, "expectedCostMinor": row["expectedCostMinor"],
                "netBenefitMinor": row["netBenefitMinor"], "studyFeasible": row["studyFeasible"],
                "recommendedOption": row["recommendedOption"], "qualification": "Illustrative assumption, not a confidence interval."})
            save(lab, output / f"{label}.run.json", sweep)
            files[label] = f"{label}.run.json"
    if learning["status"] == "assessed":
        if learning["recommendedOption"] == STUDY:
            next_action = "Propose the registration check, then choose only a response supported by its actual scoped result."
        elif learning["recommendedOption"] == "no-study":
            next_action = "Propose the feasible backup arrangement without purchasing this check."
        else:
            next_action = "Revise the shipment alternatives or constraints; no supported choice is established."
    elif planning["baseline"]["feasible"]:
        next_action = "The backup remains a feasible proposal. Review the numerical basis before comparing a check with acting now."
    else:
        next_action = "Resolve the planning blockers before treating any arrangement as a usable proposal."
    p, c = business["planning"], business["check"]
    return {"format": "shipment-readiness-learning-summary/1", "id": business["id"], "caseId": business["id"],
        "title": business.get("title", "Should we check registration before reserving freight?"), "asOf": business["asOf"],
        "currency": "USD", "amountUnit": "cent", "timeUnit": "minute", "qualification": QUALIFICATION,
        "nextAction": next_action, "caseFeatures": business["features"],
        "timing": {"currentMinute": p["currentTime"], "reservationDeadlineMinute": p["reservationDeadline"],
            "resultReadyMinute": p["currentTime"] + c["durationMinutes"],
            "responseReadyMinute": p["currentTime"] + c["durationMinutes"] + c["responseMinutes"]},
        "estimates": {"status": status, "proposal": proposal, "reasons": proposal["reasons"], "review": review},
        "planning": planning, "learning": learning, "sensitivity": sensitivity,
        "packages": config["packages"], "files": files}
