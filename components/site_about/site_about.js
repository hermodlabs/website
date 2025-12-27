// /components/site-about.js
// Usage: <site-about></site-about>
//
// - Everything is hardcoded (no attributes, no escaping, no styles).
// - Light DOM so your global CSS applies.

class SiteAbout extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<section class="about" aria-labelledby="about-title">
  <div class="about__inner">
    <h2 class="about__title" id="about-title">
      <span class="about__kicker">About</span>
      <span class="about__headline">HermodLabs</span>
    </h2>

    <div class="about__grid">
      <!-- Column 1: Problem / Agitate / Solution (prominent + scannable) -->
      <div class="about__left" aria-label="Problem agitate solution">
        <p class="about__statement about__statement--q">
          Getting inconsistent results from sensors that should match?
        </p>

        <p class="about__statement about__statement--a">
          You adjust knobs and hope… until drift proves you wrong.
        </p>

        <p class="about__statement about__statement--s">
          HermodLabs separates signal from drift… before it’s too late.
        </p>
      </div>

      <!-- Column 2: Product bullets -->
      <div class="about__right">
        <h3 class="about__subtitle">Our main product: the Co-Timing Engine</h3>

        <div class="about__bullets" role="list">
          <p class="about__text" role="listitem">
            <span class="about__bullet" aria-hidden="true">—</span>
            A reusable timing platform.
          </p>
          <p class="about__text" role="listitem">
            <span class="about__bullet" aria-hidden="true">—</span>
            Same core logic across benches and sites.
          </p>
          <p class="about__text" role="listitem">
            <span class="about__bullet" aria-hidden="true">—</span>
            Faster deployments without redoing timing work.
          </p>
        </div>

        <a class="link link--primary about__link" href="/co-timing-engine">
          Read about the co-timing engine
        </a>
      </div>
    </div>
  </div>
</section>
    `;
  }
}

customElements.define("site-about", SiteAbout);
