// /components/job_apply_form/job_apply_form.js
// Usage: <job-apply-form></job-apply-form>
//
// Hardcoded defaults (matches your snippet) but configurable via attributes:
// - action="/careers/apply/finance-legal-fractional"
// - message-placeholder="..."
//
// No styles. Light DOM so your global CSS applies.

class JobApplyForm extends HTMLElement {
  connectedCallback() {
    const action = this.getAttribute("action") || "/careers/apply/finance-legal-fractional";
    const placeholder =
      this.getAttribute("message-placeholder") ||
      "A few sentences about your background, availability, and whether you cover finance, legal, or both.";

    this.innerHTML = `
      <section class="job__section job__section--apply" aria-labelledby="apply-title">
        <h2 class="job__heading" id="apply-title">Apply</h2>
        <p class="job__text">Send a short note and your resume.</p>

        <form
          class="job__form"
          action="${action}"
          method="post"
          enctype="multipart/form-data"
        >
          <div class="job__field">
            <label class="job__label" for="app-name">Name</label>
            <input class="job__input" id="app-name" name="name" type="text" autocomplete="name" required />
          </div>

          <div class="job__field">
            <label class="job__label" for="app-email">Email</label>
            <input class="job__input" id="app-email" name="email" type="email" autocomplete="email" required />
          </div>

          <div class="job__field">
            <label class="job__label" for="app-message">Message</label>
            <textarea
              class="job__textarea"
              id="app-message"
              name="message"
              rows="7"
              placeholder="${placeholder}"
              required
            ></textarea>
          </div>

          <div class="job__field">
            <label class="job__label" for="app-resume">Resume</label>
            <input class="job__input" id="app-resume" name="resume" type="file" accept=".pdf,.doc,.docx" required />
          </div>

          <div class="job__actions">
            <button class="button button--primary" type="submit">Submit</button>
            <a class="button button--secondary" href="/careers">Back to roles</a>
          </div>

          <p class="job__fineprint">We only use this to respond to your application. No spam.</p>
        </form>
      </section>
    `;
  }
}

customElements.define("job-apply-form", JobApplyForm);
