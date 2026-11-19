// Business adapters for the two gifting clients. The shared journey module owns
// portable workflow state; the pinned apps own fault interpretation and planning.
// This file formats those findings and maps form edits. It never ranks packages.
import { WORKFLOW_STEP_STATUS } from '@decision-lab/sdk';
import { summarizeRun } from './gifting.js';
import { inspectReviewJourney } from './reviewJourney.js';

export const GIFTING_SCOPE_FIELDS = Object.freeze([
  'batchId', 'insertRevision', 'destinationRevision', 'checkoutRevision', 'deviceScope', 'accountScope',
]);

export function minuteAt(asOf, origin) {
  const value = (Date.parse(asOf) - Date.parse(origin)) / 60000;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Use a whole minute at or after the case clock origin.');
  return value;
}

export function atMinute(minute, origin) {
  if (!Number.isSafeInteger(minute) || minute < 0) throw new Error('Supply a nonnegative whole minute.');
  return new Date(Date.parse(origin) + minute * 60000).toISOString();
}

/** Questions own whole values, including arrays. Preserve original source and
 * scope when replacing an answer; never upgrade a record to match the campaign. */
export function giftingAnswerValues(definition, gifting) {
  return Object.fromEntries(definition.questions.filter(row => row.path.startsWith('gifting.')).map(question => [
    question.id, question.path.split('.').slice(1).reduce((value, key) => value?.[key], gifting),
  ]));
}

export function inspectGiftingJourney({ lab, run, config }) {
  const view = inspectReviewJourney({ lab, run });
  const evidenceStep = view.output.steps.find(row => row.id === 'evidence');
  const evidenceEvaluation = run.evaluations.findLast(row => row.stepId === 'evidence');
  const evidence = evidenceStep?.status === WORKFLOW_STEP_STATUS.ACCEPTED ? evidenceStep.output : null;
  const review = view.currentRun ? summarizeRun(view.currentRun, config) : null;
  const screeningReview = view.context.screeningRun ? summarizeRun(view.context.screeningRun, config) : null;
  const closure = view.output.brief.sections.find(row => row.id === 'actual-handoff')?.value;
  const nextStep = view.output.steps.find(row => row.status !== WORKFLOW_STEP_STATUS.ACCEPTED && row.status !== WORKFLOW_STEP_STATUS.NOT_APPLICABLE);
  let nextAction = nextStep?.status === WORKFLOW_STEP_STATUS.AWAITING_REVIEW
    ? `Review the ${nextStep.id} finding`
    : nextStep?.executable ? `Calculate ${nextStep.title.toLowerCase()}`
      : nextStep ? 'Review the changed source records'
        : review?.status === 'blocked' ? 'Escalate or revise the commitment'
          : !view.decision ? 'Record the operating decision'
            : closure?.completed ? 'Original handoff recorded complete' : 'Obtain and record the next actual operating record';
  const basis = review ?? screeningReview;
  const preferred = basis?.preferred ?? [];
  // This is a schedule-only boundary selected from SDK activity times. It does
  // not prove that the vendor will answer, authority will arrive, or resources
  // remain available until that boundary.
  const scheduleBounds = (basis?.plans ?? []).map(plan => ({ planId: plan.id, packageId: plan.packageId,
    latestStartMinute: run.case.gifting.commitment.handoffDeadlineMinute - (plan.finishMinute - plan.startMinute),
    meaning: 'Latest start from the recorded complete duration only; all other requirements still apply.',
  }));
  const dueCandidates = preferred.length ? scheduleBounds.filter(row => preferred.some(plan => plan.id === row.planId))
    : scheduleBounds.filter(row => row.packageId === config.confirmationPackage);
  return { ...view, evidenceStep, evidenceEvaluation, evidence, review, screeningReview, closure,
    nextStep, nextAction, owner: view.context.owner, scheduleBounds,
    actionDueMinute: dueCandidates.length ? Math.min(...dueCandidates.map(row => row.latestStartMinute)) : null,
  };
}
