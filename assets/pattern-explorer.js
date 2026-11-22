// Progressive enhancement for retained comparisons; no business assessment runs here.
(() => {
  'use strict';
  for (const exercise of document.querySelectorAll('[data-pattern-exercise]')) {
    const controls = exercise.querySelector('[data-pattern-controls]');
    const fallback = exercise.querySelector('[data-pattern-fallback]');
    const result = exercise.querySelector('[data-pattern-result]');
    const reveal = exercise.querySelector('[data-pattern-reveal]');
    const reset = exercise.querySelector('[data-pattern-reset]');
    const message = exercise.querySelector('[data-pattern-message]');
    const fieldset = exercise.querySelector('fieldset');
    if (!controls || !fallback || !result || !reveal || !reset || !message || !fieldset) continue;
    controls.hidden = false;
    fallback.hidden = true;
    const hideAnswer = () => {
      result.hidden = true;
      reset.hidden = true;
      reveal.hidden = false;
      reveal.setAttribute('aria-expanded', 'false');
      message.textContent = '';
    };
    fieldset.addEventListener('change', hideAnswer);
    reveal.addEventListener('click', () => {
      const selected = fieldset.querySelector('input:checked');
      if (!selected) {
        message.textContent = 'Choose a prediction before revealing the comparison.';
        fieldset.querySelector('input')?.focus();
        return;
      }
      result.hidden = false;
      reset.hidden = false;
      reveal.setAttribute('aria-expanded', 'true');
      message.textContent = selected.dataset.correct === 'true'
        ? 'Your prediction matches the retained finding. Compare the explanation with your reasoning below.'
        : 'The retained finding differs from your prediction. Compare the explanation with your reasoning below.';
      // Keep keyboard focus on the trigger; the answer follows it in document order.
    });
    reset.addEventListener('click', () => {
      for (const input of fieldset.querySelectorAll('input')) input.checked = false;
      hideAnswer();
      fieldset.querySelector('input')?.focus();
    });
  }
})();
