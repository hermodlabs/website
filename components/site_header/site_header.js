// /components/site_header/site_header.js
// Usage: <site-header></site-header>
//
// - Hardcoded content (no attributes).
// - Light DOM so your global CSS applies.
// - No build step: Lit imported via CDN.

import { LitElement, html } from "https://esm.run/lit";

class SiteHeader extends LitElement {
  // Light DOM: render into the element itself (no shadow root)
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <header class="site-header">
        <a class="site-header__logo" href="/" aria-label="HermodLabs home">
          <span class="site-header__logo-mark" aria-hidden="true">
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

          <span class="site-header__logo-text">HermodLabs</span>
        </a>

        <nav class="site-header__nav" aria-label="Main navigation">
          <ul class="site-header__nav-list">
            <li class="site-header__nav-item">
              <a class="site-header__nav-link" href="/">
                <i class="fa-solid fa-house" aria-hidden="true"></i>
                <span class="site-header__nav-text">Home</span>
              </a>
            </li>

            <li class="site-header__nav-item">
              <a class="site-header__nav-link" href="/explore/about_us">
                <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                <span class="site-header__nav-text">About Us</span>
              </a>
            </li>

            <li class="site-header__nav-item">
              <a class="site-header__nav-link" href="/explore/events">
                <i class="fa-solid fa-calendar-days" aria-hidden="true"></i>
                <span class="site-header__nav-text">Events</span>
              </a>
            </li>

            <li class="site-header__nav-item">
              <a class="site-header__nav-link" href="/explore/team">
                <i class="fa-solid fa-users" aria-hidden="true"></i>
                <span class="site-header__nav-text">Our Team</span>
              </a>
            </li>
          </ul>
        </nav>

        <div class="site-header__cta">
          <a class="button button--primary" href="/landing/pilot">Priority Access</a>
        </div>
      </header>
    `;
  }
}

customElements.define("site-header", SiteHeader);
