// /components/site_footer/site_footer.js
// Usage: <site-footer></site-footer>
//
// - Hardcoded content (no attributes).
// - Light DOM so your global CSS applies.
// - No build step: Lit imported via CDN.
// - Year is computed in render (no DOM poking needed).

import { LitElement, html } from "https://esm.run/lit";

class SiteFooter extends LitElement {
  // Light DOM: render into the element itself (no shadow root)
  createRenderRoot() {
    return this;
  }

  render() {
    const year = new Date().getFullYear();

    return html`
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
                    :root { --ink:#111; }
                    .s { fill:none; stroke:var(--ink); stroke-width:28; stroke-linecap:round; stroke-linejoin:round; }
                    .f { fill:var(--ink); }
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
                  Z" opacity="0.95"></path>

                <path class="s" d="M176 152 V360"></path>
                <path class="s" d="M336 152 V360"></path>

                <path class="s" d="M176 256 H246"></path>
                <path class="s" d="M266 256 H336"></path>

                <circle class="f" cx="256" cy="256" r="10"></circle>
              </svg>
            </span>

            <span class="site-footer__logo">HermodLabs</span>
          </a>

          <div class="site-footer__description">
            HermodLabs builds trust-first sensing and signal verification software so teams can separate real change
            from drift and act with confidence, not guesswork.
          </div>
        </div>

        <nav class="site-footer__nav" aria-label="Footer navigation">
          <h2 class="site-footer__heading">Explore</h2>
          <ul class="site-footer__list">
            <li class="site-footer__item">
              <a class="site-footer__link" href="/">
                <i class="fa-solid fa-house" aria-hidden="true"></i>
                <span class="site-footer__link-text">Home</span>
              </a>
            </li>
            <li class="site-footer__item">
              <a class="site-footer__link" href="/explore/about_us">
                <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                <span class="site-footer__link-text">About Us</span>
              </a>
            </li>
            <li class="site-footer__item">
              <a class="site-footer__link" href="/explore/events">
                <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
                <span class="site-footer__link-text">Events</span>
              </a>
            </li>
            <li class="site-footer__item">
              <a class="site-footer__link" href="/explore/blog">
                <i class="fa-solid fa-pen-nib" aria-hidden="true"></i>
                <span class="site-footer__link-text">Blog</span>
              </a>
            </li>
          </ul>
        </nav>

        <div class="site-footer__actions">
          <h2 class="site-footer__heading">Engage</h2>
          <ul class="site-footer__list">
            <li class="site-footer__item">
              <a class="site-footer__link" href="/engage/invest">
                <i class="fa-solid fa-hand-holding-dollar" aria-hidden="true"></i>
                <span class="site-footer__link-text">Invest in Us</span>
              </a>
            </li>
            <li class="site-footer__item">
              <a class="site-footer__link" href="/engage/pilot">
                <i class="fa-solid fa-flask" aria-hidden="true"></i>
                <span class="site-footer__link-text">Apply for a Pilot</span>
              </a>
            </li>
            <!--
            <li class="site-footer__item">
              <a class="site-footer__link" href="/engage/career">
                <i class="fa-solid fa-briefcase" aria-hidden="true"></i>
                <span class="site-footer__link-text">Work for Us</span>
              </a>
            </li>
            -->
            <li class="site-footer__item">
              <a class="site-footer__link" href="/engage/team">
                <i class="fa-solid fa-users" aria-hidden="true"></i>
                <span class="site-footer__link-text">Meet the Team</span>
              </a>
            </li>
          </ul>
        </div>

        <div class="site-footer__contact">
          <h2 class="site-footer__heading">Contact</h2>

          <div class="site-footer__contact-item">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            <span class="site-footer__contact-text">Bentonville, Arkansas</span>
          </div>

          <div class="site-footer__contact-item">
            <a class="site-footer__contact-link" href="mailto:contact@hermodlabs.com">
              <i class="fa-solid fa-envelope" aria-hidden="true"></i>
              <span class="site-footer__contact-text">contact@hermodlabs.com</span>
            </a>
          </div>
        </div>

        <div class="site-footer__copyright">
          © <span class="site-footer__year">${year}</span> HermodLabs
        </div>
      </footer>
    `;
  }
}

customElements.define("site-footer", SiteFooter);
