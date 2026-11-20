import assert from 'node:assert/strict';
import test from 'node:test';
import { formatMinute, localArtifactHref, projectRun, renderCSV, renderHTML } from '../src/report.mjs';

const options = {
  timeOrigin: '2026-11-17T00:00:00-06:00', timeZone: 'Etc/GMT+6', currency: 'USD', moneyDivisor: 100,
  labels: { arrangements: { direct: 'Direct', backup: 'Backup', consolidated: 'Consolidated' },
    checks: { 'expense-limit': 'Complete shipment expense stays within the limit' } },
};
const cell = raw => ({ raw, display: String(raw), available: true });
const table = (id, columns, rows) => ({ id, kind: 'table', columns: columns.map(id => ({ id, label: id })), rows });

// A small report-contract fixture keeps adapter tests independent of SDK source
// or evaluator internals. The integration test runs the actual CLI and checks the
// same adapter against real, fully materialized reports.
function completeRun({ blocked = false, tie = false } = {}) {
  const identity = {
    runId: 'fixture-run', appId: 'shipment-review', release: 1, appHash: 'app-hash', packageHash: 'package-hash',
    pattern: 'complete-a-commitment/1', moduleHash: 'module-hash', inputHash: 'input-hash', modelHash: 'model-hash',
  };
  const binding = Object.fromEntries(['appId', 'release', 'appHash', 'packageHash', 'pattern', 'moduleHash'].map(key => [key, identity[key]]));
  const inputs = { id: 'SHIP-104', parameters: { orderId: 'ORD-104', orderRevision: '1', recipient: 'DC-X', shipDate: '2026-11-18', profileVersion: '1' },
    tables: { arrangements: [{ id: 'direct' }, { id: 'backup' }, { id: 'consolidated' }] } };
  const finding = blocked ? 'no_feasible_plan' : 'feasible_witness';
  const coverage = { complete: true, admissionComplete: true, totalCandidates: 3, visitedCandidates: 3,
    evaluatedCandidates: 3, totalScenarios: 1, totalPlanScenarioChecks: 3, evaluatedPlanScenarioChecks: 3 };
  const assessment = { format: 'complete-a-commitment.assessment-normalized/1', pattern: identity.pattern, status: 'complete',
    finding, coverage, basis: { scenarios: [{ id: 'registered' }] }, assessmentHash: 'assessment-hash' };
  const metadata = { format: 'complete-a-commitment.assessment-reference/1', datasetId: 'commitment', ...assessment };
  metadata.format = 'complete-a-commitment.assessment-reference/1';
  const planIds = ['plan-1', 'plan-2', 'plan-3'];
  const arrangementIds = ['direct', 'backup', 'consolidated'];
  const feasible = [!blocked, false, !blocked];
  const dataset = { assessment, plans: planIds.map((id, index) => ({ id, complete: true, feasible: feasible[index] })),
    scenarios: [{ id: 'registered' }], sections: {}, summary: { finding, optimalityEstablished: !blocked,
      recommendation: blocked ? null : { planId: 'plan-3', preferenceEstablished: true,
        tiedPlanIds: tie ? ['plan-1', 'plan-3'] : ['plan-3'], unique: !tie } } };
  const datasets = { commitment: dataset };
  datasets['commitment:comparison'] = table('commitment:comparison', ['plan', 'choice:arrangement', 'expense', 'blockers'],
    planIds.map((id, index) => ({ id, cells: { plan: cell(id), 'choice:arrangement': cell(arrangementIds[index]),
      expense: cell([400000, 600000, 500000][index]), blockers: cell(feasible[index] ? 0 : 1) } })));
  const entries = planIds.map((planId, index) => {
    const checksId = `checks-${index}`, consequencesId = `consequences-${index}`;
    datasets[checksId] = table(checksId, ['check', 'requirement', 'status'], [{ id: 'expense-limit',
      cells: { check: cell('Expense condition'), requirement: cell('Total expense'), status: cell(feasible[index]) } }]);
    datasets[consequencesId] = table(consequencesId, ['value', 'result'], [{ id: 'arrival',
      cells: { value: cell('Customer receipt'), result: cell([5040, 3600, 3960][index]) } }]);
    dataset.sections[checksId] = [{ kind: 'table', datasetId: checksId }];
    dataset.sections[consequencesId] = [{ kind: 'table', datasetId: consequencesId }];
    return { planId, scenarioId: 'registered', sections: { checks: checksId, schedule: consequencesId } };
  });
  return {
    format: 'decision-lab-run/1', identity, input: { binding, inputs },
    execution: { status: 'completed', inputHash: identity.inputHash }, assessment: metadata,
    report: { format: 'decision-lab-report/1', identity: structuredClone(identity),
      evaluatedInput: { binding: structuredClone(binding), inputs: structuredClone(inputs), inputHash: identity.inputHash,
        model: { format: identity.pattern, case: structuredClone(inputs), module: { labels: {}, constraints: [{ id: 'expense-limit' }] } } },
      completeness: { materialized: true, allRequestedViews: true, allRetainedContexts: true, assessmentComplete: true,
        truncated: false, planCount: 3, scenarioCount: 1, evaluatedPlanScenarioChecks: 3 },
      datasets, contextIndexes: { planScenarios: { entries } },
    },
  };
}

test('uses retained choices, total expense, arrival, and every failed condition', () => {
  const run = completeRun();
  const result = projectRun(run, { ...options, expectedBinding: run.input.binding });
  assert.equal(result.available, true, result.issues.join('; '));
  assert.equal(result.status, 'eligible');
  assert.deepEqual(result.preferredIds, ['consolidated']);
  assert.equal(result.preferred[0].expense, 500000);
  assert.equal(result.preferred[0].arrivalMinutes, 3960);
  assert.equal(result.plans.length, 3);
  assert.equal(result.blockers.length, 1);
  assert.equal(result.blockers[0].arrangementId, 'backup');
  assert.equal(result.blockers[0].label, options.labels.checks['expense-limit']);
  // Source tables intentionally have no fee/departure fields. The report adapter
  // cannot derive these consequences by recalculating from source quotes.
  assert.match(result.preferred[0].expenseDisplay, /5,000/);
  assert.match(result.preferred[0].arrival, /Nov 19, 2026, 6:00 PM/);
});

test('retains all preferred ties without introducing a first-row tie breaker', () => {
  const result = projectRun(completeRun({ tie: true }), options);
  assert.equal(result.available, true);
  assert.deepEqual(result.preferredIds, ['direct', 'consolidated']);
  assert.deepEqual(result.preferredPlanIds, ['plan-1', 'plan-3']);
  assert.equal(result.preferred.length, 2);
});

test('a complete blocked assessment is usable data rather than a command failure', () => {
  const result = projectRun(completeRun({ blocked: true }), options);
  assert.equal(result.available, true);
  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.preferredIds, []);
  assert.equal(result.blockers.length, 3);
});

test('partial, cancelled, unavailable and inconsistent bases never produce a recommendation', () => {
  const changes = [
    run => { run.execution.status = 'cancelled'; },
    run => { run.report.completeness.assessmentComplete = false; },
    run => { run.report.completeness.truncated = true; },
    run => { run.report.datasets.commitment.assessment.status = 'invalid'; },
    run => { run.report.datasets.commitment.assessment.coverage.evaluatedCandidates = 2; run.assessment.coverage.evaluatedCandidates = 2; },
    run => { run.report.identity.inputHash = 'another-case'; },
    run => { run.report.evaluatedInput.inputs.parameters.orderRevision = '2'; },
    run => { run.assessment.assessmentHash = 'other-assessment'; },
    run => { run.report.datasets.commitment.summary.optimalityEstablished = false; },
  ];
  for (const mutate of changes) {
    const run = completeRun(); mutate(run);
    const result = projectRun(run, options);
    assert.equal(result.available, false);
    assert.equal(result.status, 'unavailable');
    assert.deepEqual(result.preferredIds, []);
    assert.equal(result.issues.length, 1);
  }
  assert.equal(projectRun(completeRun(), { expectedBinding: { appHash: 'different-rule-release' } }).available, false);
});

test('missing alternatives, mismatched choices and missing condition rows fail closed', () => {
  const changes = [
    run => { run.report.datasets['commitment:comparison'].rows.pop(); },
    run => { run.report.datasets['commitment:comparison'].rows[0].cells['choice:arrangement'].raw = 'unreviewed'; },
    run => { run.report.contextIndexes.planScenarios.entries.pop(); },
    run => { run.report.datasets['checks-1'].rows = []; },
    run => { run.report.datasets['checks-1'].rows[0].cells.status.available = false; },
    run => { run.report.datasets['commitment:comparison'].rows[1].cells.blockers.raw = 0; },
    run => { run.report.datasets.commitment.summary.recommendation.tiedPlanIds = ['plan-2']; },
  ];
  for (const mutate of changes) {
    const run = completeRun(); mutate(run);
    const result = projectRun(run, options);
    assert.equal(result.available, false, JSON.stringify(result));
    assert.deepEqual(result.preferredIds, []);
  }
});

test('HTML has useful tables, escaped external data and safe relative artifact links', () => {
  const current = projectRun(completeRun({ tie: true }), options);
  current.plans[0].label = '<script>alert("quote")</script>';
  const rows = [{ shipmentId: 'SHIP-104', orderId: '<img src=x onerror=alert(1)>', orderRevision: '2',
    status: 'recommendation-changed', owner: 'Maya & "team"', deadline: '2026-11-17T18:00:00.000Z',
    before: projectRun(completeRun(), options), current, nextAction: 'Review "this" <plan>',
    diagnostics: [{ code: 'INFO', path: 'quotes.csv:4', message: 'The source contains <tag> & text' }],
    changes: [{ path: 'parameters.orderRevision', before: '1', after: '2' }],
    links: [{ label: 'Full CLI report', href: 'shipments/SHIP-104/run.json' },
      { label: 'Quoted name', href: 'sources/a"b#c.json' },
      { label: 'Untrusted', href: 'javascript:alert(1)' }], sources: ['orders.csv row 2'] }];
  const html = renderHTML(rows, { ...options, title: 'Morning <shipment> review', createdAt: '2026-11-17T14:00:00Z' });
  assert.match(html, /<table/);
  assert.match(html, /data-record-view="shipment-exception-queue"/);
  assert.match(html, /data-record-view="shipment-SHIP-104-arrangements"/);
  assert.equal((html.match(/<table\b/g) || []).length, (html.match(/data-record-view=/g) || []).length, 'Every report table uses the shared records view.');
  assert.match(html, /Previous proposal/);
  assert.match(html, /Current proposal/);
  assert.match(html, /Preferred under the declared priorities/);
  assert.match(html, /Complete shipment expense stays within the limit/);
  assert.match(html, /Backup: failed check — Complete shipment expense stays within the limit/);
  assert.match(html, /awaiting human review/);
  assert.match(html, /independently/);
  assert.match(html, /href="shipments\/SHIP-104\/run.json"/);
  assert.match(html, /href="sources\/a%22b%23c.json"/);
  assert.doesNotMatch(html, /<script|<img|href="javascript:|onclick=|src="http/i);
  assert.match(html, /&lt;script&gt;alert\(&quot;quote&quot;\)&lt;\/script&gt;/);
  assert.match(html, /Maya &amp; &quot;team&quot;/);
  assert.match(html, /Reservation cutoff: Nov 17, 2026, 12:00 PM GMT-6/);
  assert.match(html, /quotes.csv:4: The source contains &lt;tag&gt; &amp; text/);
  assert.match(html, /data-label="Previous proposal"/);
  assert.doesNotMatch(html, /overflow:\s*(auto|scroll)/);
});

test('local links encode filenames and reject arbitrary URLs or traversal', () => {
  assert.equal(localArtifactHref('shipments/ORD 104/run.json'), 'shipments/ORD%20104/run.json');
  assert.equal(localArtifactHref('sources/a%2fb.json'), 'sources/a%252fb.json');
  for (const invalid of ['javascript:alert(1)', 'https://example.com/a', '//example.com', '/etc/passwd', '../../secrets', '../secrets', 'a/../b', 'a\\b', 'a\nfile']) {
    assert.equal(localArtifactHref(invalid), null, invalid);
  }
});

test('CSV quotes multiline text and neutralizes formula starts including leading whitespace', () => {
  const current = projectRun(completeRun(), options);
  const csv = renderCSV([{ shipmentId: '=HYPERLINK("https://example.com")', orderId: '  +2+2', orderRevision: '@SUM(1)',
    status: 'input-error', before: null, current, owner: '-cmd', nextAction: '\t=EVIL()',
    diagnostics: [{ message: 'one, two\n"three"' }], links: [] }], options);
  assert.match(csv, /^"Shipment","Order","Revision"/);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example.com""\)"/);
  assert.match(csv, /"'  \+2\+2"/);
  assert.match(csv, /"'@SUM\(1\)"/);
  assert.match(csv, /"'-cmd"/);
  assert.match(csv, /"'\t=EVIL\(\)"/);
  assert.match(csv, /one, two\n""three""/);
  assert.match(csv, /\r\n$/);
});

test('formatting uses the configured origin and zone instead of workstation local time', () => {
  assert.match(formatMinute(3960, options), /Nov 19, 2026, 6:00 PM/);
  assert.match(formatMinute(3960, { ...options, timeZone: 'UTC' }), /Nov 20, 2026, 12:00 AM/);
  assert.equal(formatMinute(3960, { timeOrigin: 'not a date' }), 'Not established');
  assert.equal(formatMinute(undefined, options), 'Not established');
});
