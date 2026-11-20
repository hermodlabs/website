import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDecisionLab, WORKFLOW_ANSWER_STATUS } from '@decision-lab/sdk';
import { createNodeExecutor } from '@decision-lab/sdk/node';
import { runBatch } from '../src/batch.mjs';
import { continueReview } from '../continue-review.mjs';
import { createReviewJourney, openReviewJourney, updateReviewInputs, reviewJourneyInputs, evaluateReviewJourney, acceptReviewFinding,
  recordJourneyDecision, recordJourneyOperation, inspectReviewJourney } from '../src/reviewJourney.js';

const folder = fileURLToPath(new URL('../', import.meta.url));
const json = async file => JSON.parse(await readFile(file, 'utf8'));

test('screening to interactive review to CLI preserves the same case, decisions and source history', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'shipment-journey-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const batch = await runBatch({ inputDir: path.join(folder, 'fixtures/baseline'), retainedDir: path.join(folder, 'fixtures/retained/baseline'),
    outputDir: path.join(root, 'batch'), createdAt: '2026-11-17T14:00:00Z' });
  const executor = createNodeExecutor(), lab = createDecisionLab({ executor });
  t.after(() => executor.close());
  const app = lab.apps.open(await json(path.join(folder, 'app/shipment-review.app.json')));
  let review = openReviewJourney({ lab, app, value: await json(path.join(batch.outputDir, 'shipments/SHIP-104/review.json')) });
  assert.equal(review.case.inputs.id, 'SHIP-104');
  assert.equal(review.answers.inputs.status, WORKFLOW_ANSWER_STATUS.AWAITING_REVIEW, 'Screening does not accept imported facts.');
  assert.equal(review.evaluations.length, 0);
  assert.ok(review.case.journeyContext.screeningRun);
  assert.equal(review.case.journeyContext.sources.length, 4);
  await assert.rejects(continueReview({ reviewFile: path.join(batch.outputDir, 'shipments/SHIP-104/review.json'), outputDir: path.join(root, 'unreviewed') }), /await review/);
  review = reviewJourneyInputs({ lab, run: review, actor: 'Maya Chen', at: '2026-11-17T14:01:00Z' });
  review = await evaluateReviewJourney({ lab, run: review, at: '2026-11-17T14:01:00Z' });
  assert.throws(() => recordJourneyDecision({ lab, run: review, optionId: 'direct', actor: 'Maya Chen' }), /Accept the current finding/);
  review = acceptReviewFinding({ lab, run: review, actor: 'Maya Chen', at: '2026-11-17T14:02:00Z' });
  review = recordJourneyDecision({ lab, run: review, optionId: 'direct', actor: 'Maya Chen', at: '2026-11-17T14:02:00Z' });
  const beforeBooking = path.join(root, 'before-booking.json'); await writeFile(beforeBooking, JSON.stringify(review));
  const scope = { ...Object.fromEntries(['orderId','orderRevision','recipient','shipDate','profileVersion'].map(key => [key, review.case.inputs.parameters[key]])),
    arrangement: 'direct', shipPoint: 'SP-A', source: 'Fictional supplied operating documents' };
  const operating = value => inspectReviewJourney({ lab, run: value }).output.brief.sections.find(row => row.id === 'actual-shipment').value;
  review = recordJourneyOperation({ lab, run: review, kind: 'authorization', actor: 'Maya Chen', at: '2026-11-17T14:03:00Z',
    record: { ...scope, reference: 'FIN-104', authorized: true, amountMinor: 400000, authorizedAtMinute: 481, validFromMinute: 480, validUntilMinute: 721 } });
  review = recordJourneyOperation({ lab, run: review, kind: 'reservation', actor: 'Maya Chen', at: '2026-11-17T14:03:00Z',
    record: { ...scope, reference: 'OLD-BOOK-104', orderRevision: '0', confirmed: true, reservedAtMinute: 482,
      quoteId: 'Q-SHIP-104-direct', quoteRevision: '1' } });
  assert.equal(operating(review).reservationRecorded, false, 'A real record on the wrong order revision does not satisfy the operating gate.');
  review = recordJourneyOperation({ lab, run: review, kind: 'reservation', actor: 'Maya Chen',
    record: { ...scope, reference: 'BOOK-104', confirmed: true, reservedAtMinute: 482,
      quoteId: 'Q-SHIP-104-direct', quoteRevision: '1', note: 'Carrier supplied a booking reference.' }, at: '2026-11-17T14:03:00Z' });
  assert.equal(operating(review).authorizationRecorded, true);
  assert.equal(operating(review).reservationRecorded, true);
  assert.equal(operating(review).originalCommitmentCompleted, false, 'Reservation does not satisfy the delivery gate.');
  const exported = path.join(root, 'desk-review.json'); await writeFile(exported, JSON.stringify(review));
  const reopened = await continueReview({ reviewFile: exported, outputDir: path.join(root, 'reopened'), createdAt: '2026-11-17T14:04:00Z' });
  assert.equal(reopened.run.identity.runId, review.identity.runId);
  assert.deepEqual(reopened.run.case.journeyOperations, review.case.journeyOperations);
  assert.equal(inspectReviewJourney({ lab, run: reopened.run }).decision.planId, 'plan-000001');
  assert.equal(reopened.run.case.journeyOperations.some(row => row.kind === 'delivery'), false, 'Booking is not delivery.');
  const future = recordJourneyOperation({ lab, run: review, kind: 'delivery', actor: 'Maya Chen', at: '2026-11-17T14:05:00Z',
    record: { ...scope, reference: 'FUTURE-POD', receivedAccepted: true, quantity: 100, bookingReference: 'BOOK-104', deliveredAtMinute: 5040 } });
  assert.equal(operating(future).originalCommitmentCompleted, false, 'A future-dated delivery is not actual completion evidence.');
  const delivered = recordJourneyOperation({ lab, run: review, kind: 'delivery', actor: 'Maya Chen', at: '2026-11-20T18:01:00Z',
    record: { ...scope, reference: 'POD-104', receivedAccepted: true, quantity: 100, bookingReference: 'BOOK-104', deliveredAtMinute: 5040 } });
  assert.equal(operating(delivered).originalCommitmentCompleted, true);

  const revisedInputs = structuredClone(review.case.inputs);
  revisedInputs.parameters.receiptDeadline = 6000;
  revisedInputs.parameters.receiptClose = 6001;
  let revised = updateReviewInputs({ lab, run: await json(beforeBooking), inputs: revisedInputs });
  revised = reviewJourneyInputs({ lab, run: revised, actor: 'Maya Chen' });
  revised = await evaluateReviewJourney({ lab, run: revised });
  revised = acceptReviewFinding({ lab, run: revised, actor: 'Maya Chen' });
  revised = recordJourneyDecision({ lab, run: revised, optionId: 'direct', actor: 'Maya Chen' });
  for (const [kind, record] of [
    ['authorization', { ...scope, reference: 'FIN-REVISED', authorized: true, amountMinor: 400000, authorizedAtMinute: 481, validFromMinute: 480, validUntilMinute: 721 }],
    ['reservation', { ...scope, reference: 'BOOK-REVISED', confirmed: true, reservedAtMinute: 482, quoteId: 'Q-SHIP-104-direct', quoteRevision: '1' }],
    ['delivery', { ...scope, reference: 'POD-REVISED', receivedAccepted: true, quantity: 100, bookingReference: 'BOOK-REVISED', deliveredAtMinute: 5700 }],
  ]) revised = recordJourneyOperation({ lab, run: revised, kind, record, actor: 'Maya Chen', at: '2026-11-21T12:00:00Z' });
  assert.equal(operating(revised).currentCommitmentCompleted, true);
  assert.equal(operating(revised).originalCommitmentCompleted, false, 'Delivery under a revised deadline does not fulfill the original promise.');
  assert.equal(operating(revised).promiseRevised, true);

  const advanced = await continueReview({ reviewFile: beforeBooking, outputDir: path.join(root, 'after-cutoff'),
    asOf: '2026-11-17T11:30:00-06:00', reviewInputs: true, actor: 'Maya Chen', createdAt: '2026-11-17T17:30:00Z' });
  const state = inspectReviewJourney({ lab, run: advanced.run });
  assert.ok(state.staleDecision, 'Time-only changes reopen the operating decision.');
  assert.equal(state.decision, null);
  assert.equal(state.currentRun.input.inputs.parameters.currentTime, 690);
  assert.equal(state.currentRun.report.datasets.commitment.summary.recommendation.planId, 'plan-000003');
  assert.equal(state.output.brief.sections.find(row => row.id === 'next-work').value.find(row => row.arrangement === 'direct').remainingMinutes, -30);
  assert.ok(state.operations.some(row => row.kind === 'decision'), 'The earlier unbooked proposal stays in history.');
});

test('later negative or incorrectly scoped operating records replace historical positives', async t => {
  const executor = createNodeExecutor(), lab = createDecisionLab({ executor });
  t.after(() => executor.close());
  const app = lab.apps.open(await json(path.join(folder, 'app/shipment-review.app.json')));
  const definition = lab.workflows.open(await json(path.join(folder, 'app/shipment.workflow.json')));
  let initial = createReviewJourney({ lab, app, definition, inputs: app.app.model.case, owner: 'Shipment reviewer',
    createdAt: '2026-11-17T14:00:00Z' });
  initial = reviewJourneyInputs({ lab, run: initial, actor: 'Shipment reviewer' });
  initial = await evaluateReviewJourney({ lab, run: initial });
  initial = acceptReviewFinding({ lab, run: initial, actor: 'Shipment reviewer' });
  initial = recordJourneyDecision({ lab, run: initial, optionId: 'direct', actor: 'Shipment reviewer' });
  const p = initial.case.inputs.parameters, quote = initial.case.inputs.tables.arrangements.find(row => row.id === 'direct');
  const scope = { ...Object.fromEntries(['orderId', 'orderRevision', 'recipient', 'shipDate', 'profileVersion'].map(key => [key, p[key]])),
    arrangement: 'direct', shipPoint: quote.shipPoint, source: 'Fictional complete current-status document' };
  const records = {
    authorization: { ...scope, reference: 'AUTH-POSITIVE', authorized: true, amountMinor: 400000,
      authorizedAtMinute: 481, validFromMinute: 480, validUntilMinute: 721 },
    reservation: { ...scope, reference: 'BOOK-POSITIVE', confirmed: true, reservedAtMinute: 482,
      quoteId: quote.quoteId, quoteRevision: quote.quoteRevision },
    delivery: { ...scope, reference: 'POD-POSITIVE', receivedAccepted: true, quantity: 100,
      bookingReference: 'BOOK-POSITIVE', deliveredAtMinute: 5040 },
  };
  const append = (run, kind, record) => recordJourneyOperation({ lab, run, kind, record,
    actor: 'Shipment reviewer', at: '2026-11-21T12:00:00Z' });
  const status = run => inspectReviewJourney({ lab, run }).output.brief.sections.find(row => row.id === 'actual-shipment').value;
  for (const [kind, record] of Object.entries(records)) initial = append(initial, kind, record);
  assert.equal(status(initial).originalCommitmentCompleted, true);

  for (const [kind, flag] of [['authorization', 'authorized'], ['reservation', 'confirmed'], ['delivery', 'receivedAccepted']]) {
    for (const replacement of ['negative', 'wrong-scope']) {
      const invalid = { ...records[kind], reference: `${kind}-${replacement}`,
        ...(replacement === 'negative' ? { [flag]: false } : { orderRevision: 'earlier-revision' }) };
      let changed = append(initial, kind, invalid);
      assert.equal(status(changed).currentCommitmentCompleted, false, `${kind}: the latest ${replacement} record invalidates current closure.`);
      assert.equal(status(changed).originalCommitmentCompleted, false, `${kind}: an earlier positive cannot establish original closure.`);
      if (kind === 'authorization') assert.equal(status(changed).authorizationRecorded, false);
      if (kind !== 'delivery') assert.equal(status(changed).reservationRecorded, false);
      assert.ok(changed.case.journeyOperations.some(row => row.record?.reference === records[kind].reference), 'Keep the historical positive in the audit history.');
      const restored = { ...records[kind], reference: `${kind}-${replacement}-restored` };
      changed = append(changed, kind, restored);
      if (kind === 'reservation') {
        assert.equal(status(changed).currentCommitmentCompleted, false, 'The old delivery references the previous booking, not its replacement.');
        changed = append(changed, 'delivery', { ...records.delivery,
          reference: `POD-${replacement}-restored`, bookingReference: restored.reference });
      }
      assert.equal(status(changed).currentCommitmentCompleted, true, 'Genuine current records can restore a consistent complete chain.');
      assert.equal(status(changed).originalCommitmentCompleted, true);
    }
  }
});
