#!/usr/bin/env python3
"""Propose historical estimates, then compare a readiness check with acting now."""

from __future__ import annotations

import argparse
from pathlib import Path

from decision_lab import DecisionLab, DecisionLabError

from decision import assess_case, load_json, save
from estimation import estimate


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, type=Path, help="Output directory from train.py")
    parser.add_argument("--case", required=True, type=Path, help="Current shipment JSON")
    parser.add_argument("--output", required=True, type=Path, help="A new directory; existing outputs are never overwritten")
    parser.add_argument("--reviewer", help="Named reviewer accepting this exact proposed numerical basis")
    parser.add_argument("--accept-estimates", action="store_true", help="Explicitly accept the supported numerical proposal")
    args = parser.parse_args()
    if bool(args.reviewer) != args.accept_estimates or (args.reviewer is not None and not args.reviewer.strip()):
        parser.error("Use both --reviewer NAME and --accept-estimates to accept a numerical basis.")
    try:
        business = load_json(args.case)
        proposal = estimate(args.model, business["features"], business["asOf"])
        args.output.mkdir(parents=True, exist_ok=False)
        with DecisionLab() as lab:
            summary = assess_case(lab, business, proposal, args.output,
                                  reviewer=args.reviewer.strip() if args.accept_estimates else None)
            save(lab, args.output / "summary.json", summary)
    except KeyError as error:
        parser.exit(2, f"Assessment failed: missing required field {error}.\n")
    except (OSError, ValueError, DecisionLabError) as error:
        parser.exit(2, f"Assessment failed: {error}\n")
    from report import render_html
    (args.output / "report.html").write_text(render_html(summary), encoding="utf-8")
    print(summary["nextAction"])
    comparison = summary["learning"]
    if comparison["status"] == "assessed" and comparison["expectedCostMinor"] is not None:
        print(f"Expected cost with check: ${comparison['expectedCostMinor'] / 100:,.2f}; "
              f"acting now: ${comparison['baselineCostMinor'] / 100:,.2f}.")
    elif comparison["status"] == "unassessed":
        print("Learning comparison unassessed: " + comparison["reason"])
    print(f"Review: {args.output / 'report.html'}")


if __name__ == "__main__":
    main()
