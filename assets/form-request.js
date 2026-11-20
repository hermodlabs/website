// Forminit allows credential-free cross-origin requests, including file://
// previews. Native POST remains the fallback when JavaScript is unavailable.
document.querySelectorAll('form[data-forminit-request]').forEach((form) => {
  if (!window.fetch) return;
  const button = form.querySelector('button[type="submit"]');
  const fields = form.querySelector('fieldset');
  const status = form.querySelector('[role="status"]');
  const originalLabel = button.innerHTML;
  const homeUrl = form.dataset.successUrl
    ? new URL(form.dataset.successUrl, window.location.href)
    : null;
  let pending = false;
  const hasSubmitted = () => {
    const saved = window.history.state?.forminitSubmitted;
    // Accept the single-form marker used by older history entries as well.
    return saved === form.id || saved?.[form.id] === true;
  };
  let submitted = hasSubmitted();

  const markSubmitted = (value) => {
    submitted = value;
    try {
      // Track each form separately, without storing names, email, or messages.
      const saved = window.history.state?.forminitSubmitted;
      const markers = typeof saved === 'string'
        ? { [saved]: true }
        : { ...saved };
      if (value) markers[form.id] = true;
      else delete markers[form.id];
      window.history.replaceState({ ...window.history.state, forminitSubmitted: markers }, '');
    } catch {
      // The in-memory flag still handles a restored page if history is restricted.
    }
  };

  const clearForm = () => {
    form.reset();
    for (const field of fields.querySelectorAll('input:not([type="hidden"]), textarea')) field.value = '';
    pending = false;
    button.disabled = false;
    fields.disabled = false;
    button.innerHTML = originalLabel;
    form.removeAttribute('aria-busy');
    status.textContent = '';
    delete status.dataset.state;
  };

  window.addEventListener('pageshow', () => {
    if (submitted || hasSubmitted()) {
      clearForm();
      // Browsers can restore saved input values after pageshow on Back/Forward.
      window.setTimeout(() => {
        if (submitted || hasSubmitted()) clearForm();
      }, 0);
    }
  });

  form.addEventListener('input', () => {
    // Preserve a new, unfinished request if the visitor navigates away and back.
    if (submitted || hasSubmitted()) markSubmitted(false);
    if (status.dataset.state === 'success') {
      status.textContent = '';
      delete status.dataset.state;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;

    const data = new FormData(form);
    pending = true;
    button.disabled = true;
    fields.disabled = true;
    button.textContent = 'Sending request…';
    form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'pending';
    status.textContent = form.dataset.pendingMessage || 'Sending your request…';

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
        body: data,
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        status.dataset.state = 'error';
        status.textContent = response.status === 429
          ? 'Please wait a moment before trying again. Your details are still here.'
          : 'Your message could not be accepted. Your details are still here. Please check them and try again.';
      } else {
        markSubmitted(true);
        clearForm();
        if (homeUrl) window.location.assign(homeUrl.href);
        else {
          status.dataset.state = 'success';
          status.textContent = form.dataset.successMessage || 'Thanks, your message has been sent.';
        }
      }
    } catch {
      status.dataset.state = 'error';
      status.textContent = 'We couldn’t confirm your message. Your details are still here. Check your connection before trying again.';
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      button.disabled = false;
      fields.disabled = false;
      button.innerHTML = originalLabel;
      form.removeAttribute('aria-busy');
      if (!submitted || !homeUrl) status.focus({ preventScroll: true });
    }
  });
});
