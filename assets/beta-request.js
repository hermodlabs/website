const betaForm = document.querySelector('#beta-request-form');

// Forminit allows credential-free cross-origin requests, including file://
// previews. Native POST remains the fallback when JavaScript is unavailable.
if (betaForm && window.fetch) {
  const button = betaForm.querySelector('button[type="submit"]');
  const fields = betaForm.querySelector('fieldset');
  const status = document.querySelector('#beta-request-status');
  const originalLabel = button.innerHTML;
  const homeUrl = new URL(betaForm.dataset.successUrl, window.location.href);
  let pending = false;
  let submitted = window.history.state?.betaAccessSubmitted === true;

  const markSubmitted = (value) => {
    submitted = value;
    try {
      // Associate the reset with this history entry, without storing form data.
      window.history.replaceState({ ...window.history.state, betaAccessSubmitted: value }, '');
    } catch {
      // The in-memory flag still handles a restored page if history is restricted.
    }
  };

  const clearForm = () => {
    betaForm.reset();
    for (const field of fields.querySelectorAll('input, textarea')) field.value = '';
    pending = false;
    button.disabled = false;
    fields.disabled = false;
    button.innerHTML = originalLabel;
    betaForm.removeAttribute('aria-busy');
    status.textContent = '';
    delete status.dataset.state;
  };

  window.addEventListener('pageshow', () => {
    if (submitted || window.history.state?.betaAccessSubmitted === true) {
      clearForm();
      // Browsers can restore saved input values after pageshow on Back/Forward.
      window.setTimeout(() => {
        if (submitted || window.history.state?.betaAccessSubmitted === true) clearForm();
      }, 0);
    }
  });

  betaForm.addEventListener('input', () => {
    // Preserve a new, unfinished request if the visitor navigates away and back.
    if (submitted || window.history.state?.betaAccessSubmitted === true) markSubmitted(false);
  });

  betaForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending || !betaForm.reportValidity()) return;

    const data = new FormData(betaForm);
    pending = true;
    button.disabled = true;
    fields.disabled = true;
    button.textContent = 'Sending request…';
    betaForm.setAttribute('aria-busy', 'true');
    status.dataset.state = 'pending';
    status.textContent = 'Sending your beta access request…';

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(betaForm.action, {
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
          : 'Your request could not be accepted. Please check your details and try again, or contact us below.';
      } else {
        markSubmitted(true);
        clearForm();
        window.location.assign(homeUrl.href);
      }
    } catch {
      status.dataset.state = 'error';
      status.textContent = 'We couldn’t confirm your request. Your details are still here. Check your connection before trying again, or contact us below.';
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      button.disabled = false;
      fields.disabled = false;
      button.innerHTML = originalLabel;
      betaForm.removeAttribute('aria-busy');
      if (!submitted) status.focus({ preventScroll: true });
    }
  });
}
