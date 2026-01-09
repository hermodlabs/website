// /components/site-hero.js
import { LitElement, html } from "lit";

export class SiteHero extends LitElement {
  // If you want global CSS to keep styling it, DON'T use shadow DOM.
  // This makes Lit render into the light DOM (like your current component).
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
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
            <a class="button button--primary" href="/promo/priority_access">Get Priority Access</a>
            <a class="button button--secondary" href="/asset/file/operator_playbook_v_1_0_0.pdf">Read the Whitepaper</a>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define("site-hero", SiteHero);
