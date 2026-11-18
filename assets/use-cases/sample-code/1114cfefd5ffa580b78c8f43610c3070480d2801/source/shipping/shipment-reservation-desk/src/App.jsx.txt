import React, { useId, useRef, useState } from 'react';
import { DecisionView } from '@decision-lab/react-views';
import useShipmentReview from './useShipmentReview.js';
import { formatMoney, formatTime } from './shipment.js';
import { REVIEW_STATE, SLOT_CONFIRMATION_STATUS } from './semantics.js';
import './styles.css';

function Icon({ name, size = 18 }) {
  const paths = {
    truck: (
      <>
        <path d="M3 6h11v11H3zM14 10h4l3 4v3h-7" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    upload: <path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" />,
    download: <path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4" />,
    arrow: <path d="m9 5 7 7-7 7M3 12h13" />,
    check: <path d="m5 12 4 4L19 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v1" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.info}
    </svg>
  );
}

function Field({ label, value, onChange, type = 'text', hint, readOnly = false, ...props }) {
  const id = useId();

  return (
    <div className={`field${readOnly ? ' field-readonly' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value ?? ''}
        onChange={event => onChange?.(event.target.value)}
        readOnly={readOnly}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && <span id={`${id}-hint`} className="field-hint">{hint}</span>}
    </div>
  );
}

function Select({ label, value, onChange, children }) {
  const id = useId();

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value ?? ''} onChange={event => onChange(event.target.value)}>
        {children}
      </select>
    </div>
  );
}

function SectionHeading({ eyebrow, title, children, number, id }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id}>
          {number && <span className="section-number">{number}</span>}
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Issues({ issues = [], error }) {
  if (!error && !issues.length) return null;

  return (
    <div className="issues" role="alert">
      <strong>Review needs attention</strong>
      {error && <p>{error}</p>}
      {issues.length > 0 && (
        <ul>
          {issues.map((issue, index) => (
            <li key={`${issue.path}-${index}`}>
              {typeof issue === 'string' ? issue : issue.message}
              {typeof issue !== 'string' && issue.path && (
                <span className="issue-path">{issue.path}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShipmentBasis({ caseData, config }) {
  const values = caseData.parameters;

  return (
    <section className="shipment-basis" aria-label="Shipment commitment">
      <div className="basis-identity">
        <span className="eyebrow">Current shipment</span>
        <strong>
          {values.orderId}
          <span className="revision">Revision {values.orderRevision}</span>
        </strong>
        <span>{values.recipient} · {values.quantity} units · Ship {values.shipDate}</span>
        <span className="review-as-of">As of {formatTime(values.currentTime, config)}</span>
      </div>
      <dl className="basis-facts">
        <div>
          <dt>Expense limit</dt>
          <dd>{formatMoney(values.expenseLimit, config)}</dd>
        </div>
        <div>
          <dt>Reserve by</dt>
          <dd>{formatTime(values.reservationDeadline, config)}</dd>
        </div>
        <div>
          <dt>Delivery deadline</dt>
          <dd>{formatTime(values.receiptDeadline, config)}</dd>
        </div>
      </dl>
    </section>
  );
}

function QuoteForm({ draft, editQuote, config }) {
  const [selectedId, setSelectedId] = useState('consolidated');
  const quotes = draft.quotes;
  const quote = quotes.find(row => row.id === selectedId) ?? quotes[0];
  const label = id => config.labels.arrangements[id] ?? id;
  const edit = field => value => editQuote(quote.id, field, value);

  return (
    <section className="panel record-panel" aria-labelledby="quotes-heading">
      <div className="panel-content">
        <SectionHeading id="quotes-heading" number="1" title="Freight quote">
          <span className="subtle-tag">Editable record</span>
        </SectionHeading>
        <p className="section-description">
          Update the complete quoted amount and transport details for an arrangement.
        </p>
        <div className="quote-tabs" role="group" aria-label="Arrangement to edit">
          {quotes.map(row => (
            <button
              type="button"
              key={row.id}
              aria-pressed={row.id === quote.id}
              onClick={() => setSelectedId(row.id)}
            >
              {label(row.id)}
            </button>
          ))}
        </div>
        <fieldset>
          <legend className="sr-only">{label(quote.id)} quote</legend>
          <div className="quote-context">
            <strong>{label(quote.id)}</strong>
            <span>Ship point {quote.shipPoint}</span>
          </div>
          <div className="form-grid">
            <Field
              label="Complete quote amount"
              type="number"
              value={quote.totalCost}
              onChange={edit('totalCost')}
              min="0"
              step="0.01"
              hint="All quoted shipment costs, in the currency shown."
            />
            <Select label="Quote currency" value={quote.currency} onChange={edit('currency')}>
              <option value="USD">USD — US dollar</option>
              <option value="EUR">EUR — Euro</option>
            </Select>
            <Field
              label="Departure"
              type="datetime-local"
              value={quote.departure}
              onChange={edit('departure')}
            />
            <Field
              label="Travel time (minutes)"
              type="number"
              value={quote.travelMinutes}
              onChange={edit('travelMinutes')}
              min="0"
              step="1"
            />
            <Field
              label="Shipment capacity (units)"
              type="number"
              value={quote.capacity}
              onChange={edit('capacity')}
              min="0"
              step="1"
            />
            <div className="field static-field">
              <span className="field-label">Ship point</span>
              <span>{quote.shipPoint}</span>
            </div>
          </div>
        </fieldset>
      </div>
      <div className="panel-footnote">
        <Icon name="info" size={16} />
        <span>Changing a quote keeps the app’s delivery, spending and permission checks in force.</span>
      </div>
    </section>
  );
}

function ConfirmationForm({ draft, editConfirmation }) {
  const record = draft.confirmation;
  const edit = field => value => editConfirmation(field, value);

  return (
    <section className="panel record-panel" aria-labelledby="confirmation-heading">
      <div className="panel-content">
        <SectionHeading id="confirmation-heading" number="2" title="Consolidation confirmation" />
        <p className="section-description">
          Record what the slot confirmation actually covers. An earlier order revision stays an earlier revision.
        </p>
        <fieldset>
          <legend className="sr-only">Consolidation confirmation record</legend>
          <div className="form-grid">
            <Select label="Confirmation status" value={record.status} onChange={edit('status')}>
              <option value={SLOT_CONFIRMATION_STATUS.NONE}>No confirmation</option>
              <option value={SLOT_CONFIRMATION_STATUS.CONFIRMED}>Confirmed</option>
              <option value={SLOT_CONFIRMATION_STATUS.CANCELLED}>Cancelled</option>
              <option value={SLOT_CONFIRMATION_STATUS.CONFLICTING}>Conflicting records</option>
            </Select>
            <Field
              label="Confirmation reference"
              value={record.slotReference}
              onChange={edit('slotReference')}
              placeholder="For example, SLOT-C104"
            />
          </div>
          <details className="record-details" open>
            <summary>Order and location covered by this record</summary>
            <div className="form-grid scope-fields">
              <Field label="Confirmation order" value={record.orderId} readOnly />
              <Field
                label="Confirmation order revision"
                value={record.orderRevision}
                onChange={edit('orderRevision')}
              />
              <Field
                label="Confirmation ship point"
                value={record.shipPoint}
                onChange={edit('shipPoint')}
              />
              <Field
                label="Confirmation destination"
                value={record.recipient}
                onChange={edit('recipient')}
              />
              <Field
                label="Confirmation ship date"
                type="date"
                value={record.shipDate}
                onChange={edit('shipDate')}
              />
              <Field label="Confirmation profile version" value={record.profileVersion} readOnly />
            </div>
          </details>
          <details className="record-details">
            <summary>Confirmation and validity times</summary>
            <div className="form-grid scope-fields">
              <Field
                label="Confirmed at"
                type="datetime-local"
                value={record.confirmedAt}
                onChange={edit('confirmedAt')}
              />
              <Field
                label="Known at"
                type="datetime-local"
                value={record.knownAt}
                onChange={edit('knownAt')}
              />
              <Field
                label="Valid from"
                type="datetime-local"
                value={record.validFrom}
                onChange={edit('validFrom')}
              />
              <Field
                label="Valid until"
                type="datetime-local"
                value={record.validUntil}
                onChange={edit('validUntil')}
              />
            </div>
          </details>
        </fieldset>
      </div>
      <div className="panel-footnote">
        <Icon name="clock" size={16} />
        <span>Times use the worked case’s fixed UTC−06:00 zone.</span>
      </div>
    </section>
  );
}

function Results({ desk }) {
  const { status, current, before, config } = desk;
  const complete = status === REVIEW_STATE.COMPLETE && current?.available;
  const running = status === REVIEW_STATE.RUNNING;
  const dirty = status === REVIEW_STATE.DIRTY;
  const earlierRun = complete ? desk.previousRun : desk.run;
  const stateLabel = running ? 'Calculating' : dirty ? 'Needs reassessment'
    : complete ? 'Current result' : 'Not yet reviewed';
  const heading = running ? 'Checking the complete arrangements…'
    : dirty ? 'Records changed. Review again.'
      : status === REVIEW_STATE.UNAVAILABLE ? 'A complete result is unavailable.'
        : status === REVIEW_STATE.INVALID ? 'Correct the input before reviewing.' : 'Review the current shipment.';

  // The team owns these controls and forms. The public view selects the useful
  // findings from the native SDK report; no second comparison is assembled here.
  return (
    <section className="panel results-panel" aria-labelledby="review-heading">
      <div className="panel-content">
        <SectionHeading id="review-heading" eyebrow="Decision support" title="Arrangement review">
          <span className={`review-state ${complete ? 'review-state-complete' : ''}`}>{stateLabel}</span>
        </SectionHeading>
        <Issues issues={desk.issues} />
        <div className="review-actions">
          <button className="button button-primary" onClick={desk.evaluate}
            disabled={running || status === REVIEW_STATE.LOADING || !desk.draft}>
            <Icon name="arrow" />{running ? 'Reviewing arrangements…' : 'Review arrangements'}
          </button>
          {running && <button className="button button-secondary" onClick={desk.cancel}>Cancel review</button>}
        </div>
        {!complete && <div className="recommendation recommendation-pending" aria-live="polite">
          <h3>{heading}</h3>
          <p>{dirty ? 'The earlier calculation remains available below. It does not describe these edited records.'
            : 'Review the current quote, shipment records and confirmation together.'}</p>
        </div>}
      </div>
      {complete && <DecisionView report={desk.run.report} profile={config.decisionPresentation} />}
      {before && earlierRun && <details className="previous-review">
        <summary>Last calculated proposal</summary>
        <p>Earlier evaluated inputs, retained for comparison.</p>
        <DecisionView report={earlierRun.report} profile={config.decisionPresentation} stale />
      </details>}
      <div className="result-boundary"><Icon name="info" size={17} /><p>
        This review proposes an arrangement. It does not reserve freight, obtain
        approval or establish that the shipment was completed.
      </p></div>
    </section>
  );
}

export default function App() {
  const desk = useShipmentReview();
  const fileInput = useRef(null);
  const [importError, setImportError] = useState(null);
  const loading = desk.status === REVIEW_STATE.LOADING;
  const canDownload = desk.status === REVIEW_STATE.COMPLETE && desk.current?.available && desk.run;

  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportError(null);

    try {
      await desk.importCaseText(await file.text());
    } catch (error) {
      setImportError(error.message ?? 'The case could not be imported.');
    }
  }

  return (
    <div className="desk-app">
      <a className="skip-link" href="#main">Skip to shipment review</a>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-mark"><Icon name="truck" size={22} /></div>
          <div className="brand-name">
            Shipment Reservation Desk
            <span>Team application · Powered by Decision Lab SDK</span>
          </div>
          <span className="demo-badge">Fictional worked example</span>
        </div>
      </header>
      <main id="main" className="page-shell">
        <div className="page-intro">
          <div>
            <p className="eyebrow">A focused logistics workspace</p>
            <h1>
              Choose the arrangement.<br className="mobile-break" /> Keep the evidence in view.
            </h1>
            <p>
              Review one shipment’s quotes and confirmation before putting an
              arrangement forward for reservation.
            </p>
          </div>
          <div className="top-actions">
            <button
              className="button button-secondary"
              onClick={() => fileInput.current.click()}
              disabled={loading}
            >
              <Icon name="upload" />Import case
            </button>
            <button
              className="button button-secondary"
              onClick={desk.downloadRun}
              disabled={!canDownload}
            >
              <Icon name="download" />Download SDK run
            </button>
            <input
              ref={fileInput}
              type="file"
              className="sr-only"
              accept=".json,application/json"
              aria-label="Import canonical case JSON"
              onChange={importFile}
            />
          </div>
        </div>
        <section className="sample-section" aria-labelledby="sample-heading">
          <div className="sample-heading">
            <h2 id="sample-heading">Try a worked case</h2>
            <span>Same app rules. Different records.</span>
          </div>
          <div className="sample-cards">
            {desk.cases.map((item, index) => (
              <button
                type="button"
                className={`sample-card ${item.id === desk.selectedCaseId ? 'sample-selected' : ''}`}
                key={item.id}
                aria-pressed={item.id === desk.selectedCaseId}
                disabled={loading}
                onClick={() => {
                  setImportError(null);
                  desk.selectCase(item.id);
                }}
              >
                <span className="sample-index">0{index + 1}</span>
                <span>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </span>
                {item.id === desk.selectedCaseId && <Icon name="check" size={17} />}
              </button>
            ))}
          </div>
        </section>
        <Issues error={importError} issues={!desk.caseData ? desk.issues : []} />
        {loading ? (
          <div className="loading-state" role="status">Loading the pinned shipment app…</div>
        ) : desk.caseData && desk.draft ? (
          <>
            <ShipmentBasis caseData={desk.caseData} config={desk.config} />
            <div className="desk-layout">
              <div className="input-column">
                <QuoteForm
                  key={desk.selectedCaseId}
                  draft={desk.draft}
                  editQuote={desk.editQuote}
                  config={desk.config}
                />
                <ConfirmationForm draft={desk.draft} editConfirmation={desk.editConfirmation} />
                <div className="input-footer">
                  <button
                    className="text-button"
                    onClick={desk.downloadCase}
                    disabled={desk.status === REVIEW_STATE.RUNNING}
                  >
                    <Icon name="download" size={16} />Download case inputs
                  </button>
                  <span>
                    Complete resources and permission records remain in the imported
                    case. “As of” is the recorded review time; import a fresh case to advance it.
                  </span>
                </div>
              </div>
              <Results desk={desk} />
            </div>
          </>
        ) : (
          <div className="loading-state">
            {desk.issues.length
              ? 'Correct the issue above and try again.'
              : 'Select or import a shipment case to start.'}
          </div>
        )}
        <footer className="page-footer">
          <span>One shipment · Independent arrangement review</span>
          <span>Fictional data. No freight is booked.</span>
        </footer>
      </main>
    </div>
  );
}
