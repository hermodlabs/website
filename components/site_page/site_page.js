// /components/site_page/site_page.js
// Usage:
//   <site-page>
//     <site-hero></site-hero>
//     <social-proof></social-proof>
//     <site-about></site-about>
//     <event-invite></event-invite>
//   </site-page>
//
// - Light DOM (global CSS applies)
// - Manually moves initial children into <main> (no <slot>)

class SitePage extends HTMLElement {
  connectedCallback() {
    // Prevent double-render if connected multiple times
    if (this.dataset.rendered === "true") return;
    this.dataset.rendered = "true";

    // Capture existing children BEFORE we overwrite innerHTML
    const contentNodes = Array.from(this.childNodes);

    // Build the page chrome
    this.innerHTML = `
      <div class="page">
        <site-header></site-header>
        <main class="main"></main>
        <site-footer></site-footer>
      </div>
    `;

    // Move captured nodes into main
    const main = this.querySelector("main.main");
    contentNodes.forEach((n) => main.appendChild(n));
  }
}

customElements.define("site-page", SitePage);
