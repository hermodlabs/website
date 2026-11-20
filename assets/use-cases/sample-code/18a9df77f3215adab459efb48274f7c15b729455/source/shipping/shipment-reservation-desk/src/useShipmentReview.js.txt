import { useEffect, useMemo, useRef, useState } from 'react';
import { createDecisionLab, WORKFLOW_ANSWER_STATUS, WORKFLOW_RUN_FORMAT } from '@decision-lab/sdk';
import { createBrowserExecutor } from '@decision-lab/sdk/browser';
import { buildCase, replaceSupportingRecord, summarizeRun, toDraft, cents, minuteFromLocal } from './shipment.js';
import { REVIEW_STATE } from './semantics.js';
import { createReviewJourney, openReviewJourney, updateReviewInputs, reviewJourneyInputs,
  evaluateReviewJourney, acceptReviewFinding, recordJourneyDecision, recordJourneyOperation,
  inspectReviewJourney, saveReviewJourney, JOURNEY_OPERATION } from './reviewJourney.js';

const configURL = new URL(`${import.meta.env.BASE_URL}data/config.json`, document.baseURI);
async function readJSON(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Could not load ${url.pathname}: HTTP ${response.status}.`);
  return response.json();
}
const explain = error => error.issues?.length ? error.issues : [{ message: error.message }];
function download(filename, value, lab) {
  const source = lab.sources.renderJSON(value, { maxBytes: 50000000 });
  const url = URL.createObjectURL(new Blob([source], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Ordinary React state around a portable SDK workflow. Import never accepts
 * records, evaluation never grants permission, and a booking never proves delivery. */
export default function useShipmentReview() {
  const [config, setConfig] = useState(null), [app, setApp] = useState(null);
  const [definition, setDefinition] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [caseData, setCaseData] = useState(null), [draft, setDraft] = useState(null);
  const [journey, setJourney] = useState(null), [issues, setIssues] = useState([]);
  const [reviewer, setReviewer] = useState('');
  const [status, setStatus] = useState(REVIEW_STATE.LOADING);
  const labRef = useRef(null), activeRequest = useRef(null), requestId = useRef(0), savedHash = useRef(null);

  useEffect(() => {
    const executor = createBrowserExecutor(), lab = createDecisionLab({ executor });
    const controller = new AbortController(), token = ++requestId.current;
    labRef.current = lab; activeRequest.current = controller;
    async function load() {
      try {
        const settings = await readJSON(configURL, controller.signal);
        const opened = lab.apps.open(await readJSON(new URL(settings.appUrl, configURL), controller.signal));
        const workflow = lab.workflows.open(await readJSON(new URL(settings.workflowUrl, configURL), controller.signal));
        if (workflow.contentHash !== settings.workflowHash) throw new Error('The operating workflow does not match its configured version.');
        const binding = lab.cases.create({ app: opened }).binding;
        for (const [key, value] of Object.entries(settings.binding)) if (binding[key] !== value) throw new Error(`The app does not match the configured ${key}.`);
        const entry = settings.cases[0], inputs = await readJSON(new URL(entry.url, configURL), controller.signal);
        const next = createReviewJourney({ lab, app: opened, definition: workflow, inputs, owner: settings.owner.name });
        const form = toDraft(inputs, settings);
        if (token !== requestId.current) return;
        setConfig(settings); setApp(opened); setDefinition(workflow); setCaseData(inputs); setDraft(form); setJourney(next);
        setReviewer(settings.owner.name);
        setSelectedCaseId(entry.id); setStatus(REVIEW_STATE.READY);
      } catch (error) { if (token === requestId.current) { setIssues(explain(error)); setStatus(REVIEW_STATE.INVALID); } }
    }
    void load();
    return () => { requestId.current++; activeRequest.current?.abort(); labRef.current = null; void executor.close(); };
  }, []);

  function interrupt() { requestId.current++; activeRequest.current?.abort(); activeRequest.current = null; return requestId.current; }
  function installJourney(next, id = '') {
    const inputs = next.case.inputs;
    const validation = labRef.current.cases.validate({ app, case: inputs });
    if (!validation.valid) throw Object.assign(new Error('The case has invalid inputs.'), { issues: validation.issues });
    setCaseData(inputs); setDraft(toDraft(inputs, config)); setJourney(next); setSelectedCaseId(id);
    setReviewer(next.case.journeyContext.owner);
    const view = inspectReviewJourney({ lab: labRef.current, run: next });
    setStatus(view.currentRun ? REVIEW_STATE.COMPLETE : REVIEW_STATE.READY); setIssues([]); savedHash.current = null;
  }
  function installCase(value, id) {
    const lab = labRef.current;
    const snapshot = lab.cases.create({ app, inputs: value });
    installJourney(createReviewJourney({ lab, app, definition, inputs: snapshot.inputs, owner: config.owner.name }), id);
  }
  async function selectCase(id) {
    const token = interrupt(), controller = new AbortController(); activeRequest.current = controller;
    setStatus(REVIEW_STATE.LOADING); setIssues([]);
    try {
      const entry = config.cases.find(item => item.id === id);
      const inputs = await readJSON(new URL(entry.url, configURL), controller.signal);
      if (token === requestId.current) installCase(inputs, id);
    } catch (error) { if (token === requestId.current) { setIssues(explain(error)); setStatus(REVIEW_STATE.INVALID); } }
  }
  function edited() { interrupt(); setStatus(REVIEW_STATE.DIRTY); setIssues([]); }
  const editQuote = (id, field, value) => { edited(); setDraft(form => ({ ...form, quotes: form.quotes.map(row => row.id === id ? { ...row, [field]: value } : row) })); };
  const editConfirmation = (field, value) => { edited(); setDraft(form => ({ ...form, confirmation: { ...form.confirmation, [field]: value } })); };
  const editAsOf = value => { edited(); setDraft(form => ({ ...form, asOf: value })); };
  function perform(operation) {
    try {
      const next = operation(labRef.current);
      interrupt(); // A later worker response must not replace a newly recorded event.
      setJourney(next); setIssues([]);
      if (status === REVIEW_STATE.RUNNING) setStatus(inspectReviewJourney({ lab: labRef.current, run: next }).currentRun ? REVIEW_STATE.COMPLETE : REVIEW_STATE.READY);
      return next;
    }
    catch (error) { setIssues(explain(error)); return null; }
  }
  function flushDraft(lab = labRef.current) {
    const inputs = buildCase(caseData, draft, config);
    const validation = lab.cases.validate({ app, case: inputs });
    if (!validation.valid) throw Object.assign(new Error('Correct the current input records before saving.'), { issues: validation.issues });
    const next = updateReviewInputs({ lab, run: journey, inputs });
    setJourney(next); setCaseData(inputs);
    if (next.contentHash !== journey.contentHash) setStatus(REVIEW_STATE.DIRTY);
    return next;
  }
  function reviewInputs() {
    const next = perform(lab => {
      const updated = flushDraft(lab);
      return reviewJourneyInputs({ lab, run: updated, actor: reviewer });
    });
    if (next) { setCaseData(next.case.inputs); setStatus(REVIEW_STATE.READY); }
  }
  function addSupportingRecord(record) {
    const next = perform(lab => {
      const inputs = replaceSupportingRecord(buildCase(caseData, draft, config), record, config);
      return updateReviewInputs({ lab, run: journey, inputs });
    });
    if (next) { setCaseData(next.case.inputs); setDraft(toDraft(next.case.inputs, config)); setStatus(REVIEW_STATE.DIRTY); }
  }
  async function evaluate() {
    const token = interrupt(), controller = new AbortController(); activeRequest.current = controller;
    setStatus(REVIEW_STATE.RUNNING); setIssues([]);
    try {
      const next = await evaluateReviewJourney({ lab: labRef.current, run: journey,
        execution: { signal: controller.signal, timeoutMs: 15000 } });
      if (token !== requestId.current) return;
      setJourney(next);
      const view = inspectReviewJourney({ lab: labRef.current, run: next });
      const summary = view.currentRun && summarizeRun(view.currentRun, config);
      if (!summary?.available) { setIssues((summary?.issues ?? ['A complete current assessment is unavailable.']).map(message => ({ message }))); setStatus(REVIEW_STATE.UNAVAILABLE); return; }
      setStatus(REVIEW_STATE.COMPLETE);
    } catch (error) { if (token === requestId.current) { setIssues(explain(error)); setStatus(REVIEW_STATE.UNAVAILABLE); } }
  }
  function importCaseText(text) {
    interrupt(); setIssues([]);
    try {
      const value = labRef.current.sources.parseArtifact(text);
      if (value.format === WORKFLOW_RUN_FORMAT) installJourney(openReviewJourney({ lab: labRef.current, value, app, definition }));
      else installCase(value, '');
    } catch (error) { setIssues(explain(error)); setStatus(REVIEW_STATE.INVALID); }
  }
  const inspection = useMemo(() => journey && labRef.current && inspectReviewJourney({ lab: labRef.current, run: journey }), [journey]);
  const run = inspection?.currentRun ?? null;
  const previousRun = (run ? inspection?.previousRun : inspection?.latestRun ?? inspection?.previousRun) ?? null;
  const current = status === REVIEW_STATE.COMPLETE && run ? summarizeRun(run, config) : null;
  const earlierRun = previousRun ?? inspection?.latestRun;
  const before = earlierRun ? summarizeRun(earlierRun, config) : null;
  const findingChanges = current && earlierRun ? labRef.current.reports.compareFindings({ before: earlierRun, after: run }) : null;
  const inputsNeedReview = status === REVIEW_STATE.DIRTY || journey?.answers.inputs.status === WORKFLOW_ANSWER_STATUS.AWAITING_REVIEW;
  const requireCurrent = () => { if (status !== REVIEW_STATE.COMPLETE) throw new Error('Review current records and reassess before recording an operating response.'); };
  const key = () => `shipment-review:${config.binding.packageHash}:${caseData.id}`;
  return {
    config, cases: config?.cases ?? [], selectedCaseId, caseData, draft, status, issues, journey, reviewer, setReviewer,
    run, previousRun, current, before, inputsNeedReview, findingChanges,
    inspection: inspection && { ...inspection, ...(status === REVIEW_STATE.DIRTY ? { decision: null, staleDecision: inspection.decision ?? inspection.staleDecision } : {}) },
    selectCase, editQuote, editConfirmation, editAsOf, evaluate, importCaseText, reviewInputs, addSupportingRecord,
    cancel() { interrupt(); setStatus(REVIEW_STATE.DIRTY); setIssues([{ message: 'Review cancelled. Reassess before using a recommendation.' }]); },
    acceptFinding(actor) { perform(lab => { requireCurrent(); return acceptReviewFinding({ lab, run: journey, actor }); }); },
    recordDecision(optionId, actor) { perform(lab => { requireCurrent(); return recordJourneyDecision({ lab, run: journey, optionId, actor }); }); },
    recordOperation(kind, record, actor) { perform(lab => {
      if (kind !== JOURNEY_OPERATION.ESCALATION) {
        requireCurrent();
        if (record.orderId !== caseData.parameters.orderId || record.orderRevision !== caseData.parameters.orderRevision
          || record.arrangement !== inspection?.decision?.choices?.arrangement) throw new Error('The operating record must cover the current order revision and recorded response. Preserve its actual scope; do not relabel an old document.');
      }
      const supplied = { ...record };
      if (!record.source?.trim()) throw new Error('Name the source of the actual operating record.');
      if ([JOURNEY_OPERATION.AUTHORIZATION, JOURNEY_OPERATION.RESERVATION, JOURNEY_OPERATION.DELIVERY].includes(kind) && !['true','false'].includes(record.result)) throw new Error('Record what the actual document says about its result.');
      if (kind === JOURNEY_OPERATION.AUTHORIZATION) { supplied.amountMinor = cents(record.amount); supplied.authorizedAtMinute = minuteFromLocal(record.authorizedAt, config); supplied.authorized = record.result === 'true';
        supplied.validFromMinute = minuteFromLocal(record.validFrom, config); supplied.validUntilMinute = minuteFromLocal(record.validUntil, config); }
      if (kind === JOURNEY_OPERATION.RESERVATION) { supplied.reservedAtMinute = minuteFromLocal(record.reservedAt, config); supplied.confirmed = record.result === 'true'; }
      if (kind === JOURNEY_OPERATION.DELIVERY) { supplied.deliveredAtMinute = minuteFromLocal(record.deliveredAt, config); supplied.receivedAccepted = record.result === 'true';
        if (!/^[1-9]\d*$/.test(record.quantity)) throw new Error('Enter the actual complete received quantity.'); supplied.quantity = Number(record.quantity); }
      return recordJourneyOperation({ lab, run: journey, kind, record: supplied, actor });
    }); },
    downloadCase() { try { download(`${caseData.id}-case.json`, buildCase(caseData, draft, config), labRef.current); } catch (error) { setIssues(explain(error)); } },
    downloadRun() { if (current) download(`${caseData.id}-run.json`, run, labRef.current); },
    downloadJourney() { try { const next = flushDraft(); download(`${caseData.id}-review.json`, next, labRef.current); } catch (error) { setIssues(explain(error)); } },
    saveJourney() { try { const next = flushDraft(); savedHash.current = saveReviewJourney({ lab: labRef.current, run: next, storage: localStorage, key: key(), expectedHash: savedHash.current }); setIssues([{ message: 'Review saved locally with its history and app version.' }]); } catch (error) { setIssues(explain(error)); } },
    restoreJourney() { interrupt(); try { const text = localStorage.getItem(key()); if (!text) throw new Error('No saved review exists for this case.'); const next = openReviewJourney({ lab: labRef.current, value: text, app, definition }); installJourney(next); savedHash.current = next.contentHash; } catch (error) { setIssues(explain(error)); setStatus(REVIEW_STATE.DIRTY); } },
  };
}
