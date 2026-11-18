import { isDeepStrictEqual } from 'node:util';
import { BATCH_STATUS, REVIEW_OUTCOME } from './semantics.mjs';

function preferredSignature(projection) {
  return projection.preferred.map(plan => ({
    arrangement: plan.arrangementId, expense: plan.expense, arrivalMinutes: plan.arrivalMinutes,
  })).sort((a, b) => a.arrangement.localeCompare(b.arrangement));
}

/** Compare this shipment profile's complete reviews, retaining every preferred tie. */
export function classify(current, before, changes) {
  if (!current?.available) return BATCH_STATUS.UNAVAILABLE;
  if (current.status === REVIEW_OUTCOME.BLOCKED) return BATCH_STATUS.BLOCKED;
  if (!before?.available) return BATCH_STATUS.NEW;
  if (!isDeepStrictEqual(preferredSignature(current), preferredSignature(before))) {
    return BATCH_STATUS.RECOMMENDATION_CHANGED;
  }
  return changes.length ? BATCH_STATUS.CONDITIONS_CHANGED : BATCH_STATUS.UNCHANGED;
}

/** A calculated comparison proposes follow-up work; it never grants approval. */
export function nextAction(row) {
  switch (row.status) {
    case BATCH_STATUS.INPUT_ERROR: return 'Correct the source record, then run a new assessment; do not reuse the previous proposal as current.';
    case BATCH_STATUS.UNAVAILABLE: return 'Resolve the evaluation or report problem and reassess before using a proposal.';
    case BATCH_STATUS.BLOCKED: return 'Review the failed conditions with the shipment owner. Obtain correctly scoped authority or revise the available arrangements.';
    case BATCH_STATUS.RECOMMENDATION_CHANGED: return 'Review the changed proposal and its supporting conditions before replacing the previous arrangement.';
    case BATCH_STATUS.CONDITIONS_CHANGED: return 'Review the changed inputs even though the preferred arrangement is unchanged.';
    case BATCH_STATUS.UNCHANGED: return 'Confirm the source records remain current before operational handoff.';
    case BATCH_STATUS.NEW: return 'Review the calculated proposal and obtain the required operating approvals.';
    default: return 'The comparison status is unrecognized. Reassess before using this proposal.';
  }
}
