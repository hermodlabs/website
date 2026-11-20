import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecordsView } from '@decision-lab/react-views';
import { formatMinutes, formatPosition } from './gifting.js';

const h = React.createElement;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const labels = {
  eligible: 'Ready for review', blocked: 'No package meets the requirements',
  'input-error': 'Correct the inputs', unavailable: 'Assessment unavailable',
};
const position = formatPosition;
const duration = formatMinutes;
const interval = (start, end) => `${position(start)} to ${position(end)}`;
const list = (values, render = value => value, empty = 'None recorded.') => h('ul', null,
  values.length ? values.map((value, index) => h('li', { key: index }, render(value))) : h('li', null, empty));
const records = (id, columns, rows, renderValue) => h(RecordsView, {
  view: { format: 'record-view/1', id, columns: columns.map(([key, label]) => ({ key, label })), rows }, renderValue,
});

function timingBasis(row, policy) {
  const timing = row.review?.timing ?? row.basis?.timing;
  if (!timing) return null;
  const fields = [
    ['Review time', position(timing.nowMinute)], ['Handoff cutoff', position(timing.handoffDeadlineMinute)],
    ['Time remaining at review', duration(Number.isFinite(timing.handoffDeadlineMinute) && Number.isFinite(timing.nowMinute)
      ? timing.handoffDeadlineMinute - timing.nowMinute : undefined)],
    ['Planned rehearsal', duration(timing.rehearsalMinutes)],
    ['Published rehearsal minimum', duration(policy?.minimumRehearsalMinutes)],
    ['Handoff duration', duration(timing.handoffMinutes)],
    ['Candidate starts', Array.isArray(timing.startOptions) ? timing.startOptions.map(position).join(', ') : 'Not established'],
  ];
  return h('section', { className: 'basis' }, h('h3', null, 'Timing basis'),
    h('dl', null, fields.map(([name, value]) => h('div', { key: name }, h('dt', null, name), h('dd', null, value)))),
    h('p', null, h('small', null, 'T+ marks a position after the case’s review origin. Rehearsal and handoff are durations. Candidate starts are the finite choices supplied for this review.')));
}
function scope(record) {
  return [['Campaign', 'batchId'], ['Insert', 'insertRevision'], ['Destination', 'destinationRevision'],
    ['Checkout', 'checkoutRevision'], ['Device', 'deviceScope'], ['Account', 'accountScope']]
    .map(([label, field]) => `${label}: ${record[field] ?? 'Not supplied'}`).join(' · ');
}
function sourceRecords(row) {
  const basis = row.basis;
  if (!basis) return null;
  return h('details', { className: 'records' }, h('summary', null, 'Recorded availability, permissions and confirmation'),
    h('p', null, h('small', null, 'These are the supplied records. A later cutoff does not extend an interval or change its scope. Failed conditions in the comparison come from the app.')),
    h('h4', null, 'Production availability'), list(basis.calendars, record => h(React.Fragment, null,
      h('strong', null, record.resource), `: ${interval(record.start, record.end)}`), 'No availability recorded.'),
    h('h4', null, 'Existing resource bookings'), list(basis.bookings, record => h(React.Fragment, null,
      h('strong', null, record.resource), `: ${interval(record.start, record.end)}`, record.amount === undefined ? '' : `; occupied units ${record.amount}`,
      h('small', null, record.id)), 'No bookings recorded.'),
    h('h4', null, 'Operating permissions'), list(basis.permissions, record => h(React.Fragment, null,
      h('strong', null, record.packageId), ` · ${interval(record.validFrom, record.validThrough)}`,
      h('small', null, `${record.id} · actor ${record.actorId}`, h('br'), scope(record), h('br'), `Source: ${record.source ?? ''}`)), 'No permission recorded.'),
    h('h4', null, 'External-booking confirmation'), list(basis.confirmations, record => h(React.Fragment, null,
      h('strong', null, record.packageId), ` · ${record.confirmed === true ? 'Confirmed' : record.confirmed === false ? 'Not confirmed' : 'Status not supplied'} · ${interval(record.validFrom, record.validThrough)}`,
      h('small', null, `${record.id} · recorded at ${position(record.recordedAt)} by ${record.recordedBy}`, h('br'), scope(record), h('br'), `Source: ${record.source ?? ''}`)), 'No confirmation recorded.'));
}
function details(row, policy) {
  const basis = timingBasis(row, policy);
  if (row.status === 'input-error' || row.status === 'unavailable') return h(React.Fragment, null, list(row.messages), basis, sourceRecords(row));
  const preferred = row.review?.preferred ?? [], plans = row.review?.plans ?? [];
  const proposal = preferred.length
    ? h(React.Fragment, null, h('p', null, h('strong', null, preferred.map(plan => plan.label).join(' or '))),
      list(preferred, plan => `${plan.expenseDisplay} · handoff finishes ${position(plan.finishMinute)} · cutoff slack ${duration(plan.deadlineSlackMinute)}`))
    : h('p', null, 'Review the failed conditions before proposing a handoff package.');
  return h(React.Fragment, null, proposal, basis,
    h('details', null, h('summary', null, `Compare all ${plans.length} calculated package/start combinations`),
      records(`gift-kit-${row.id}-packages`, [
        ['label', 'Package'], ['result', 'Calculated result'], ['expenseDisplay', 'Total expense'],
        ['start', 'Planned start'], ['finish', 'Handoff finishes'], ['slack', 'Cutoff slack'], ['blockers', 'Failed conditions'],
      ], plans.map(plan => ({ ...plan, result: plan.feasible ? 'meets the requirements' : 'blocked',
        start: position(plan.startMinute), finish: position(plan.finishMinute), slack: duration(plan.deadlineSlackMinute),
        blockers: [...new Set(plan.blockers.map(item => item.label))],
      })), (value, column) => column.key === 'blockers' ? list(value) : value)),
    sourceRecords(row));
}

// The app generates local artifact paths. Reject protocols or traversal if this
// renderer is called separately with an untrusted manifest.
function localArtifactHref(value) {
  if (typeof value !== 'string' || !value || /[\\\u0000-\u001f\u007f]/.test(value)
    || value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value)) return null;
  const segments = value.split('/');
  return segments.some(segment => !segment || segment === '.' || segment === '..') ? null : segments.map(encodeURIComponent).join('/');
}
function continueReview(row) {
  const action = row.status === 'eligible' ? 'Review the proposed package and obtain the required operating approvals.'
    : row.status === 'blocked' ? 'Review the failed conditions and recorded intervals, revise the inputs where supported, then reassess.'
      : row.status === 'input-error' ? 'Correct the source case before using a recommendation.' : 'Resolve the assessment problem, then run it again.';
  const downloads = [['case', 'Download case for the React desk'], ['run', 'Download complete CLI report'], ['validation', 'Input validation']];
  return h(React.Fragment, null, h('p', null, action), downloads.map(([field, label]) => {
    const href = localArtifactHref(row[field]);
    return href ? h(React.Fragment, { key: field }, h('a', { href, download: true }, label), h('br')) : null;
  }));
}

export function renderHTML(manifest) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gift-kit preflight</title><style>
body{font:16px/1.55 system-ui,sans-serif;color:#233c4a;background:#f3f6f8;margin:0}main{max-width:1200px;padding:28px;margin:auto}
h1{line-height:1.15}a{color:#126183}table{width:100%;border-collapse:collapse;background:white}th,td{padding:16px;text-align:left;vertical-align:top;border-bottom:1px solid #d9e3e8}th{background:#e8f0f4}p{margin:0 0 12px}ul{padding-left:21px}summary{cursor:pointer}small{display:block;color:#506978}li{margin-bottom:10px;overflow-wrap:anywhere}
.notice{border-left:4px solid #527f96;background:white;padding:16px;margin:20px 0}.status{font-weight:650}footer{padding:20px 0}.basis{margin:18px 0}.basis h3{font-size:1rem;margin:0 0 8px}dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 8px}dl div{padding:8px;background:#f3f6f8}dt{font-size:.8rem;color:#506978}dd{margin:0;overflow-wrap:anywhere}details{margin:16px 0}.records h4{margin:16px 0 6px}
@media(max-width:700px){main{padding:16px}table,tbody,tr,tbody th,td{display:block}thead{display:none}tr{padding:10px;margin-bottom:16px;background:white;border:1px solid #d9e3e8}tbody th,td{border:0;padding:8px}tbody th:before,td:before{content:attr(data-label);display:block;font-weight:650;color:#506978;font-size:.85rem}dl{grid-template-columns:1fr}}
</style></head><body><main><h1>Gift-kit preflight</h1>
<p>Compare complete preparation and handoff packages before the event team commits to one.</p>
<div class="notice">These are calculated proposals awaiting review. A slot confirmation does not provide operating permission or establish that preparation and handoff happened. Each campaign is evaluated independently.</div>
<p><small>App: ${escape(manifest.binding.appId)} · release ${escape(manifest.binding.release)}<br>Generated ${escape(manifest.createdAt)}</small></p>
${renderToStaticMarkup(records('gift-kit-preflight-queue', [
  ['campaign', 'Campaign'], ['outcome', 'Outcome'], ['comparison', 'Package comparison'], ['next', 'Continue the review'],
], manifest.campaigns, (value, column, row) => {
  if (column.key === 'campaign') return h(React.Fragment, null, h('strong', null, row.id), h('small', null, row.owner));
  if (column.key === 'outcome') return h(React.Fragment, null, h('span', { className: 'status' }, labels[row.status]),
    row.review?.available ? h('small', null, `${row.review.scenarioCount} retained fault configuration${row.review.scenarioCount === 1 ? '' : 's'}`) : null);
  if (column.key === 'comparison') return details(row, manifest.policy);
  return continueReview(row);
}))}<footer>Each result applies only to the supplied and admitted fault configurations. This review does not infer which fault actually occurred or reserve shared staff, equipment, funds, or a handoff slot.</footer>
</main></body></html>\n`;
}
