"""Propose numerical premises from a locally trained, reviewed model bundle.

Predictions do not establish registration and never supply operating permission.
Only open trusted bundles: joblib is a Python serialization format, not a safe
format for models downloaded from an untrusted source. The hashes below detect
accidental changes; they are not publisher authentication.
"""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import scipy
import sklearn


FEATURES = (
    "portal_listing_age_days", "prior_shipments_90d",
    "days_since_scope_change", "open_setup_tasks",
)
STATES = ("registered", "not_registered")
REPORTS = ("confirmed_registered", "confirmed_not_registered", "no_result")
ALLOWED_REPORTS = {
    "registered": ("confirmed_registered", "no_result"),
    "not_registered": ("confirmed_not_registered", "no_result"),
}
BUNDLE_SCHEMA = 1


def iso_time(value: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError("Timestamp must be an ISO 8601 string with a timezone.")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("Timestamp must include a timezone.")
    return parsed.astimezone(timezone.utc)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def dependency_versions() -> dict[str, str]:
    return {
        "scikit-learn": sklearn.__version__, "pandas": pd.__version__,
        "numpy": np.__version__, "scipy": scipy.__version__, "joblib": joblib.__version__,
    }


def calibrated_probabilities(bundle: dict[str, Any], frame: pd.DataFrame) -> np.ndarray:
    scores = bundle["classifier"].decision_function(frame).reshape(-1, 1)
    return bundle["calibrator"].predict_proba(scores)[:, 1]


def validate_features(features: Any, contract: dict[str, Any], observed_ranges: dict[str, Any] | None = None) -> list[str]:
    if not isinstance(features, dict):
        return ["Features must be an object containing the four at-decision measurements."]
    errors = []
    unknown = set(features) - set(FEATURES)
    if unknown:
        errors.append("Unexpected features: " + ", ".join(sorted(unknown)) + ".")
    for name in FEATURES:
        value = features.get(name)
        if type(value) is not int:
            errors.append(f"{name} must be an integer; an unknown measurement cannot be imputed by this example.")
            continue
        bounds = contract[name]
        if not bounds["minimum"] <= value <= bounds["maximum"]:
            errors.append(f"{name} is outside the authored feature contract [{bounds['minimum']}, {bounds['maximum']}].")
        elif observed_ranges and not observed_ranges[name]["minimum"] <= value <= observed_ranges[name]["maximum"]:
            errors.append(f"{name} is outside the ranges observed in training; extrapolation is not qualified.")
    return errors


def estimate(model_dir: Path, features: dict[str, Any], as_of: str) -> dict[str, Any]:
    """Return supported estimates or explicit reasons with no invented numbers.

    This application is intentionally bounded to the population and feature
    contract documented in the training bundle. `supported` means that this
    example's checks passed, not that a reviewer has accepted the model's basis.
    """
    result: dict[str, Any] = {
        "supported": False, "reasons": [], "probabilityRegistered": None,
        "likelihoods": [], "provenance": {}, "validation": {},
    }
    try:
        manifest_path = Path(model_dir) / "manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest.get("schemaVersion") != BUNDLE_SCHEMA:
            raise ValueError("Unsupported model-bundle schema version.")
        for name in ("model.joblib", "validation.json", "check-statistics.json", "training-policy.json"):
            expected = manifest["files"][name]
            if not isinstance(expected, str) or sha256(Path(model_dir) / name) != expected:
                raise ValueError(f"Model-bundle integrity check failed for {name}.")
        for name, version in dependency_versions().items():
            if manifest["dependencyVersions"].get(name) != version:
                raise ValueError(f"{name} version differs from the training bundle; retrain with the installed dependencies.")
        policy = json.loads((Path(model_dir) / "training-policy.json").read_text(encoding="utf-8"))
        validation = json.loads((Path(model_dir) / "validation.json").read_text(encoding="utf-8"))
        checks = json.loads((Path(model_dir) / "check-statistics.json").read_text(encoding="utf-8"))
        result["validation"] = validation
        result["provenance"] = {
            "modelId": manifest["modelId"], "modelSha256": manifest["files"]["model.joblib"],
            "manifestSha256": sha256(manifest_path), "datasetSha256": manifest["datasetSha256"],
            "trainingPopulation": manifest["population"], "synthetic": manifest["synthetic"],
            "featureContract": manifest["featureContract"], "splitBounds": manifest["splitBounds"],
            "latestQualifiedObservationAt": manifest["latestQualifiedObservationAt"], "ignoredRows": manifest["ignoredRows"],
            "dependencyVersions": manifest["dependencyVersions"], "asOf": as_of,
            "basis": "Proposed calibrated probabilities and observed state-conditional check frequencies; reviewer acceptance is separate.",
            "likelihoodBasis": checks,
        }
        result["reasons"].extend(validate_features(features, manifest["featureContract"], manifest["trainingFeatureRanges"]))
        when = iso_time(as_of)
        if when < iso_time(policy["validationCompletedAt"]):
            result["reasons"].append("The model's held-out validation was not yet available at the requested decision time.")
        age_days = (when - iso_time(manifest["latestObservationAt"])).total_seconds() / 86400
        if age_days > policy["maximumHistoryAgeDays"]:
            result["reasons"].append("The historical population is older than the authored maximum age; reassess or retrain before using estimates.")
        if validation.get("qualified") is not True:
            result["reasons"].extend(validation.get("qualificationReasons") or ["The model did not pass the declared held-out qualification policy."])
        if checks.get("qualified") is not True:
            result["reasons"].extend(checks.get("qualificationReasons") or ["There are insufficient historical check results."])
        if result["reasons"]:
            return result
        bundle = joblib.load(Path(model_dir) / "model.joblib")
        if bundle.get("featureNames") != list(FEATURES):
            raise ValueError("The serialized model does not match the declared feature contract.")
        frame = pd.DataFrame([{name: features[name] for name in FEATURES}], columns=FEATURES)
        probability = float(calibrated_probabilities(bundle, frame)[0])
        if not math.isfinite(probability) or not 0 < probability < 1:
            raise ValueError("The classifier returned an unsupported probability.")
        likelihoods = checks["likelihoods"]
        for state in STATES:
            rows = [row for row in likelihoods if row["state"] == state]
            if {row["report"] for row in rows} != set(REPORTS) or len(rows) != len(REPORTS):
                raise ValueError("The check-likelihood contract is incomplete.")
            if not math.isclose(sum(row["probability"] for row in rows), 1, abs_tol=1e-10):
                raise ValueError("Check likelihoods do not sum to one for each state.")
            for row in rows:
                value = row["probability"]
                if not math.isfinite(value) or not 0 <= value <= 1:
                    raise ValueError("Invalid check likelihood.")
                if row["report"] in ALLOWED_REPORTS[state] and value <= 0:
                    raise ValueError("An allowed report was assigned zero likelihood; missing observations cannot establish impossibility.")
                if row["report"] not in ALLOWED_REPORTS[state] and value != 0:
                    raise ValueError("Check likelihood contradicts the authored confirmation semantics.")
        result.update(supported=True, probabilityRegistered=probability, likelihoods=likelihoods)
        return result
    except (OSError, ValueError, TypeError, KeyError, AttributeError, EOFError) as error:
        result["reasons"].append(f"The model bundle cannot support an estimate: {error}")
        return result
