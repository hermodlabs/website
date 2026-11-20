import assert from 'node:assert/strict';
import test from 'node:test';
import { classify, nextAction } from '../src/classify.mjs';
import { BATCH_STATUS, REVIEW_OUTCOME, SLOT_CONFIRMATION_STATUS } from '../src/semantics.mjs';

const consolidated = { arrangementId: 'consolidated', expense: 500000, arrivalMinutes: 3960 };
const direct = { arrangementId: 'direct', expense: 400000, arrivalMinutes: 5040 };
const review = (preferred = [consolidated]) => ({ available: true, status: REVIEW_OUTCOME.ELIGIBLE, preferred });

test('sample vocabularies retain the manifest and source-record strings', () => {
  assert.deepEqual(Object.values(REVIEW_OUTCOME), ['eligible', 'blocked', 'unavailable']);
  assert.deepEqual(Object.values(BATCH_STATUS), ['input-error', 'unavailable', 'blocked', 'new',
    'recommendation-changed', 'conditions-changed', 'unchanged']);
  assert.deepEqual(Object.values(SLOT_CONFIRMATION_STATUS), ['confirmed', 'cancelled', 'conflicting']);
  for (const values of [REVIEW_OUTCOME, BATCH_STATUS, SLOT_CONFIRMATION_STATUS]) assert.ok(Object.isFrozen(values));
});

test('unavailable takes priority over a blocked flag or previous usable recommendation', () => {
  assert.equal(classify(null, review(), []), 'unavailable');
  assert.equal(classify({ available: false, status: REVIEW_OUTCOME.BLOCKED }, review(), [{}]), 'unavailable');
});

test('a usable blocked finding takes priority over having no earlier review', () => {
  const blocked = { available: true, status: REVIEW_OUTCOME.BLOCKED, preferred: [] };
  assert.equal(classify(blocked, null, []), 'blocked');
  assert.equal(classify(blocked, review(), [{}]), 'blocked');
});

test('the first usable eligible review is new, including after an unavailable assessment', () => {
  assert.equal(classify(review(), null, []), 'new');
  assert.equal(classify(review(), { available: false, status: REVIEW_OUTCOME.UNAVAILABLE }, [{}]), 'new');
});

test('recommendation changes include preferred membership, expense, arrival and ties', () => {
  for (const preferred of [
    [direct],
    [{ ...consolidated, expense: 490000 }],
    [{ ...consolidated, arrivalMinutes: 3900 }],
    [consolidated, direct],
  ]) {
    assert.equal(classify(review(preferred), review(), []), 'recommendation-changed');
    assert.equal(classify(review(preferred), review(), [{}]), 'recommendation-changed');
  }
});

test('reordering tied preferences does not invent a recommendation change or mutate them', () => {
  const current = review([direct, consolidated]);
  const before = review([consolidated, direct]);
  const retained = structuredClone({ current, before });
  assert.equal(classify(current, before, []), 'unchanged');
  assert.deepEqual({ current, before }, retained);
});

test('input changes distinguish conditions-changed from unchanged when the recommendation matches', () => {
  assert.equal(classify(review(), review(), [{ path: 'slotReference', before: 'A', after: 'B' }]), 'conditions-changed');
  assert.equal(classify(review(), review(), []), 'unchanged');
});

test('new has explicit review advice; unknown statuses withhold an ordinary next action', () => {
  assert.equal(nextAction({ status: BATCH_STATUS.NEW }), 'Review the calculated proposal and obtain the required operating approvals.');
  for (const status of ['not-a-supported-status', undefined]) {
    const action = nextAction({ status });
    assert.match(action, /status is unrecognized.*Reassess/);
    assert.doesNotMatch(action, /obtain the required operating approvals/);
  }
  for (const status of Object.values(BATCH_STATUS)) assert.doesNotMatch(nextAction({ status }), /unrecognized/);
});
