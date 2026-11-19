// These are this sample's vocabularies, not native SDK execution statuses.
// An available, blocked review is a usable finding: no arrangement passes.
export const REVIEW_OUTCOME = Object.freeze(/** @type {const} */ ({
  ELIGIBLE: 'eligible',
  BLOCKED: 'blocked',
  UNAVAILABLE: 'unavailable',
}));
/** @typedef {typeof REVIEW_OUTCOME[keyof typeof REVIEW_OUTCOME]} ReviewOutcomeValue */

// Batch status describes the comparison with an earlier usable review.
// Keep the serialized values stable for manifest, CSV and downstream consumers.
export const BATCH_STATUS = Object.freeze(/** @type {const} */ ({
  INPUT_ERROR: 'input-error',
  UNAVAILABLE: 'unavailable',
  BLOCKED: 'blocked',
  NEW: 'new',
  RECOMMENDATION_CHANGED: 'recommendation-changed',
  CONDITIONS_CHANGED: 'conditions-changed',
  UNCHANGED: 'unchanged',
}));
/** @typedef {typeof BATCH_STATUS[keyof typeof BATCH_STATUS]} BatchStatusValue */

// Absence is represented by no CSV row, not a fourth record status.
export const SLOT_CONFIRMATION_STATUS = Object.freeze(/** @type {const} */ ({
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  CONFLICTING: 'conflicting',
}));
/** @typedef {typeof SLOT_CONFIRMATION_STATUS[keyof typeof SLOT_CONFIRMATION_STATUS]} SlotConfirmationStatusValue */
