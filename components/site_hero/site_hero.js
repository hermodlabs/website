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
      <span>Unaligned sensors cost you either money or performance</span>
      <span>Early adopters gain an advantage</span>
    </h1>

    <div class="hero__subheadBlock">
      <p class="hero__subhead">
        Our 3D humidity-gradient modeling turns “room average” into actionable zones.
      </p>

      <ul class="hero__bullets">
        <li>Find hotspots and airflow dead zones</li>
        <li>Stabilize outcomes across runs</li>
        <li>Reduce late-stage surprises</li>
      </ul>
    </div>

    <p class="hero__lead">
      We verify your signals are comparable before you trust the result.
    </p>

    <p class="hero__note">
      <strong>Early partners lock in pricing.</strong><br />
      Secure your vertical early to keep your options open.
    </p>

    <div class="hero__cta-row">
      <a class="button button--primary" href="/promo/exclusion">Get Priority Access</a>
      <a class="button button--secondary" href="/asset/file/operator_playbook_v_1_0_0.pdf">Read the Whitepaper</a>
    </div>
  </div>
</section>
    `;
  }
}

customElements.define("site-hero", SiteHero);
