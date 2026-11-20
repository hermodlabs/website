import React, { useId, useRef, useState } from 'react';
import { DecisionView } from '@decision-lab/react-views';
import useGiftReview from './useGiftReview.js';
import { formatMinutes, formatMoney } from './gifting.js';

function Field({ label, value, onChange, type = 'text', ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
        {...props}
      />
    </div>
  );
}

function Select({ label, value, onChange, children }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={event => onChange(event.target.value)}>
        {children}
      </select>
    </div>
  );
}

function Issues({ issues }) {
  if (!issues.length) return null;
  return (
    <div className="notice error" role="alert">
      <strong>Review needs attention</strong>
      <ul>
        {issues.map((issue, index) => (
          <li key={index}>{typeof issue === 'string' ? issue : issue.message}</li>
        ))}
      </ul>
    </div>
  );
}

function BatchBasis({ caseData, config }) {
  const values = caseData.parameters;
  return (
    <section className="batch-basis" aria-label="Current gift-kit commitment">
      <div>
        <span className="eyebrow">Current batch</span>
        <h2>{values.batchId}</h2>
        <p>{values.quantity} gift kits · Insert revision {values.insertRevision}</p>
      </div>
      <dl>
        <div><dt>Package budget</dt><dd>{formatMoney(values.budgetMinor, config)}</dd></div>
        <div><dt>Destination / checkout revisions</dt><dd>{values.destinationRevision} / {values.checkoutRevision}</dd></div>
        <div><dt>Device / account</dt><dd>{values.deviceScope} / {values.accountScope}</dd></div>
      </dl>
    </section>
  );
}

function ReviewSetup({ draft, policy, editSetup }) {
  const edit = field => value => editSetup(field, value);
  return (
    <section className="panel" aria-labelledby="setup-heading">
      <h2 id="setup-heading">1. Review setup</h2>
      <p>Set when work may start and when handoff must finish. Positions are whole minutes from the fixed start of this review; one day is 1,440 elapsed minutes.</p>
      <div className="form-grid">
        <Field label="Recorded review time (minute)" type="number" min="0" step="1" value={draft.setup.nowMinute} onChange={edit('nowMinute')} />
        <Field label="Handoff cutoff (minute)" type="number" min="0" step="1" value={draft.setup.handoffDeadlineMinute} onChange={edit('handoffDeadlineMinute')} />
        <Field label="Planned rehearsal (minutes)" type="number" min="1" step="1" value={draft.setup.rehearsalMinutes} onChange={edit('rehearsalMinutes')} />
        <Field label="Handoff duration (minutes)" type="number" min="1" step="1" value={draft.setup.handoffMinutes} onChange={edit('handoffMinutes')} />
      </div>
      <p className="policy-note">Published rehearsal minimum: <strong>{formatMinutes(policy.minimumRehearsalMinutes)}</strong>. Planning a longer rehearsal does not change this rule.</p>
      <Field label="Candidate starts (minutes)" value={draft.setup.startOptions} onChange={edit('startOptions')} placeholder="0, 60" />
      <p className="footnote">Only the listed starts are assessed. Changing the review time or cutoff does not move these starts or extend availability, permissions or a confirmation.</p>
    </section>
  );
}

function QuoteForm({ draft, config, editQuote }) {
  const [selectedId, setSelectedId] = useState(config.confirmationPackage);
  const quote = draft.quotes.find(row => row.id === selectedId) ?? draft.quotes[0];
  const edit = field => value => editQuote(quote.id, field, value);
  return (
    <section className="panel" aria-labelledby="quotes-heading">
      <h2 id="quotes-heading">2. Package quote</h2>
      <p>Each quote covers a complete correction package. Update the actual offer, keeping its quoted quantity and duration.</p>
      <Select label="Package quote" value={quote.id} onChange={setSelectedId}>
        {draft.quotes.map(row => <option key={row.id} value={row.id}>{config.labels.packages[row.id] ?? row.id}</option>)}
      </Select>
      <div className="form-grid">
        <Field label="Total package amount" type="number" value={quote.totalCost} onChange={edit('totalCost')} min="0" step="0.01" />
        <Select label="Quote currency" value={quote.currency} onChange={edit('currency')}>
          <option value="USD">USD — US dollar</option>
          <option value="EUR">EUR — Euro</option>
        </Select>
        <Field label="Quoted quantity (kits)" type="number" value={quote.quantity} onChange={edit('quantity')} min="1" step="1" />
        <Field label="Correction duration (minutes)" type="number" value={quote.repairMinutes} onChange={edit('repairMinutes')} min="0" step="1" />
      </div>
      <p className="footnote">Amounts are complete USD package expenses. Rehearsal and handoff remain required after the correction work.</p>
    </section>
  );
}

function ConfirmationForm({ draft, editConfirmation }) {
  const record = draft.confirmation;
  const edit = field => value => editConfirmation(field, value);
  return (
    <section className="panel" aria-labelledby="confirmation-heading">
      <h2 id="confirmation-heading">3. Vendor confirmation</h2>
      <p>Record what the written confirmation actually covers. Changing the current batch does not update an older record.</p>
      <div className="form-grid">
        <Select label="Confirmation status" value={record.status} onChange={edit('status')}>
          <option value="none">No recorded confirmation</option>
          <option value="positive">Positive confirmation</option>
          <option value="negative">Negative confirmation</option>
        </Select>
        <Field label="Confirmation reference" value={record.id} onChange={edit('id')} />
        <Field label="Confirmation source" value={record.source} onChange={edit('source')} />
        <Field label="Recorded by" value={record.recordedBy} onChange={edit('recordedBy')} />
      </div>
      <p className="footnote">For {record.packageId}. A positive confirmation does not prove correction work has finished.</p>
      <details open>
        <summary>Batch and revisions covered</summary>
        <div className="form-grid">
          <Field label="Confirmation batch" value={record.batchId} onChange={edit('batchId')} />
          <Field label="Confirmation insert revision" value={record.insertRevision} onChange={edit('insertRevision')} />
          <Field label="Confirmation destination revision" value={record.destinationRevision} onChange={edit('destinationRevision')} />
          <Field label="Confirmation checkout revision" value={record.checkoutRevision} onChange={edit('checkoutRevision')} />
          <Field label="Confirmation device scope" value={record.deviceScope} onChange={edit('deviceScope')} />
          <Field label="Confirmation account scope" value={record.accountScope} onChange={edit('accountScope')} />
        </div>
      </details>
      <details>
        <summary>Recorded time and validity</summary>
        <p>Times are elapsed minutes from this batch’s preparation clock, rather than wall-clock timestamps.</p>
        <div className="form-grid">
          <Field label="Recorded at (minute)" type="number" value={record.recordedAt} onChange={edit('recordedAt')} step="1" />
          <Field label="Valid from (minute)" type="number" value={record.validFrom} onChange={edit('validFrom')} step="1" />
          <Field label="Valid through (minute)" type="number" value={record.validThrough} onChange={edit('validThrough')} step="1" />
        </div>
      </details>
    </section>
  );
}

function AvailabilityForm({ draft, caseData, config, editAvailability }) {
  const { calendars, bookings, permissions } = draft.availability;
  const edit = (table, index, field) => value => editAvailability(table, index, field, value);
  return (
    <section className="panel" aria-labelledby="availability-heading">
      <h2 id="availability-heading">4. Availability and permissions</h2>
      <p>Update intervals only when the underlying record has changed. Package, person and configuration scopes stay attached to their original records.</p>
      <details>
        <summary>Production availability · {calendars.length} interval{calendars.length === 1 ? '' : 's'}</summary>
        {calendars.map((row, index) => (
          <div className="interval-record" key={index}>
            <strong>{row.resource}</strong>
            <p className="footnote">Recorded capacity: {caseData.tables.resources.find(resource => resource.id === row.resource)?.capacity ?? 'Not recorded'}</p>
            <div className="form-grid">
              <Field label={`Availability ${index + 1} starts (minute)`} type="number" min="0" step="1" value={row.start} onChange={edit('calendars', index, 'start')} />
              <Field label={`Availability ${index + 1} ends (minute)`} type="number" min="0" step="1" value={row.end} onChange={edit('calendars', index, 'end')} />
            </div>
          </div>
        ))}
        {!calendars.length && <p className="footnote">No availability is recorded.</p>}
      </details>
      <details>
        <summary>Existing bookings · {bookings.length} records</summary>
        {bookings.map((row, index) => (
          <div className="interval-record" key={row.id}>
            <strong>{row.id} · {row.resource}</strong>
            <div className="form-grid">
              <Field label={`Booking ${row.id} starts (minute)`} type="number" min="0" step="1" value={row.start} onChange={edit('bookings', index, 'start')} />
              <Field label={`Booking ${row.id} ends (minute)`} type="number" min="0" step="1" value={row.end} onChange={edit('bookings', index, 'end')} />
              <Field label={`Booking ${row.id} resource units`} type="number" min="1" step="1" value={row.amount} onChange={edit('bookings', index, 'amount')} />
            </div>
          </div>
        ))}
        {!bookings.length && <p className="footnote">No existing bookings are recorded in this case.</p>}
      </details>
      <details>
        <summary>Operating permission validity · {permissions.length} records</summary>
        {permissions.map((row, index) => (
          <div className="interval-record" key={row.id}>
            <strong>{config.labels.packages[row.packageId] ?? row.packageId}</strong>
            <p className="footnote">{row.id} · {row.actorId}<br />{row.source}</p>
            <p className="record-scope">{row.batchId} · {row.insertRevision} · {row.destinationRevision} · {row.checkoutRevision}<br />{row.deviceScope} · {row.accountScope}</p>
            <div className="form-grid">
              <Field label={`Permission ${row.id} valid from (minute)`} type="number" min="0" step="1" value={row.validFrom} onChange={edit('permissions', index, 'validFrom')} />
              <Field label={`Permission ${row.id} valid through (minute)`} type="number" min="0" step="1" value={row.validThrough} onChange={edit('permissions', index, 'validThrough')} />
            </div>
          </div>
        ))}
        {!permissions.length && <p className="footnote">No operating permissions are recorded.</p>}
      </details>
      <p className="footnote">Times use the same review origin as the cutoff. Import a complete case to add records, change their scope, or change resource capacity. Editing validity does not obtain external authorization.</p>
    </section>
  );
}

function Results({ desk }) {
  const { current, before, status } = desk;
  const labels = {
    loading: 'Loading case', ready: 'Ready to review', dirty: 'Needs reassessment',
    running: 'Reviewing packages', complete: 'Review complete',
    invalid: 'Inputs need attention', unavailable: 'Assessment unavailable',
  };
  const earlierRun = status === 'complete' ? desk.previousRun : desk.run;
  return (
    <section className="panel results" aria-labelledby="results-heading">
      <div className="results-heading">
        <h2 id="results-heading">Package recommendation</h2>
        <span className="state" role="status" aria-live="polite">{labels[status]}</span>
      </div>
      <div className="review-actions">
        <button type="button" className="primary" onClick={desk.evaluate} disabled={status === 'loading' || status === 'running'}>Review packages</button>
        {status === 'running' && <button type="button" onClick={desk.cancel}>Cancel review</button>}
        <button type="button" onClick={desk.downloadRun} disabled={!current}>Download SDK run</button>
      </div>
      <Issues issues={desk.issues} />
      {current ? <DecisionView report={desk.run.report} profile={desk.config.decisionPresentation} /> : (
        <div className="empty-state">
          <strong>{status === 'dirty' ? 'The records have changed.' : 'Review the current batch records.'}</strong>
          <p>Choose Review packages to assess the current quotes, confirmation, resources and permissions together.</p>
        </div>
      )}
      {before && earlierRun && <details className="previous" aria-label="Previous calculation">
        <summary>Previous calculation</summary>
        <p>Earlier evaluated inputs, retained for comparison.</p>
        <DecisionView report={earlierRun.report} profile={desk.config.decisionPresentation} stale />
      </details>}
      <p className="boundary">
        A passing package is a proposal for review. Recorded permissions are not
        authenticated approval. The screen does not order replacements, perform
        repairs, rehearse a checkout or complete the handoff.
      </p>
    </section>
  );
}

export default function App() {
  const desk = useGiftReview();
  const fileInput = useRef(null);
  const [fileError, setFileError] = useState('');
  const [scenarioGroup, setScenarioGroup] = useState('');
  const groups = [...new Set(desk.cases.map(entry => entry.scenarioGroup))];
  const group = scenarioGroup || groups[0];

  function chooseGroup(value) {
    setScenarioGroup(value);
    const first = desk.cases.find(entry => entry.scenarioGroup === value);
    if (first) void desk.selectCase(first.id);
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setFileError('');
      if (file.size > 50000000) throw new Error('The case file must be smaller than 50 MB.');
      desk.importCaseText(await file.text());
    } catch (error) {
      setFileError(error.message);
    }
  }

  return (
    <>
      <header className="site-header">
        <div><strong>Decision Lab</strong><span>Team app · React SDK example</span></div>
        <span className="demo-tag">Fictional teaching records</span>
      </header>
      <main>
        <div className="page-heading">
          <div><p className="eyebrow">Event operations</p><h1>Gift-kit Handoff Desk</h1><p>Which complete correction package can we put forward before the kits leave?</p></div>
          <div className="file-actions">
            <button type="button" onClick={() => fileInput.current.click()} disabled={!desk.config}>Import case</button>
            <button type="button" onClick={desk.downloadCase} disabled={!desk.caseData || desk.status === 'loading'}>Download case inputs</button>
            <input ref={fileInput} aria-label="Import case" type="file" accept=".json,application/json" onChange={importFile} hidden />
          </div>
        </div>
        <Issues issues={fileError ? [{ message: fileError }] : []} />
        <section className="samples" aria-label="Worked cases">
          <h2>Start with a prepared case</h2>
          {groups.length > 1 && (
            <div className="scenario-picker">
              <Select label="Scenario set" value={group} onChange={chooseGroup}>
                {groups.map(value => <option key={value} value={value}>{value}</option>)}
              </Select>
            </div>
          )}
          <div className="sample-cards">
            {desk.cases.filter(entry => entry.scenarioGroup === group).map(entry => (
              <button
                key={entry.id}
                type="button"
                className="sample-card"
                aria-label={entry.label}
                aria-pressed={desk.selectedCaseId === entry.id}
                onClick={() => desk.selectCase(entry.id)}
              >
                <strong>{entry.label}</strong><span>{entry.description}</span>
              </button>
            ))}
          </div>
        </section>
        {desk.caseData && desk.draft ? (
          <>
            <BatchBasis caseData={desk.caseData} config={desk.config} />
            <div className="desk-layout">
              <fieldset className="input-column" aria-label="Current case inputs" disabled={desk.status === 'loading'}>
                <ReviewSetup draft={desk.draft} policy={desk.policy} editSetup={desk.editSetup} />
                <QuoteForm draft={desk.draft} config={desk.config} editQuote={desk.editQuote} />
                <ConfirmationForm draft={desk.draft} editConfirmation={desk.editConfirmation} />
                <AvailabilityForm draft={desk.draft} caseData={desk.caseData} config={desk.config} editAvailability={desk.editAvailability} />
              </fieldset>
              <Results desk={desk} />
            </div>
          </>
        ) : (
          <section className="panel">
            <p role="status">{desk.status === 'loading' ? 'Loading the pinned app and batch records…' : 'The batch could not be loaded.'}</p>
            <Issues issues={desk.issues} />
          </section>
        )}
        <footer>
          React collects and displays records. The pinned app and SDK evaluate the rules.
          <span>No automatic save; download inputs to retain edits.</span>
        </footer>
      </main>
    </>
  );
}
