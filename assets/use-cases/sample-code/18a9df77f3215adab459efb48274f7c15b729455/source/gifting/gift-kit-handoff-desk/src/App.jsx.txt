import React, { useId, useRef, useState } from 'react';
import { WORKFLOW_STEP_STATUS, WORKFLOW_NEXT_ACTION_KIND } from '@decision-lab/sdk';
import { DecisionView, RecordsView } from '@decision-lab/react-views';
import useGiftJourney from './useGiftJourney.js';
import { GIFTING_SCOPE_FIELDS } from './giftingJourney.js';
import { cents } from './gifting.js';

function Field({ label, value, onChange, type = 'text', ...props }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} {...props} /></div>;
}
function Select({ label, value, onChange, children }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={event => onChange(event.target.value)}>{children}</select></div>;
}
const scopeText = scope => GIFTING_SCOPE_FIELDS.map(field => scope?.[field] ?? 'Not supplied').join(' · ');
const labels = { batchId: 'Campaign', insertRevision: 'Insert revision', destinationRevision: 'Destination revision', checkoutRevision: 'Checkout revision', deviceScope: 'Test device', accountScope: 'Intended account' };
const bookingTimeLabels = { recordedAtMinute: 'Booking recorded at (elapsed minute)', validFromMinute: 'Booking valid from (elapsed minute)', validThroughMinute: 'Booking valid through (elapsed minute)' };
const stepStatusLabels = {
  [WORKFLOW_STEP_STATUS.READY]: 'Ready to calculate',
  [WORKFLOW_STEP_STATUS.NEEDS_INPUT]: 'Review or supply inputs',
  [WORKFLOW_STEP_STATUS.BLOCKED]: 'Waiting on a prerequisite',
  [WORKFLOW_STEP_STATUS.INVALID]: 'Correct the inputs',
  [WORKFLOW_STEP_STATUS.STALE]: 'Needs reassessment',
  [WORKFLOW_STEP_STATUS.ACCEPTED]: 'Finding accepted',
  [WORKFLOW_STEP_STATUS.AWAITING_REVIEW]: 'Review the finding',
  [WORKFLOW_STEP_STATUS.REJECTED]: 'Finding rejected',
  [WORKFLOW_STEP_STATUS.NOT_APPLICABLE]: 'Not active',
};
const whole = (value, label) => {
  if (!/^(0|[1-9]\d*)$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error(`${label} needs a nonnegative whole number.`);
  return Number(value);
};
function ScopeFields({ scope, onChange, prefix = '' }) {
  return <div className="form-grid">{GIFTING_SCOPE_FIELDS.map(field => <Field key={field} label={`${prefix}${labels[field]}`} value={scope?.[field]} onChange={value => onChange(field, value)} />)}</div>;
}
function Issues({ issues }) {
  return issues.length ? <div className="notice error" role="alert"><strong>Review needs attention</strong><ul>{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul></div> : null;
}

function SourceRecords({ desk }) {
  const input = desk.draft;
  return <section className="panel">
    <h2>1. Current commitment and source records</h2>
    <p>{desk.config.profile.priorityRationale}</p>
    <div className="form-grid">
      <Field label="Review time (elapsed minute)" type="number" min="0" value={input.commitment.nowMinute} onChange={value => desk.edit('commitment.nowMinute', value)} />
      <Field label="Current proposed cutoff (elapsed minute)" type="number" min="0" value={input.commitment.handoffDeadlineMinute} onChange={value => desk.edit('commitment.handoffDeadlineMinute', value)} />
      <Field label="Planned fresh rehearsal (minutes)" type="number" min="1" value={input.work.rehearsalMinutes} onChange={value => desk.edit('work.rehearsalMinutes', value)} />
      <Field label="Handoff duration (minutes)" type="number" min="1" value={input.work.handoffMinutes} onChange={value => desk.edit('work.handoffMinutes', value)} />
    </div>
    <p><strong>Original promise:</strong> {desk.run.case.journeyContext.originalCase.gifting.commitment.quantity} kits by minute {desk.run.case.journeyContext.originalCase.gifting.commitment.handoffDeadlineMinute}. A revised cutoff is a separate commitment; it does not mark the original promise fulfilled.</p>
    <p className="footnote">One day is 1,440 elapsed minutes from {desk.config.profile.clockOrigin}. Refreshing the planning time does not renew a booking or permission. After an operating decision, record actual events on their own clock without changing the historical decision time.</p>
    <details><summary>Exact current configuration</summary><ScopeFields scope={input.scope} onChange={(field, value) => desk.edit(`scope.${field}`, value)} /></details>
    <details><summary>Complete package quotes</summary>{input.work.quotes.map((quote, index) => <div className="interval-record" key={quote.packageId}>
      <strong>{desk.config.labels.packages[quote.packageId]}</strong><div className="form-grid">
        <Field label={`${quote.packageId} complete price (USD)`} value={desk.quoteCosts[quote.packageId]} onChange={value => desk.editQuoteCost(quote.packageId, value)} />
        <Field label={`${quote.packageId} correction duration (minutes)`} type="number" min="0" value={quote.repairMinutes} onChange={value => desk.edit(`work.quotes.${index}.repairMinutes`, value)} />
      </div></div>)}</details>
    <details><summary>Recorded production availability and operating permissions</summary>
      <p>These original records remain independently scoped. Import a continuing review with replacement source records when they change.</p>
      <RecordsView view={{ format: 'record-view/1', id: 'gifting-availability', columns: [{ key: 'id', label: 'Resource' }, { key: 'availableFromMinute', label: 'From minute' }, { key: 'availableThroughMinute', label: 'Through minute' }], rows: input.work.resources }} />
      <RecordsView view={{ format: 'record-view/1', id: 'gifting-permissions', columns: [{ key: 'packageId', label: 'Package' }, { key: 'source', label: 'Original authorization record' }, { key: 'scopeText', label: 'Scope' }], rows: input.work.permissions.map(row => ({ ...row, scopeText: scopeText(row.scope) })) }} />
    </details>
    <Field label="Person recording input and finding reviews" value={desk.actor} onChange={desk.setActor} />
    <button type="button" onClick={desk.reviewInputs} disabled={desk.status === 'running'}>Review current inputs</button>
    <p className="footnote">This explicitly reviews the current answers. Calculated findings need their own review; neither review grants spending authority.</p>
  </section>;
}

function Diagnostics({ desk }) {
  const outcomes = { decode: ['unreadable', 'approved-target', 'wrong-target'], proof: ['approved-target', 'wrong-target'], checkout: ['usable', 'blocked'], rescan: ['readable', 'unreadable'] };
  return <section className="panel"><h2>2. Actual diagnostic records</h2><p>A source-artwork check and an actual checkout result can justify less correction. A quote cannot remove a fault possibility.</p>
    {desk.draft.observations.map((row, index) => <details key={row.id}><summary>{row.checkId} · {row.outcomeId}</summary>
      <p className="footnote">Recorded scope: {scopeText(row.scope)}</p><div className="form-grid">
        <Select label={`${row.checkId} actual outcome`} value={row.outcomeId} onChange={value => desk.edit(`observations.${index}.outcomeId`, value)}>{outcomes[row.checkId].map(value => <option key={value}>{value}</option>)}</Select>
        <Field label={`${row.checkId} observation minute`} type="number" min="0" value={row.observedAtMinute} onChange={value => desk.edit(`observations.${index}.observedAtMinute`, value)} />
        <Field label={`${row.checkId} original source`} value={row.source} onChange={value => desk.edit(`observations.${index}.source`, value)} />
        <Field label={`${row.checkId} original result text`} value={row.originalText} onChange={value => desk.edit(`observations.${index}.originalText`, value)} />
      </div></details>)}
    <p className="footnote">Wrong-scope and future records are excluded by the evidence app. The profile treats current scoped records as accurate; it does not estimate diagnostic error or probabilities.</p>
  </section>;
}
function Booking({ desk }) {
  const record = desk.draft.work.confirmations[0];
  function edit(field, value) { desk.edit(`work.confirmations.0.${field}`, value); }
  return <section className="panel"><h2>3. External package booking</h2><p>A written booking must cover this exact configuration and the whole proposed working interval.</p>
    {!record ? <button type="button" onClick={() => desk.edit('work.confirmations', [{ id: '', packageId: desk.config.confirmationPackage, confirmed: null, source: '', recordedBy: '', recordedAtMinute: '', validFromMinute: '', validThroughMinute: '', scope: Object.fromEntries(GIFTING_SCOPE_FIELDS.map(field => [field, ''])) }])}>Enter a newly obtained booking</button> : <>
      <div className="form-grid"><Select label="Recorded booking status" value={record.confirmed === true ? 'positive' : record.confirmed === false ? 'negative' : ''} onChange={value => edit('confirmed', value === 'positive')}><option value="" disabled>Select the source's result</option><option value="positive">Confirmed</option><option value="negative">Not confirmed</option></Select>
        <Field label="Booking reference" value={record.id} onChange={value => edit('id', value)} />
        <Field label="Booking source" value={record.source} onChange={value => edit('source', value)} />
        <Field label="Booking recorder" value={record.recordedBy} onChange={value => edit('recordedBy', value)} />
        {Object.entries(bookingTimeLabels).map(([field, label]) => <Field key={field} label={label} type="number" min="0" value={record[field]} onChange={value => edit(field, value)} />)}
      </div><details><summary>Scope stated by the booking</summary><ScopeFields scope={record.scope} prefix="Booking " onChange={(field, value) => edit(`scope.${field}`, value)} /></details>
    </>}
    <p className="footnote">Entering a booking is a record of an external assertion. It does not repair the kits, authorize spending or establish a passed rehearsal.</p>
  </section>;
}

function OperatingRecord({ desk }) {
  const [kind, setKind] = useState('authorization'), [reference, setReference] = useState(''), [source, setSource] = useState('');
  const [recordedMinute, setRecordedMinute] = useState(''), [eventMinute, setEventMinute] = useState(''), [startedMinute, setStartedMinute] = useState('');
  const [amount, setAmount] = useState(''), [relatedReference, setRelatedReference] = useState(''), [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState(''), [sourceScope, setSourceScope] = useState(Object.fromEntries(GIFTING_SCOPE_FIELDS.map(field => [field, ''])));
  const [result, setResult] = useState(''), [scope, setScope] = useState(Object.fromEntries(GIFTING_SCOPE_FIELDS.map(field => [field, '']))), [error, setError] = useState('');
  const decision = desk.view.decision;
  function record() {
    try {
      const minute = whole(eventMinute, 'Event time'), recorded = whole(recordedMinute, 'Recorded time');
      if (!['yes', 'no'].includes(result) && kind !== 'escalation') throw new Error('Select the actual recorded result.');
      let value = { reference, source };
      if (kind === 'authorization') value = { ...value, authorized: result === 'yes', scope: sourceScope, amountMinor: cents(amount), authorizedAtMinute: minute };
      if (kind === 'correction') value = { ...value, completed: result === 'yes', packageId: decision.choices.packageId,
        inputScope: sourceScope, outputScope: scope, quantity: whole(quantity, 'Actual corrected quantity'),
        startedAtMinute: whole(startedMinute, 'Correction start'), completedAtMinute: minute };
      if (kind === 'rehearsal') value = { ...value, passed: result === 'yes', scope, correctionReference: relatedReference, durationMinutes: whole(duration, 'Actual rehearsal duration'), completedAtMinute: minute };
      if (kind === 'handoff') value = { ...value, completed: result === 'yes', scope, rehearsalReference: relatedReference,
        quantity: whole(quantity, 'Actual handed quantity'), completedAtMinute: minute };
      if (kind === 'escalation') value = { ...value, requestedAtMinute: minute, reason: relatedReference };
      desk.record(kind, value, recorded); setError('');
    } catch (cause) { setError(cause.message); }
  }
  return <section className="panel"><h2>5. Actual operating records</h2>
    <p>Selected package: <strong>{decision ? desk.config.labels.packages[decision.choices.packageId] : 'No current operating decision'}</strong></p>
    <p>Keep spending authority, correction completion, a passing rehearsal on the corrected configuration, and the final handoff separate. Supply the original source values.</p>
    <Select label="Operating event" value={kind} onChange={value => { setKind(value); setResult(''); }}>
      <option value="authorization">Spending authorization</option><option value="correction">Actual correction</option><option value="rehearsal">Actual fresh rehearsal result</option><option value="handoff">Actual kit handoff</option><option value="escalation">Escalation or requested revised commitment</option>
    </Select>
    <div className="form-grid"><Field label="External record reference" value={reference} onChange={setReference} /><Field label="External record source" value={source} onChange={setSource} />
      <Field label="Event time (elapsed minute)" type="number" min="0" value={eventMinute} onChange={setEventMinute} /><Field label="Recorded time (elapsed minute)" type="number" min="0" value={recordedMinute} onChange={setRecordedMinute} />
      {kind !== 'escalation' && <Select label="Actual recorded result" value={result} onChange={setResult}><option value="" disabled>Select actual result</option><option value="yes">Approved / completed / passed</option><option value="no">Not approved / incomplete / failed</option></Select>}
      {kind === 'authorization' && <Field label="Authorized amount (USD)" value={amount} onChange={setAmount} />}
      {['correction', 'handoff'].includes(kind) && <Field label="Actual quantity stated in this record (kits)" type="number" value={quantity} onChange={setQuantity} />}
      {kind === 'correction' && <Field label="Actual correction start (elapsed minute)" type="number" value={startedMinute} onChange={setStartedMinute} />}
      {kind === 'rehearsal' && <Field label="Actual rehearsal duration (minutes)" type="number" value={duration} onChange={setDuration} />}
      {['rehearsal', 'handoff', 'escalation'].includes(kind) && <Field label={kind === 'rehearsal' ? 'Correction completion reference' : kind === 'handoff' ? 'Passed rehearsal reference' : 'Reason and responsible next action'} value={relatedReference} onChange={setRelatedReference} />}
    </div>
    {['authorization', 'correction'].includes(kind) && <details open><summary>{kind === 'authorization' ? 'Scope stated by the authorization' : 'Original input scope stated by the correction record'}</summary><ScopeFields scope={sourceScope} prefix="Source " onChange={(field, value) => setSourceScope(current => ({ ...current, [field]: value }))} /></details>}
    {['correction', 'rehearsal', 'handoff'].includes(kind) && <details open><summary>{kind === 'correction' ? 'Actual corrected output configuration' : 'Configuration actually tested or handed over'}</summary><ScopeFields scope={scope} prefix="Actual " onChange={(field, value) => setScope(current => ({ ...current, [field]: value }))} /></details>}
    <Issues issues={error ? [error] : []} />
    <button type="button" onClick={record} disabled={desk.status === 'running' || !decision && kind !== 'escalation'}>Record external event</button>
    <p className="footnote">Recording an event does not authenticate its source or perform the work. A revised commitment is not fulfillment of the original promise.</p>
  </section>;
}

function Results({ desk }) {
  const view = desk.view;
  const report = !desk.dirty && view.currentRun?.report;
  const calculationSteps = new Set(view.output.nextActions
    .filter(action => action.kind === WORKFLOW_NEXT_ACTION_KIND.EVALUATE).map(action => action.stepId));
  return <section className="panel results"><h2>4. Current finding and next action</h2>
    <p role="status"><strong>{desk.dirty ? 'Changed records need review and reassessment.' : view.nextAction}</strong></p>
    <p>Owner: {view.owner}{view.actionDueMinute !== null ? ` · Schedule-only latest start: minute ${view.actionDueMinute}` : ''}</p>
    <p className="footnote">The latest start is derived from recorded task durations. It does not guarantee source availability, permission or supplier response until that time.</p>
    <Issues issues={desk.issues} />
    <RecordsView view={{ format: 'record-view/1', id: 'gifting-review-stages', columns: [{ key: 'title', label: 'Question' }, { key: 'statusText', label: 'Status' }], rows: view.output.steps.map(step => ({ ...step, statusText: stepStatusLabels[step.status] ?? step.status.replaceAll('-', ' ') })) }} />
    <div className="review-actions">{view.output.steps.map(step => <React.Fragment key={step.id}>
      {calculationSteps.has(step.id) && <button type="button" className="primary" onClick={() => desk.evaluate(step.id)} disabled={desk.dirty || desk.status === 'running'}>Calculate {step.id}</button>}
      {step.status === WORKFLOW_STEP_STATUS.AWAITING_REVIEW && <button type="button" onClick={() => desk.acceptFinding(step.id)} disabled={desk.dirty}>Accept {step.id} finding</button>}
    </React.Fragment>)}{desk.status === 'running' && <button type="button" onClick={desk.cancel}>Cancel calculation</button>}</div>
    {view.evidence && <p>{view.evidence.states.length} fault combination(s) remain consistent with the accepted actual diagnostic records. No probabilities are inferred.</p>}
    {report ? <DecisionView report={report} profile={desk.config.decisionPresentation} /> : <p>No current complete planning finding is available for these reviewed inputs.</p>}
    {view.review?.preferred.length > 0 && !desk.dirty && view.planningStep.status === WORKFLOW_STEP_STATUS.ACCEPTED && <>
      <p>Accepting the finding makes it usable for this review. Record a separate operating choice to continue.</p>
      {view.review.preferred.map(plan => <button type="button" key={plan.id} onClick={() => desk.choose(plan.id)}>Choose {plan.label}</button>)}
    </>}
    {view.staleDecision && <p className="notice">The earlier operating decision belongs to a superseded assessment. Review the changed basis before acting.</p>}
    {desk.changes?.available && <p>{desk.changes.findings.preference.changed ? 'The preferred response changed.' : 'The preferred response is unchanged.'} {desk.changes.findings.blockers.changed ? 'The blocking conditions changed.' : ''}</p>}
    <div className="notice"><strong>{!desk.dirty && view.closure?.completed ? 'Original handoff recorded complete' : 'Original handoff not yet established'}</strong><p>{view.closure?.meaning}</p></div>
    <details><summary>Retained operating records and earlier calculations</summary>
      <RecordsView view={{ format: 'record-view/1', id: 'gifting-events', columns: [{ key: 'kind', label: 'Event' }, { key: 'reference', label: 'Original reference' }, { key: 'actor', label: 'Recorded by' }, { key: 'at', label: 'Recorded at' }], rows: view.operations.map(row => ({ ...row, reference: row.record?.reference ?? row.planId })) }} />
      {view.previousRun && <DecisionView report={view.previousRun.report} profile={desk.config.decisionPresentation} stale />}
    </details>
  </section>;
}

export default function App() {
  const desk = useGiftJourney(), file = useRef(null), [fileError, setFileError] = useState('');
  async function importFile(event) {
    const chosen = event.target.files?.[0]; event.target.value = ''; if (!chosen) return;
    try { if (chosen.size > 50000000) throw new Error('The review exceeds 50 MB.'); desk.importReview(await chosen.text()); setFileError(''); }
    catch (error) { setFileError(error.message); }
  }
  return <><header className="site-header"><div><strong>Decision Lab</strong><span>Team app · React SDK example</span></div><span className="demo-tag">Fictional teaching records</span></header><main>
    <div className="page-heading"><div><p className="eyebrow">Event operations</p><h1>Gift-kit Handoff Desk</h1><p>Resolve one kit exception from source records through a recorded handoff.</p></div>
      <div className="file-actions"><button type="button" onClick={() => file.current.click()} disabled={!desk.config}>Open continuing review</button><button type="button" onClick={desk.exportReview} disabled={!desk.run}>Download continuing review</button><button type="button" onClick={desk.save} disabled={!desk.run}>Save locally</button><button type="button" onClick={desk.reopen} disabled={!desk.run}>Reopen saved review</button><input hidden ref={file} type="file" accept=".json,application/json" aria-label="Open continuing review" onChange={importFile} /></div>
    </div><Issues issues={fileError ? [fileError] : []} />
    {desk.config && desk.draft && desk.view ? <>
      <details className="panel"><summary>Start a fictional teaching case</summary><div className="case-list">{desk.config.cases.map(entry => <button type="button" key={entry.id} onClick={() => desk.selectCase(entry.id)} disabled={desk.status === 'running'} aria-pressed={entry.id === desk.selectedId}>{entry.label}</button>)}</div><p>{desk.config.cases.find(row => row.id === desk.selectedId)?.description}</p></details>
      <div className="workspace"><div><SourceRecords desk={desk} /><Diagnostics desk={desk} /><Booking desk={desk} /></div><div><Results desk={desk} /><OperatingRecord desk={desk} /></div></div>
    </> : <section className="panel"><p>{desk.status === 'loading' ? 'Loading the pinned workflow and source records…' : 'The review could not be opened.'}</p><Issues issues={desk.issues} /></section>}
    <footer>The SDK owns evidence and planning findings. The authored workflow checks the recorded completion basis. Sources and operating events are supplied assertions; this sample does not authenticate people, spend money or perform production.</footer>
  </main></>;
}
