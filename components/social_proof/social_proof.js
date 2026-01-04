// /components/social-proof.js
// Usage: <social-proof></social-proof>
//
// - Everything is hardcoded (no attributes, no escaping, no styles).
// - Light DOM so your global CSS applies.

class SocialProof extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="social-proof" aria-labelledby="social-proof-title">
        <div class="social-proof__inner">
          <h2 class="social-proof__title" id="social-proof-title">
            <span class="social-proof__kicker">Pilot</span>
            <span class="social-proof__headline">Real-Time Humidity Recon</span>
          </h2>

          <p class="social-proof__text">
            We are building a <span class="social-proof__em">3D humidity gradient modeler</span> to map microclimates in real time,
            so cigar placement and storage decisions stay optimal as the room drifts.
          </p>

          <a class="link link--primary social-proof__link" href="/explore/blog/content/2025_12_26_cigar_district">
            Read about the pilot
          </a>
        </div>
      </section>
    `;
  }
}

customElements.define("social-proof", SocialProof);
