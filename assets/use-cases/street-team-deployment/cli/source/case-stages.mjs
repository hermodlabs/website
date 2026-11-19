import assert from 'node:assert/strict';

// Every state change goes through a public CLI operation. Reading a run to get
// its exact retained assessment reference is orchestration, not new reasoning.
export async function runCaseStage({ id, source, target, read, save, cli, inspect, answer, evaluate }) {
  if (id === 'intake') {
    const started = target(id, 'started.run.json');
    await cli(['workflow', 'start', '--definition', target('author', 'workflow.definition.json'), '--case', source('cases', 'initial.json'),
      '--run-id', 'sam-promotion-1120', '--created-at', '2026-11-18T01:30:00.000Z', '--output', started]);
    const pending = await inspect(started, 'before-review');
    assert(pending.questions.filter(row => row.value != null).every(row => row.status === 'awaiting-review'));
    const definition = await read(target('author', 'workflow.definition.json'));
    const fixture = await read(source('cases', 'initial.json'));
    let run = started;
    for (const question of definition.questions) {
      const value = question.path.split('.').reduce((row, key) => row?.[key], fixture);
      if (value != null) run = await answer(run, question.id, value);
    }
    await evaluate(run);
  } else if (id === 'callouts') {
    const fixture = await read(source('cases', 'two-callouts.json'));
    const run = await answer(target('intake', 'run.json'), 'staffing', fixture.promotion.staffing);
    const stale = await inspect(run, 'requires-reassessment');
    assert.equal(stale.steps[0].stale, true);
    await evaluate(run);
  } else if (id === 'decision') {
    const previous = target('callouts', 'run.json');
    const finding = await inspect(previous, 'basis');
    const native = await read(previous), promotion = native.case.promotion;
    const step = finding.steps.find(row => row.id === 'operations');
    assert.equal(step.status, 'accepted');
    const plan = step.output.plans.find(row => row.deployment === 'small-standard');
    assert.equal(plan.feasible, true);
    const proposal = { manager: 'Sam', deployment: plan.deployment,
      venueId: promotion.staffing.venueId, operatingDate: promotion.staffing.operatingDate,
      assessmentRunHash: step.runHash, evaluationId: step.evaluationId };
    assert.equal(proposal.evaluationId, finding.evaluations.at(-1).id);
    const proposed = await answer(previous, 'proposal', proposal);
    const awaiting = await inspect(proposed, 'awaiting-authorization');
    assert.equal(awaiting.brief.complete, false);
    assert.equal(awaiting.brief.sections.find(row => row.id === 'decision').value.currentChoice, true);
    const authorization = { manager: 'Sam', authorized: true, deployment: plan.deployment,
      venueId: proposal.venueId, operatingDate: proposal.operatingDate, assessmentRunHash: step.runHash,
      amountMinor: plan.expenseMinor, validFromMinute: promotion.timing.dispatchMinute,
      validThroughMinute: promotion.timing.staffReturnMinute, source: 'Fictional Sam authorization AUTH-1120-SMALL: one promoter, $200 cap, declared venue/date/window.' };
    // These are independent rejected-scope branches of the same real accepted
    // assessment. They test authorization meaning, not just a fake hash fixture.
    for (const [label, change] of [
      ['insufficient-cap', { amountMinor: plan.expenseMinor - 1 }],
      ['other-venue', { venueId: 'ANOTHER-VENUE' }],
      ['expired-window', { validThroughMinute: promotion.timing.staffReturnMinute - 1 }],
      ['other-assessment', { assessmentRunHash: 'superseded-assessment' }],
    ]) {
      const rejectedScope = await answer(proposed, 'authorization', { ...authorization, ...change });
      const scopeFinding = await inspect(rejectedScope, label);
      assert.equal(scopeFinding.brief.complete, false);
      assert.equal(scopeFinding.brief.sections.find(row => row.id === 'decision').value.specificAuthorizationRecorded, false);
    }
    const run = await answer(proposed, 'authorization', authorization, true);
    const complete = await inspect(run, 'complete');
    assert.equal(complete.brief.complete, true);
    await cli(['workflow', 'open', '--run', run, '--output', target(id, 'reopened.run.json')]);
    assert.deepEqual(await read(run), await read(target(id, 'reopened.run.json')));
  } else if (id === 'changed-staffing') {
    const previous = await read(target('decision', 'run.json'));
    const staffing = { ...previous.case.promotion.staffing, unavailableStaff: 3 };
    const changed = await answer(target('decision', 'run.json'), 'staffing', staffing);
    const stale = await inspect(changed, 'requires-reassessment');
    assert.equal(stale.steps[0].stale, true);
    assert.equal(stale.brief.complete, false);
    await evaluate(changed);
    const current = await read(target(id, 'run.json'));
    assert(current.history.length > previous.history.length);
    assert.deepEqual(current.case.promotion.authorization, previous.case.promotion.authorization,
      'Retain the historical authorization assertion; changing facts does not revoke an external permission.');
    const output = await inspect(target(id, 'run.json'), 'reassessed');
    assert.equal(output.brief.complete, false, 'Old choice and authorization cannot complete a changed assessment.');
  } else throw new Error(`Unknown case stage ${id}`);
}
