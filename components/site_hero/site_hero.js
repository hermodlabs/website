// /components/site-hero.js
// Usage: <site-hero></site-hero>
//
// - Everything is hardcoded (no attributes, no escaping, no styles).
// - Light DOM so your global CSS applies.

class SiteHero extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__inner">
          <h1 class="hero__title" id="hero-title">
            <span>Your sensors seem aligned.</span>
            <span>They aren't.</span>
            <span>We verify alignment first.</span>
            <span>Lock in your industry.</span>
          </h1>

          <p class="hero__subhead">
            Data that does not truly line up creates quiet mistakes, then loud outages.
          </p>

          <p class="hero__lead">
            We verify your signals are comparable before you trust the result.
          </p>

          <p class="hero__note">
            <strong>Industry exclusivity is available.</strong><br />
            If a competitor locks in your vertical first, you may lose access.
          </p>

          <div class="hero__cta-row">
            <a class="button button--primary" href="/explore/exclusion">Apply for Industry Exclusion</a>
            <a class="button button--secondary" href="/asset/file/operator_playbook_v_1_0_0.pdf">Read the Whitepaper</a>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define("site-hero", SiteHero);
