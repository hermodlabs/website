import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecordsView } from '@decision-lab/react-views';
import { commitment, EXECUTION_STATUS, inspectReportCompleteness } from '@decision-lab/sdk';
import { BATCH_STATUS, REVIEW_OUTCOME } from './semantics.mjs';

/**
 * Present the CLI's retained report in a logistics team's exception list.
 *
 * This is a report adapter, not another shipment evaluator. It reads choices,
 * expenses, consequences, failed checks, and preference ties already calculated
 * by Decision Lab. In particular, it never adds a quote to a fee, recalculates an
 * arrival, tests a confirmation, or promotes an otherwise blocked arrangement.
 *
 * The adapter deliberately requires a complete assessment. A partial search can
 * contain a feasible witness without establishing the best available choice.
 * The desk's question is which recommendations changed, so a partial witness
 * cannot be presented as a current recommendation here.
 */

const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (object, key) => plain(object) && Object.hasOwn(object, key);
const array = value => Array.isArray(value) ? value : [];
const text = value => value === null || value === undefined ? '' : String(value);
const unique = values => new Set(values).size === values.length;
const same = (a, b) => stable(a) === stable(b);
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (plain(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function table(report, id) {
  const value = report.datasets?.[id];
  return value?.kind === 'table' && Array.isArray(value.rows) ? value : null;
}
function raw(row, key) {
  const cell = row?.cells?.[key];
  if (cell?.available !== true || !own(cell, 'raw')) throw new Error(`The report has no available ${key} value.`);
  return cell.raw;
}
function tablesInSection(report, dataset, sectionId) {
  if (!sectionId || !Array.isArray(dataset.sections?.[sectionId])) throw new Error('A retained plan section is missing.');
  return dataset.sections[sectionId].map(section => table(report, section.datasetId)).filter(Boolean);
}
function hasColumns(value, required) {
  return required.every(key => value.columns?.some(column => column.id === key));
}
function oneTable(values, columns) {
  const found = values.filter(value => hasColumns(value, columns));
  if (found.length !== 1) throw new Error(`The retained report needs one ${columns.join('/')} table for each plan and situation.`);
  return found[0];
}
function assert(condition, message) { if (!condition) throw new Error(message); }

/** Format model minutes using a configured, fixed origin; do not assume local TZ. */
export function formatMinute(minute, options = {}) {
  const origin = Date.parse(options.timeOrigin ?? '');
  if (!Number.isFinite(minute) || !Number.isFinite(origin)) return 'Not established';
  const date = new Date(origin + minute * 60_000);
  if (!Number.isFinite(date.getTime())) return 'Not established';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: options.timeZone ?? 'UTC', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    }).format(date);
  } catch { return 'Not established'; }
}

function money(value, options) {
  if (!Number.isFinite(value)) return 'Not established';
  const divisor = options.moneyDivisor ?? 100;
  if (!Number.isFinite(divisor) || divisor <= 0) return 'Not established';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: options.currency ?? 'USD' }).format(value / divisor); }
  catch { return 'Not established'; }
}

/**
 * Read one complete complete-a-commitment/1 run produced by `decision-lab run`.
 *
 * `preferredIds` contains business arrangement IDs, not generated plan IDs. Keep
 * every tied preferred plan: picking the first row would invent a tie-breaker.
 * `expectedBinding` should be the pinned app/case binding retained by the caller.
 * The full run remains the audit record; this projection is intentionally small.
 */
export function projectRun(run, options = {}) {
  const unavailable = message => ({
    status: REVIEW_OUTCOME.UNAVAILABLE, available: false, issues: [message], identity: run?.identity ?? null,
    scope: null, finding: run?.assessment?.finding ?? null, preferredIds: [], preferredPlanIds: [],
    preferred: [], plans: [], blockers: [],
  });
  try {
    assert(run?.format === 'decision-lab-run/1', 'The file is not a supported Decision Lab run.');
    assert(run.execution?.status === EXECUTION_STATUS.COMPLETED, `The assessment did not complete (${text(run.execution?.status) || 'unknown execution status'}).`);
    const report = run.report;
    assert(report?.format === 'decision-lab-report/1', 'The run has no complete retained report.');
    const completeness = report.completeness;
    assert(inspectReportCompleteness(report).complete, 'The retained report is incomplete or truncated.');
    const dataset = report.datasets?.commitment;
    assert(plain(dataset), 'The run has no commitment report dataset.');
    const assessment = dataset.assessment;
    assert(assessment?.format === 'complete-a-commitment.assessment-normalized/1'
      && assessment.pattern === commitment.COMMITMENT_MODEL_FORMAT && assessment.status === commitment.COMMITMENT_ASSESSMENT_STATUS.COMPLETE,
    'The commitment assessment is unavailable, invalid, or incomplete.');
    assert(run.assessment?.format === 'complete-a-commitment.assessment-reference/1'
      && run.assessment.datasetId === 'commitment'
      && run.assessment.assessmentHash === assessment.assessmentHash
      && run.assessment.status === assessment.status && run.assessment.finding === assessment.finding
      && same(run.assessment.coverage, assessment.coverage) && same(run.assessment.basis, assessment.basis),
    'The run and report do not retain the same assessment basis.');
    assert([commitment.COMMITMENT_FINDING.FEASIBLE_WITNESS, commitment.COMMITMENT_FINDING.NO_FEASIBLE_PLAN].includes(assessment.finding), 'The assessment does not establish a shipment finding.');

    // A valid JSON object can still pair a report with the wrong run or inputs.
    // Check the identities supplied by the CLI before drawing conclusions.
    const identity = run.identity;
    assert(plain(identity) && identity.pattern === commitment.COMMITMENT_MODEL_FORMAT, 'The run belongs to a different reasoning pattern.');
    for (const key of ['runId', 'appId', 'release', 'appHash', 'packageHash', 'pattern', 'moduleHash', 'inputHash', 'modelHash']) {
      assert(identity[key] !== undefined && report.identity?.[key] === identity[key], `The report and run differ at ${key}.`);
    }
    assert(run.execution.inputHash === identity.inputHash
      && report.evaluatedInput?.inputHash === identity.inputHash, 'The retained input identity differs from the execution.');
    for (const binding of [run.input?.binding, report.evaluatedInput?.binding]) {
      assert(plain(binding), 'A retained case binding is missing.');
      for (const key of ['appId', 'release', 'appHash', 'packageHash', 'pattern', 'moduleHash']) {
        assert(binding[key] === identity[key], `The case and run differ at ${key}.`);
      }
    }
    if (options.expectedBinding) {
      for (const [key, value] of Object.entries(options.expectedBinding)) {
        if (value !== undefined) assert(identity[key] === value, `The run does not use the expected ${key}.`);
      }
    }
    assert(same(run.input?.inputs, report.evaluatedInput?.inputs), 'The retained case inputs differ from the reported inputs.');
    assert(report.evaluatedInput?.model?.format === commitment.COMMITMENT_MODEL_FORMAT
      && same(report.evaluatedInput.model.case, report.evaluatedInput.inputs), 'The evaluated model and case inputs differ.');

    const coverage = assessment.coverage;
    const declared = array(dataset.plans);
    const scenarios = array(dataset.scenarios);
    assert(coverage?.complete === true && coverage.admissionComplete === true,
      'The assessment did not examine the complete admitted possibility set.');
    assert(Number.isSafeInteger(coverage.totalCandidates) && coverage.totalCandidates >= 1
      && coverage.totalCandidates === coverage.evaluatedCandidates
      && coverage.totalCandidates === coverage.visitedCandidates
      && coverage.totalCandidates === declared.length && completeness.planCount === declared.length,
    'The retained report does not contain every complete alternative.');
    assert(Number.isSafeInteger(coverage.totalScenarios) && coverage.totalScenarios >= 1
      && coverage.totalScenarios === scenarios.length && completeness.scenarioCount === scenarios.length
      && unique(scenarios.map(row => row.id)), 'The retained report does not contain every operating situation.');
    const expectedContexts = declared.length * scenarios.length;
    assert(coverage.totalPlanScenarioChecks === expectedContexts
      && coverage.evaluatedPlanScenarioChecks === expectedContexts
      && completeness.evaluatedPlanScenarioChecks === expectedContexts,
    'The assessment has incomplete plan and operating-situation coverage.');
    assert(unique(declared.map(row => row.id)) && declared.every(row => row.complete === true
      && typeof row.feasible === 'boolean' && typeof row.id === 'string'), 'The report has incomplete or duplicated plan identities.');

    const comparison = table(report, 'commitment:comparison');
    assert(comparison?.rows.length === declared.length && unique(comparison.rows.map(row => row.id)),
      'The report comparison does not contain every plan exactly once.');
    const contexts = report.contextIndexes?.planScenarios;
    assert(contexts?.entries?.length === expectedContexts, 'Some retained plan and operating-situation contexts are missing.');
    assert(unique(contexts.entries.map(row => `${row.planId}\u0000${row.scenarioId}`)), 'The report repeats a plan and operating-situation context.');
    assert(contexts.entries.every(row => declared.some(plan => plan.id === row.planId)
      && scenarios.some(scenario => scenario.id === row.scenarioId)), 'The report has an unfamiliar plan or operating-situation identity.');

    const module = report.evaluatedInput.model.module;
    const labels = module?.labels ?? {};
    const declaredCheckIds = array(module?.constraints).map(constraint => constraint.id);
    assert(declaredCheckIds.length > 0 && unique(declaredCheckIds)
      && declaredCheckIds.every(id => typeof id === 'string'), 'The evaluated module has no complete condition catalog.');
    const plans = declared.map(plan => {
      const row = comparison.rows.find(value => value.id === plan.id);
      assert(row && raw(row, 'plan') === plan.id, 'A comparison row does not match its plan identity.');
      const arrangementId = raw(row, 'choice:arrangement');
      const expense = raw(row, 'expense');
      assert(typeof arrangementId === 'string' && arrangementId.length > 0 && Number.isFinite(expense),
        'A shipment comparison has no usable arrangement or expense.');
      assert(report.evaluatedInput.inputs.tables?.arrangements?.some(value => value.id === arrangementId),
        'A reported arrangement is absent from the evaluated case.');
      const planContexts = contexts.entries.filter(context => context.planId === plan.id);
      assert(planContexts.length === scenarios.length, 'An alternative is missing an operating situation.');
      const blockers = [];
      const arrivals = [];
      for (const context of planContexts) {
        const checks = oneTable(tablesInSection(report, dataset, context.sections?.checks), ['check', 'requirement', 'status']);
        assert(checks.rows.length === declaredCheckIds.length && unique(checks.rows.map(check => check.id))
          && declaredCheckIds.every(id => checks.rows.some(check => check.id === id)), 'The report has missing or repeated conditions.');
        for (const check of checks.rows) {
          const passed = raw(check, 'status');
          assert(typeof passed === 'boolean', 'A retained condition has no established result.');
          if (!passed) blockers.push({
            id: check.id, planId: plan.id, arrangementId, scenarioId: context.scenarioId,
            label: options.labels?.checks?.[check.id] ?? labels[`constraint.${check.id}`] ?? text(raw(check, 'check')),
            requirement: text(raw(check, 'requirement')),
          });
        }
        const consequences = oneTable(tablesInSection(report, dataset, context.sections?.schedule), ['value', 'result']);
        const arrival = consequences.rows.find(value => value.id === 'arrival');
        const value = raw(arrival, 'result');
        assert(Number.isFinite(value), 'A retained shipment arrival is unavailable.');
        arrivals.push(value);
      }
      assert(plan.feasible === (blockers.length === 0), 'The plan finding and its retained failed checks disagree.');
      assert(raw(row, 'blockers') === blockers.length, 'The plan comparison omits or adds failed checks.');
      // This importer supports static shipment arrangements. If a future profile
      // has scenario-dependent arrivals, retain its report and add an explicit
      // presentation instead of silently choosing an optimistic arrival here.
      assert(arrivals.every(value => value === arrivals[0]), 'The report has scenario-dependent arrivals; this summary cannot display a single arrival.');
      return {
        id: plan.id, arrangementId, label: options.labels?.arrangements?.[arrangementId] ?? arrangementId,
        feasible: plan.feasible, preferred: false, expense, expenseDisplay: money(expense, options),
        arrivalMinutes: arrivals[0], arrival: formatMinute(arrivals[0], options), blockers,
      };
    });
    assert(unique(plans.map(plan => plan.arrangementId)), 'Several complete plans use the same arrangement; this adapter expects one plan per arrangement.');
    const feasible = plans.filter(plan => plan.feasible);
    assert((assessment.finding === commitment.COMMITMENT_FINDING.FEASIBLE_WITNESS) === (feasible.length > 0), 'The summary finding disagrees with the retained alternatives.');
    assert(dataset.summary?.finding === assessment.finding, 'The report summary has a different finding.');
    const recommendation = dataset.summary?.recommendation;
    let preferredPlanIds = [];
    if (feasible.length > 0) {
      assert(dataset.summary.optimalityEstablished === true && recommendation?.preferenceEstablished === true,
        'The complete assessment has not established the declared preference.');
      preferredPlanIds = array(recommendation.tiedPlanIds);
      assert(preferredPlanIds.length > 0 && unique(preferredPlanIds)
        && preferredPlanIds.includes(recommendation.planId)
        && preferredPlanIds.every(id => feasible.some(plan => plan.id === id))
        && recommendation.unique === (preferredPlanIds.length === 1), 'The preferred alternatives are incomplete or inconsistent.');
      for (const plan of plans) plan.preferred = preferredPlanIds.includes(plan.id);
    } else {
      assert(!recommendation || !recommendation.planId && array(recommendation.tiedPlanIds).length === 0,
        'A blocked finding also claims a preferred alternative.');
    }
    const preferred = plans.filter(plan => plan.preferred);
    const parameters = report.evaluatedInput.inputs.parameters;
    return {
      status: feasible.length ? REVIEW_OUTCOME.ELIGIBLE : REVIEW_OUTCOME.BLOCKED, available: true, issues: [], identity: { ...identity },
      scope: { orderId: parameters.orderId, orderRevision: parameters.orderRevision, recipient: parameters.recipient,
        shipDate: parameters.shipDate, profileVersion: parameters.profileVersion },
      finding: assessment.finding, preferredIds: preferred.map(plan => plan.arrangementId), preferredPlanIds,
      preferred, plans, blockers: plans.flatMap(plan => plan.blockers), coverage: { ...coverage },
    };
  } catch (error) { return unavailable(error.message); }
}

const escapeHTML = value => text(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const show = value => value === null || value === undefined || value === '' ? 'Not supplied' : plain(value) || Array.isArray(value)
  ? Array.isArray(value) ? value.map(show).join('; ') : Object.entries(value).map(([key, item]) => `${key}: ${show(item)}`).join('; ')
  : String(value);

/** Links are generated local artifact paths, never arbitrary URL protocols. */
export function localArtifactHref(value) {
  if (typeof value !== 'string' || !value || /[\\\u0000-\u001f\u007f]/.test(value)
    || value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value)) return null;
  const segments = value.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) return null;
  // Encoding % too prevents already-encoded traversal from changing meaning in
  // the browser. Quotes, # and ? remain filename characters rather than syntax.
  return segments.map(encodeURIComponent).join('/');
}

function proposalText(projection, options) {
  if (!projection?.available) return 'Assessment unavailable';
  if (!array(projection.preferredIds).length) return 'No arrangement passes';
  const preferred = array(projection.plans).filter(plan => projection.preferredIds.includes(plan.arrangementId));
  return preferred.map(plan => `${plan.label ?? plan.arrangementId} — ${money(plan.expense, options)}; ${formatMinute(plan.arrivalMinutes, options)}`).join(' | ');
}
function messages(row) {
  const diagnostics = array(row.diagnostics).map(issue => typeof issue === 'string' ? issue
    : `${issue.path ? `${issue.path}: ` : ''}${issue.message ?? show(issue)}`);
  const blockers = array(row.current?.blockers).map(blocker => {
    const arrangement = array(row.current?.plans).find(plan => plan.arrangementId === blocker.arrangementId);
    return `${arrangement?.label ?? blocker.arrangementId}: failed check — ${blocker.label} (${blocker.scenarioId})`;
  });
  return [...new Set([...diagnostics, ...array(row.current?.issues), ...blockers])];
}
const statusNames = {
  [BATCH_STATUS.INPUT_ERROR]: 'Input correction required',
  [BATCH_STATUS.UNAVAILABLE]: 'Assessment unavailable',
  [BATCH_STATUS.BLOCKED]: 'No arrangement passes',
  [BATCH_STATUS.UNCHANGED]: 'Recommendation unchanged',
  [BATCH_STATUS.RECOMMENDATION_CHANGED]: 'Recommendation changed',
  [BATCH_STATUS.CONDITIONS_CHANGED]: 'Conditions changed',
  [BATCH_STATUS.NEW]: 'First usable assessment',
};

function deadlineText(value, options) {
  if (typeof value === 'number') return formatMinute(value, options);
  // Batch metadata stores an ISO instant. Display it in the same configured
  // zone as arrival times instead of forcing users to mentally convert UTC.
  const instant = typeof value === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(value) ? Date.parse(value) : NaN;
  const origin = Date.parse(options.timeOrigin ?? '');
  return Number.isFinite(instant) && Number.isFinite(origin)
    ? formatMinute((instant - origin) / 60_000, options) : value || 'Not supplied';
}

const element = React.createElement;
const listElements = (values, render = show) => values.length
  ? element('ul', null, values.map((value, index) => element('li', { key: index }, render(value))))
  : element('span', { className: 'muted' }, 'None recorded');

// Both the browser desk and this static CLI document use the same table
// renderer. This adapter only chooses the team's columns and link contents.
function records(id, columns, rows, renderValue) {
  return renderToStaticMarkup(element(RecordsView, {
    view: { format: 'record-view/1', id, columns: columns.map(([key, label]) => ({ key, label })), rows },
    renderValue,
  }));
}

function arrangementsTable(row, options) {
  return records(`shipment-${row.shipmentId}-arrangements`, [
    ['label', 'Arrangement'], ['result', 'Calculated result'], ['expense', 'Total expense'],
    ['receipt', 'Customer receipt'], ['blockers', 'Failed conditions'],
  ], array(row.current.plans).map(plan => ({
    id: plan.id, label: plan.label ?? plan.arrangementId,
    result: plan.preferred ? 'Preferred under the declared priorities' : plan.feasible ? 'Passes recorded requirements' : 'Blocked',
    expense: money(plan.expense, options), receipt: formatMinute(plan.arrivalMinutes, options), blockers: array(plan.blockers),
  })), (value, column) => column.key === 'blockers'
    ? listElements(value, blocker => element(React.Fragment, null, blocker.label, element('small', null, `${blocker.requirement}; situation ${blocker.scenarioId}; check ${blocker.id}`)))
    : value);
}

/**
 * Self-contained document. The shipment list is the team's entry point; details
 * retain every alternative and failed condition without exposing raw JSON.
 * The surrounding script decides classification and responsible people. Neither
 * the renderer nor Decision Lab sends messages, books freight, or approves work.
 */
export function renderHTML(rows, metadata = {}) {
  const options = metadata;
  const list = (values, render = value => escapeHTML(show(value))) => values.length
    ? `<ul>${values.map(value => `<li>${render(value)}</li>`).join('')}</ul>` : '<span class="muted">None recorded</span>';
  const links = row => list(array(row.links), link => {
    const href = localArtifactHref(link.href);
    return href ? `<a href="${escapeHTML(href)}">${escapeHTML(link.label)}</a>` : `${escapeHTML(link.label)} (link unavailable)`;
  });
  const summary = records('shipment-exception-queue', [
    ['order', 'Order'], ['status', 'Review status'], ['previous', 'Previous proposal'],
    ['proposal', 'Current proposal'], ['diagnostics', 'Conditions and diagnostics'], ['next', 'Next review'],
  ], rows.map((row, index) => ({ ...row, index, order: row.orderId || row.shipmentId,
    previous: proposalText(row.before, options), proposal: proposalText(row.current, options), diagnostics: messages(row),
  })), (value, column, row) => {
    if (column.key === 'order') return element(React.Fragment, null,
      element('a', { href: `#shipment-${row.index}` }, value),
      element('small', null, `Revision ${row.orderRevision ?? 'not supplied'}`));
    if (column.key === 'status') return element('strong', null, statusNames[row.status] ?? row.status);
    if (column.key === 'diagnostics') return listElements(value);
    if (column.key === 'next') return element(React.Fragment, null,
      row.nextAction || 'Review the retained assessment and its recorded conditions.',
      element('small', null, `Owner: ${row.owner || 'Not assigned'}`, element('br'), `Reservation cutoff: ${deadlineText(row.deadline, options)}`));
    return value;
  });
  const details = rows.map((row, index) => `<section id="shipment-${index}" class="shipment">
    <h2>${escapeHTML(row.orderId || row.shipmentId)} <span class="muted">· ${escapeHTML(row.shipmentId)}</span></h2>
    <p>${escapeHTML(statusNames[row.status] ?? row.status)}. ${escapeHTML(row.nextAction || 'Review the current records before acting.')}</p>
    <h3>Recorded changes</h3>${list(array(row.changes), change => `${escapeHTML(change.path)}: ${escapeHTML(show(change.before))} → ${escapeHTML(show(change.after))}`)}
    <h3>Current arrangements</h3>${row.current?.available ? arrangementsTable(row, options) : `<p>${escapeHTML(array(row.current?.issues).join(' ') || 'No complete current assessment is available.')}</p>`}
    <h3>Source and assessment records</h3>${links(row)}${list(array(row.sources), source => escapeHTML(show(source)))}
    ${row.current?.identity ? `<p class="muted">Run ${escapeHTML(row.current.identity.runId)} · App ${escapeHTML(row.current.identity.appId)} release ${escapeHTML(row.current.identity.release)} · Input ${escapeHTML(row.current.identity.inputHash)}</p>` : ''}
  </section>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeHTML(metadata.title || 'Shipment exceptions')}</title>
<style>body{font:16px/1.55 system-ui,sans-serif;color:#18313f;background:#f4f6f7;margin:0}main{max-width:1500px;margin:auto;padding:32px;overflow-wrap:anywhere}h1,h2,h3{line-height:1.2}h1{margin-bottom:12px}h2{font-size:1.4rem}h3{font-size:1.05rem;margin-top:24px}a{color:#1e5975;text-underline-offset:3px}p{max-width:100ch}table{border-collapse:collapse;width:100%;table-layout:fixed;background:white}th,td{padding:14px;border:1px solid #dce3e8;vertical-align:top;text-align:left;overflow-wrap:anywhere}thead{background:#eaf0f4}small{display:block;margin-top:8px;color:#506577;font-size:.85em}ul{margin:0;padding-left:18px}li+li{margin-top:8px}.muted{color:#596b78;font-weight:400}.notice{border-left:4px solid #597c91;padding:16px 20px;background:#e9f0f5}.shipment{background:white;border:1px solid #dce3e8;border-radius:8px;padding:24px;margin:24px 0;scroll-margin-top:16px}.summary th:first-child{width:10%}.summary th:nth-child(2){width:12%}.summary th:nth-child(3),.summary th:nth-child(4){width:17%}.summary th:nth-child(5){width:22%}.summary th:nth-child(6){width:22%}@media(max-width:760px){main{padding:16px}table,thead,tbody,tr,th,td{display:block;width:auto!important}thead{position:absolute;width:1px!important;height:1px;overflow:hidden;clip-path:inset(50%)}tr{border:1px solid #b9cad5;margin-bottom:16px}td,th{border:0;border-bottom:1px solid #e3e9ed}td[data-label]::before{content:attr(data-label);display:block;font-weight:650;font-size:.85em;color:#506577;margin-bottom:5px}.shipment{padding:16px}}@media print{body{background:white}main{padding:0}.shipment{break-inside:avoid}a{color:inherit}}</style></head>
<body><main><h1>${escapeHTML(metadata.title || 'Shipment exceptions')}</h1><p class="muted">Generated ${escapeHTML(metadata.createdAt || 'at an unspecified time')} · ${rows.length} shipment assessments</p>
<p class="notice">Fictional demonstration calculations awaiting human review. Each shipment is assessed independently against its recorded inputs and the pinned app rules. This report does not establish that shared resources can serve all shipments together. No freight is booked and no operating approval is granted.</p>
<p>Compare the current proposal with its retained predecessor, then open the source and assessment records for any changed or blocked shipment. Tied preferred arrangements remain listed together.</p>
<div class="summary">${summary}</div>
${details}<footer><p class="muted">App: ${escapeHTML(metadata.app?.id || 'See each run')} · Pinned content: ${escapeHTML(metadata.app?.appHash || metadata.app?.contentHash || 'See retained app package')}<br>Time origin: ${escapeHTML(metadata.timeOrigin || 'Not supplied')}; display zone: ${escapeHTML(metadata.timeZone || 'UTC')}. Amounts: ${escapeHTML(metadata.currency || 'USD')}.</p></footer></main></body></html>\n`;
}

// Prefix spreadsheet formula markers, including those preceded by whitespace.
// Quoting alone only satisfies CSV syntax; it does not stop Excel evaluating a
// cell that begins with '='. Keep this CSV an inert report rather than commands.
function csvCell(value) {
  let cell = text(value);
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(cell) || /^[\t\r\n]/u.test(cell)) cell = `'${cell}`;
  return `"${cell.replaceAll('"', '""')}"`;
}

export function renderCSV(rows, options = {}) {
  const headings = ['Shipment', 'Order', 'Revision', 'Status', 'Previous proposal', 'Current proposal', 'Conditions and diagnostics', 'Next action', 'Owner', 'Reservation cutoff', 'Changed inputs', 'Retained records'];
  const values = rows.map(row => [
    row.shipmentId, row.orderId, row.orderRevision, statusNames[row.status] ?? row.status,
    proposalText(row.before, options), proposalText(row.current, options), messages(row).join(' | '),
    row.nextAction, row.owner, deadlineText(row.deadline, options),
    array(row.changes).map(change => `${change.path}: ${show(change.before)} → ${show(change.after)}`).join(' | '),
    array(row.links).filter(link => localArtifactHref(link.href)).map(link => `${link.label}: ${link.href}`).join(' | '),
  ]);
  return [headings, ...values].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
