// /components/site-hero.js
import { LitElement, html } from "lit";

export class SiteHero extends LitElement {
  // Keep global CSS working (no shadow DOM)
  createRenderRoot() {
    return this;
  }

  static properties = {
    _active: { state: true },
    _paused: { state: true },
  };

  constructor() {
    super();

    this._active = 0;
    this._paused = false;
    this._timer = null;

    // Carousel content (your 5 articles)
    this._slides = [
      {
        img: "/asset/img/concept_art_1.png",
        alt: "CAD-style grow canopy schematic with speakers and microphones.",
        title: "Map canopy humidity in 3D.",
        text: "Find wet pockets that drive PM risk and inconsistent flower.",
      },
      {
        img: "/asset/img/concept_art_2.png",
        alt: "Exploded CAD diagram of ceiling speakers and layered microphone rings.",
        title: "Install fast between turns.",
        text: "Cover the canopy volume without rewiring your whole room.",
      },
      {
        img: "/asset/img/concept_art_3.png",
        alt: "Split infographic: average dashboard vs highlighted humidity pocket in a canopy volume.",
        title: "Averages pass. Pockets fail harvests.",
        text: "Catch canopy hotspots before late-flower cleanup and remediation.",
      },
      {
        img: "/asset/img/concept_art_4.png",
        alt: "Isometric canopy volume with voxel grid and highlighted clusters.",
        title: "Get a zone map you can run.",
        text: "Aim airflow and dehu where it matters, then verify the change.",
      },
      {
        img: "/asset/img/concept_art_5.png",
        alt: "CAD schematic with numbered callouts for speakers and microphones.",
        title: "Measure like a canopy, not a thermostat.",
        text: "Multi-path coverage so one “good” sensor can’t hide a bad corner.",
      },
    ];
  }

  firstUpdated() {
    this._startAutoplay();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopAutoplay();
  }

  _startAutoplay() {
    this._stopAutoplay();
    // Rotate every 4.5s (tweak as you like)
    this._timer = window.setInterval(() => {
      if (this._paused) return;
      this._go(this._active + 1);
    }, 4500);
  }

  _stopAutoplay() {
    if (this._timer) {
      window.clearInterval(this._timer);
      this._timer = null;
    }
  }

  _pause() {
    this._paused = true;
  }

  _resume() {
    this._paused = false;
  }

  _go(idx) {
    const n = this._slides.length;
    const next = ((idx % n) + n) % n; // safe wrap
    this._active = next;
  }

  _prev() {
    this._go(this._active - 1);
  }

  _next() {
    this._go(this._active + 1);
  }

  _onKeydown(e) {
    // Allow arrow keys when focused on the carousel region
    if (e.key === "ArrowLeft") this._prev();
    if (e.key === "ArrowRight") this._next();
  }

  render() {
    const slide = this._slides[this._active];
    const total = this._slides.length;
    const labelId = "hero-carousel-title";

    return html`
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__inner hero__grid">
          <!-- Left column: copy -->
          <div class="hero__copy">
            <div class="hero__subheadBlock topo">
              <div class="topo__kicker">Grow-room geometry</div>

              <h1 class="hero__title topo__title" id="hero-title">
                Turn your grow from
                <span class="topo__quote">“one number”</span>
                into <span class="topo__em">zones you can actually run</span>.
              </h1>

              <p class="topo__lede">
                Canopy climate isn’t uniform. Averages hide pockets. We map 3D canopy zones for targeted,
                provable fixes.
              </p>

              <ul class="hero__bullets topo__features">
                <li class="topo__feature">
                  <span class="topo__glyph" aria-hidden="true"></span>
                  <span class="topo__text"
                    ><strong>Zone the canopy:</strong> stable lanes vs pocket-prone regions</span
                  >
                </li>
                <li class="topo__feature">
                  <span class="topo__glyph" aria-hidden="true"></span>
                  <span class="topo__text"
                    ><strong>Catch cycle-driven drift:</strong> repeatable pockets tied to lights /
                    irrigation</span
                  >
                </li>
                <li class="topo__feature">
                  <span class="topo__glyph" aria-hidden="true"></span>
                  <span class="topo__text"
                    ><strong>Fewer resets:</strong> less chasing setpoints, fewer “that corner”
                    surprises</span
                  >
                </li>
              </ul>
            </div>

            <!-- “Receipt-style” callout -->
            <div class="topo__callout" role="note" aria-label="Priority access">
              <div class="topo__stamp">PRIORITY</div>
              <div class="topo__calloutText">
                <strong>Early partners lock in pricing.</strong>
                <span>Secure your vertical early to keep your options open.</span>
              </div>
            </div>

            <div class="hero__cta-row">
              <a class="button button--primary" href="/landing/pilot">Get Priority Access</a>
            </div>
          </div>

          <!-- Right column: rotating carousel -->
          <div class="hero__viz" aria-hidden="false">
            <div
              class="hero__vizCard"
              role="region"
              aria-roledescription="carousel"
              aria-labelledby="${labelId}"
              @mouseenter=${this._pause}
              @mouseleave=${this._resume}
              @focusin=${this._pause}
              @focusout=${this._resume}
              @keydown=${this._onKeydown}
              tabindex="0"
            >
              <div class="hero__vizKicker" id="${labelId}">Pilot concept visuals</div>
              <div class="hero__vizSub">Auto-rotating (pause on hover/focus)</div>

              <!-- Keep your existing “article card” semantics; show one at a time -->
              <section class="pa-visuals" aria-label="Pilot concept visuals">
                <div class="pa-visuals__grid">
                  <article class="pa-card">
                    <div class="pa-card__media">
                      <img
                        class="pa-card__img"
                        src="${slide.img}"
                        alt="${slide.alt}"
                        loading="lazy"
                      />
                    </div>
                    <div class="pa-card__body">
                      <h3 class="pa-card__title">${slide.title}</h3>
                      <p class="pa-card__text">${slide.text}</p>
                    </div>
                  </article>
                </div>
              </section>

              <!-- Controls -->
<!-- Controls -->
<div class="pa-carousel" aria-label="Carousel controls">
  <button
    class="pa-carousel__nav pa-carousel__nav--prev"
    type="button"
    @click=${this._prev}
    aria-label="Previous visual"
  >
    <svg class="pa-carousel__icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M12.5 4.5 L7 10 L12.5 15.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
    <span class="sr-only">Previous</span>
  </button>

  <div class="pa-carousel__dots" role="tablist" aria-label="Choose visual">
    ${this._slides.map(
      (_, i) => html`
        <button
          class="pa-carousel__dot"
          type="button"
          role="tab"
          aria-selected="${i === this._active}"
          aria-label="Show visual ${i + 1} of ${total}"
          @click=${() => this._go(i)}
        ></button>
      `
    )}
  </div>

  <button
    class="pa-carousel__nav pa-carousel__nav--next"
    type="button"
    @click=${this._next}
    aria-label="Next visual"
  >
    <svg class="pa-carousel__icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M7.5 4.5 L13 10 L7.5 15.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
    <span class="sr-only">Next</span>
  </button>
</div>

          </div>
        </div>
      </section>
    `;
  }
}

customElements.define("site-hero", SiteHero);
