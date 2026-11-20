import { useEffect, useMemo, useRef, useState } from 'react';
import { createDecisionLab } from '@decision-lab/sdk';
import { createBrowserExecutor } from '@decision-lab/sdk/browser';
import { buildCase, readTimingPolicy, summarizeRun, toDraft } from './gifting.js';
import { REVIEW_STATE } from './reviewState.js';

const configURL = new URL(`${import.meta.env.BASE_URL}data/config.json`, document.baseURI);

async function readJSON(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Could not load ${url.pathname}: HTTP ${response.status}.`);
  return response.json();
}

function explain(error) {
  return error.issues?.length ? error.issues : [{ message: error.message }];
}

function download(filename, artifact, lab) {
  const content = lab.sources.renderJSON(artifact, { maxBytes: 50000000 });
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function useGiftReview() {
  const [config, setConfig] = useState(null);
  const [app, setApp] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState(REVIEW_STATE.LOADING);
  const [issues, setIssues] = useState([]);
  const [run, setRun] = useState(null);
  const [previousRun, setPreviousRun] = useState(null);
  const labRef = useRef(null);
  const activeRequest = useRef(null);
  const requestId = useRef(0);

  // The effect owns its worker. StrictMode can close this instance and create
  // another; a closed worker is never kept in a module-level singleton.
  useEffect(() => {
    const executor = createBrowserExecutor();
    const lab = createDecisionLab({ executor });
    const controller = new AbortController();
    const token = ++requestId.current;
    labRef.current = lab;
    activeRequest.current = controller;

    async function load() {
      try {
        const settings = await readJSON(configURL, controller.signal);
        const opened = lab.apps.open(await readJSON(new URL(settings.appUrl, configURL), controller.signal));
        const timingPolicy = readTimingPolicy(opened);
        const binding = lab.cases.create({ app: opened }).binding;
        for (const [key, value] of Object.entries(settings.binding)) {
          if (binding[key] !== value) throw new Error(`The app does not match the configured ${key}.`);
        }
        if (settings.currency !== 'USD' || settings.moneyDivisor !== 100) {
          throw new Error('This form uses USD amounts stored as integer cents.');
        }
        const entry = settings.cases[0];
        const inputs = await readJSON(new URL(entry.url, configURL), controller.signal);
        const snapshot = lab.cases.create({ app: opened, inputs });
        const validation = lab.cases.validate({ app: opened, case: snapshot });
        if (!validation.valid) throw Object.assign(new Error('The initial case is invalid.'), { issues: validation.issues });
        const form = toDraft(snapshot.inputs, settings);
        if (token !== requestId.current) return;
        setConfig(settings);
        setApp(opened);
        setPolicy(timingPolicy);
        setCaseData(snapshot.inputs);
        setDraft(form);
        setSelectedCaseId(entry.id);
        setStatus(REVIEW_STATE.READY);
      } catch (error) {
        if (token === requestId.current) {
          setIssues(explain(error));
          setStatus(REVIEW_STATE.INVALID);
        }
      }
    }
    void load();

    return () => {
      requestId.current += 1;
      activeRequest.current?.abort();
      labRef.current = null;
      void executor.close();
    };
  }, []);

  function interrupt() {
    requestId.current += 1;
    activeRequest.current?.abort();
    activeRequest.current = null;
    return requestId.current;
  }

  function installCase(inputs, id) {
    const lab = labRef.current;
    const snapshot = lab.cases.create({ app, inputs });
    const validation = lab.cases.validate({ app, case: snapshot });
    if (!validation.valid) throw Object.assign(new Error('The case is invalid.'), { issues: validation.issues });
    const form = toDraft(snapshot.inputs, config);
    setCaseData(snapshot.inputs);
    setDraft(form);
    setSelectedCaseId(id);
    setRun(null);
    setPreviousRun(null);
    setStatus(REVIEW_STATE.READY);
  }

  async function selectCase(id) {
    const token = interrupt();
    const controller = new AbortController();
    activeRequest.current = controller;
    setStatus(REVIEW_STATE.LOADING);
    setIssues([]);
    try {
      const entry = config.cases.find(item => item.id === id);
      const inputs = await readJSON(new URL(entry.url, configURL), controller.signal);
      if (token === requestId.current) installCase(inputs, id);
    } catch (error) {
      if (token === requestId.current) {
        setIssues(explain(error));
        setStatus(REVIEW_STATE.INVALID);
      }
    }
  }

  function edited() {
    interrupt();
    setStatus(REVIEW_STATE.DIRTY);
    setIssues([]);
  }

  function editQuote(id, field, value) {
    edited();
    setDraft(form => ({ ...form, quotes: form.quotes.map(row => row.id === id ? { ...row, [field]: value } : row) }));
  }

  function editConfirmation(field, value) {
    edited();
    setDraft(form => ({ ...form, confirmation: { ...form.confirmation, [field]: value } }));
  }

  function editSetup(field, value) {
    edited();
    setDraft(form => ({ ...form, setup: { ...form.setup, [field]: value } }));
  }

  function editAvailability(table, index, field, value) {
    edited();
    setDraft(form => ({
      ...form,
      availability: {
        ...form.availability,
        [table]: form.availability[table].map((row, position) => position === index ? { ...row, [field]: value } : row),
      },
    }));
  }

  // The SDK, rather than React, checks all retained fault possibilities and
  // selects the preferred complete package. This is the tutorial's main path.
  async function evaluate() {
    const token = interrupt();
    const controller = new AbortController();
    activeRequest.current = controller;
    setStatus(REVIEW_STATE.RUNNING);
    setIssues([]);
    try {
      const lab = labRef.current;
      const inputs = buildCase(caseData, draft, config);
      const snapshot = lab.cases.create({ app, inputs });
      const validation = lab.cases.validate({ app, case: snapshot });
      if (!validation.valid) {
        setIssues(validation.issues);
        setStatus(REVIEW_STATE.INVALID);
        return;
      }
      const result = await lab.run({
        app,
        case: snapshot,
        execution: { signal: controller.signal, timeoutMs: 15000 },
        ...(run ? { context: { priorRun: run } } : {}),
        reportOptions: { scope: 'all', locale: 'en-US' },
      });
      // Cancellation is cooperative. A late result must not overwrite a newer
      // case or make an edited form look assessed.
      if (token !== requestId.current) return;
      const summary = summarizeRun(result, config);
      if (!summary.available) {
        setIssues(summary.issues.map(message => typeof message === 'string' ? { message } : message));
        setStatus(REVIEW_STATE.UNAVAILABLE);
        return;
      }
      setPreviousRun(run);
      setRun(result);
      setStatus(REVIEW_STATE.COMPLETE);
    } catch (error) {
      if (token === requestId.current) {
        setIssues(explain(error));
        setStatus(error.name === 'FormError' || error.issues ? REVIEW_STATE.INVALID : REVIEW_STATE.UNAVAILABLE);
      }
    }
  }

  function cancel() {
    interrupt();
    setStatus(REVIEW_STATE.DIRTY);
    setIssues([{ message: 'Review cancelled. Review the current records before using a recommendation.' }]);
  }

  function importCaseText(text) {
    interrupt();
    setIssues([]);
    setStatus(REVIEW_STATE.DIRTY);
    try {
      // Native raw inputs and pinned SDK case artifacts use the same admission
      // path. No restoration of archived runs or custom review bundles.
      installCase(labRef.current.sources.parseArtifact(text), '');
    } catch (error) {
      setIssues(explain(error));
      setStatus(REVIEW_STATE.INVALID);
    }
  }

  function downloadCase() {
    try {
      const inputs = buildCase(caseData, draft, config);
      const validation = labRef.current.cases.validate({ app, case: inputs });
      if (!validation.valid) {
        setIssues(validation.issues);
        return;
      }
      download(`${inputs.id}-case.json`, inputs, labRef.current);
    } catch (error) {
      setIssues(explain(error));
    }
  }

  const summary = useMemo(() => run && summarizeRun(run, config), [run, config]);
  const earlier = useMemo(() => previousRun && summarizeRun(previousRun, config), [previousRun, config]);

  return {
    config, policy, cases: config?.cases ?? [], selectedCaseId, caseData, draft, status, issues,
    current: status === REVIEW_STATE.COMPLETE ? summary : null,
    before: status === REVIEW_STATE.COMPLETE ? earlier : summary,
    run, previousRun,
    selectCase, editQuote, editConfirmation, editSetup, editAvailability,
    evaluate, cancel, importCaseText, downloadCase,
    downloadRun() {
      if (status === REVIEW_STATE.COMPLETE) download(`${caseData.id}-run.json`, run, labRef.current);
    },
  };
}
