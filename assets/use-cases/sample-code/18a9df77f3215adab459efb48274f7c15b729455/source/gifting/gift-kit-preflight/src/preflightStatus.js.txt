import { REVIEW_OUTCOME } from './gifting.js';

// The queue includes projected business outcomes plus cases that could not be
// admitted. These strings are also retained in manifest.json.
export const PREFLIGHT_STATUS = Object.freeze(/** @type {const} */ ({
  ...REVIEW_OUTCOME,
  INPUT_ERROR: 'input-error',
}));
/** @typedef {(typeof PREFLIGHT_STATUS)[keyof typeof PREFLIGHT_STATUS]} PreflightStatus */
