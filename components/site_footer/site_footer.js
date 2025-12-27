// /components/site-footer.js
// Usage: <site-footer></site-footer>
//
// - Everything is hardcoded (no attributes, no escaping, no styles).
// - Light DOM so your global CSS applies.

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<footer class="site-footer">
  <div class="site-footer__company">
    <a class="site-footer__brand" href="/" aria-label="HermodLabs home">
      <span class="site-footer__logo-mark" aria-hidden="true">
        <svg
          class="hl-logo"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          role="img"
          aria-label="HermodLabs logo"
        >
          <defs>
            <style>
              :root{ --ink:#111; }
              .s{fill:none;stroke:var(--ink);stroke-width:28;stroke-linecap:round;stroke-linejoin:round}
              .f{fill:var(--ink)}
            </style>
          </defs>

          <path class="s" d="
            M176 56
            H336
            Q354 56 366 68
            L444 146
            Q456 158 456 176
            V336
            Q456 354 444 366
            L366 444
            Q354 456 336 456
            H176
            Q158 456 146 444
            L68 366
            Q56 354 56 336
            V176
            Q56 158 68 146
            L146 68
            Q158 56 176 56
            Z" opacity="0.95"/>

          <path class="s" d="M176 152 V360"/>
          <path class="s" d="M336 152 V360"/>

          <path class="s" d="M176 256 H246"/>
          <path class="s" d="M266 256 H336"/>

          <circle class="f" cx="256" cy="256" r="10"/>
        </svg>
      </span>

      <span class="site-footer__logo">HermodLabs</span>
    </a>

    <div class="site-footer__description">
    HermodLabs builds trust-first sensing and signal verification software so teams can separate real change from drift and act with confidence, not guesswork.
    </div>
  </div>

  <nav class="site-footer__nav" aria-label="Footer navigation">
    <h2 class="site-footer__heading">Explore</h2>
    <ul class="site-footer__list">
      <li class="site-footer__item"><a class="site-footer__link" href="/">Home</a></li>
      <li class="site-footer__item"><a class="site-footer__link" href="/explore/about_us">About Us</a></li>
      <li class="site-footer__item"><a class="site-footer__link" href="/explore/events">Events</a></li>
      <li class="site-footer__item"><a class="site-footer__link" href="/explore/blog">Blog</a></li>
    </ul>
  </nav>

  <div class="site-footer__actions">
    <h2 class="site-footer__heading">Engage</h2>
    <ul class="site-footer__list">
      <li class="site-footer__item"><a class="site-footer__link" href="/engage/invest">Invest in Us</a></li>
      <li class="site-footer__item"><a class="site-footer__link" href="/engage/pilot">Apply for a Pilot</a></li>
      <li class="site-footer__item"><a class="site-footer__link" href="/engage/career">Work for Us</a></li>
    </ul>
  </div>

  <div class="site-footer__contact">
    <h2 class="site-footer__heading">Contact</h2>

    <div class="site-footer__contact-item">Bentonville, Arkansas</div>

    <div class="site-footer__contact-item">
      <a class="site-footer__contact-link" href="mailto:contact@hermodlabs.com">contact@hermodlabs.com</a>
    </div>

    <div class="site-footer__contact-item">
      <a class="site-footer__contact-link" href="tel:+13102275510">310.227.5510</a>
    </div>

    <div class="site-footer__copyright">
      © <span class="site-footer__year"></span> HermodLabs
    </div>
  </div>
</footer>

    `;

    // Set year inside this component only (no global #year dependency)
    const yearEl = this.querySelector(".site-footer__year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }
}

customElements.define("site-footer", SiteFooter);
