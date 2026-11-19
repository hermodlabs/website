// These outcomes belong to the screen's summary, not SDK execution status.
// BLOCKED is an available business finding, not a failed calculation.
export const REVIEW_OUTCOME = Object.freeze(/** @type {const} */ ({
  ELIGIBLE: 'eligible',
  BLOCKED: 'blocked',
  UNAVAILABLE: 'unavailable',
}));
/** @typedef {typeof REVIEW_OUTCOME[keyof typeof REVIEW_OUTCOME]} ReviewOutcomeValue */

// React lifecycle is separate from whether any shipment arrangement is feasible.
export const REVIEW_STATE = Object.freeze(/** @type {const} */ ({
  LOADING: 'loading',
  READY: 'ready',
  DIRTY: 'dirty',
  RUNNING: 'running',
  COMPLETE: 'complete',
  INVALID: 'invalid',
  UNAVAILABLE: 'unavailable',
}));
/** @typedef {typeof REVIEW_STATE[keyof typeof REVIEW_STATE]} ReviewStateValue */

// NONE is a form choice meaning no record; it is never written as a slot record.
export const SLOT_CONFIRMATION_STATUS = Object.freeze(/** @type {const} */ ({
  NONE: 'none',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  CONFLICTING: 'conflicting',
}));
/** @typedef {typeof SLOT_CONFIRMATION_STATUS[keyof typeof SLOT_CONFIRMATION_STATUS]} SlotConfirmationStatusValue */
