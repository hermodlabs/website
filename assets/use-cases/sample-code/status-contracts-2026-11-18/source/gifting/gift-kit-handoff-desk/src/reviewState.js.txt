// React lifecycle only. COMPLETE means a current, usable assessment is shown;
// the assessment can still establish that every handoff package is blocked.
export const REVIEW_STATE = Object.freeze(/** @type {const} */ ({
  LOADING: 'loading',
  READY: 'ready',
  DIRTY: 'dirty',
  RUNNING: 'running',
  COMPLETE: 'complete',
  INVALID: 'invalid',
  UNAVAILABLE: 'unavailable',
}));
/** @typedef {(typeof REVIEW_STATE)[keyof typeof REVIEW_STATE]} ReviewState */
