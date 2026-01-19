// hl-business-case.js
// Web Component: <hl-business-case>
// Self-contained (no Font Awesome needed). Uses Shadow DOM + inline SVG icons.

class HLBusinessCase extends HTMLElement {
  static get observedAttributes() {
    return [
      "title",
      "lede",
      "apply-href",
      "apply-text",
      "deliverables-href",
      "deliverables-text",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #getAttr(name, fallback) {
    const v = this.getAttribute(name);
    return (v && v.trim()) ? v.trim() : fallback;
  }

  #render() {
    const title = this.#getAttr("title", "Business Case: Two Outcomes, One Lever");
    const lede = this.#getAttr(
      "lede",
      "Humidity is both a profit lever and a loss lever. The same failure mode drives both: averages look clean while the canopy disagrees."
    );

    const applyHref = this.#getAttr("apply-href", "#apply");
    const applyText = this.#getAttr("apply-text", "Apply for a pilot");
    const delivHref = this.#getAttr("deliverables-href", "#what-you-get");
    const delivText = this.#getAttr("deliverables-text", "See pilot deliverables");

    this.shadowRoot.innerHTML = `
      <style>
        :host{
          display:block;
          /* Theme hooks */
          --hl-text: #111;
          --hl-muted: rgba(17,17,17,0.86);
          --hl-border: rgba(0,0,0,0.10);
          --hl-card-bg: rgba(255,255,255,0.92);
          --hl-shadow: 0 10px 25px rgba(0,0,0,0.06);

          --hl-profit-accent: rgba(16,185,129,0.95);
          --hl-loss-accent: rgba(239,68,68,0.95);

          --hl-cta-bg: #111;
          --hl-cta-text: #fff;
          --hl-cta-ghost-bg: rgba(255,255,255,0.75);
          --hl-cta-ghost-text: #111;

          color: var(--hl-text);
        }

        .wrap{
          padding: clamp(2rem, 4vw, 3.5rem) 0;
        }
        .inner{
          width: min(1100px, calc(100% - 2rem));
          margin: 0 auto;
        }

        header{
          margin-bottom: 1.25rem;
        }
        h2{
          font-size: clamp(1.4rem, 2.2vw, 2rem);
          line-height: 1.15;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.01em;
        }
        .lede{
          margin: 0;
          max-width: 78ch;
          color: var(--hl-muted);
          line-height: 1.6;
          font-size: 1.02rem;
        }

        .grid{
          display:grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        @media (max-width: 860px){
          .grid{ grid-template-columns: 1fr; }
        }

        .card{
          border: 1px solid var(--hl-border);
          border-radius: 16px;
          background: var(--hl-card-bg);
          box-shadow: var(--hl-shadow);
          padding: 1.1rem 1.1rem 1rem;
          position: relative;
          overflow:hidden;
        }
        .card.profit{ border-left: 4px solid var(--hl-profit-accent); }
        .card.loss{ border-left: 4px solid var(--hl-loss-accent); }

        .top{
          display:grid;
          grid-template-columns: auto 1fr;
          gap: 0.85rem;
          align-items:start;
          margin-bottom: 0.6rem;
        }

        .icon{
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display:grid;
          place-items:center;
          border: 1px solid rgba(0,0,0,0.10);
          background: rgba(0,0,0,0.03);
        }
        .icon svg{
          width: 20px;
          height: 20px;
        }
        .profit .icon svg{ fill: var(--hl-profit-accent); }
        .loss .icon svg{ fill: var(--hl-loss-accent); }

        h3{
          margin:0;
          font-size: 1.15rem;
          line-height: 1.2;
        }
        .subtitle{
          margin: 0.25rem 0 0 0;
          color: var(--hl-muted);
          line-height: 1.5;
        }

        ul{
          margin: 0.75rem 0 0.75rem 1.1rem;
          padding: 0;
          line-height: 1.6;
        }

        .note{
          margin: 0.5rem 0 0 0;
          padding-top: 0.75rem;
          border-top: 1px dashed rgba(0,0,0,0.18);
          color: var(--hl-muted);
          line-height: 1.6;
        }
        .note strong{ color: var(--hl-text); }

        .footer{
          margin-top: 1rem;
          padding-top: 0.75rem;
        }
        .footerLine{
          margin: 0 0 0.9rem 0;
          max-width: 90ch;
          line-height: 1.6;
          color: var(--hl-muted);
        }

        .ctaRow{
          display:flex;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        a.cta{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 0.75rem 1rem;
          border-radius: 999px;
          text-decoration:none;
          font-weight: 650;
          letter-spacing: 0.01em;
          border: 1px solid rgba(0,0,0,0.14);
          transition: transform 120ms ease, opacity 120ms ease;
          will-change: transform;
        }
        a.cta:hover{ transform: translateY(-1px); opacity: 0.95; }
        a.primary{
          background: var(--hl-cta-bg);
          color: var(--hl-cta-text);
          border-color: var(--hl-cta-bg);
        }
        a.ghost{
          background: var(--hl-cta-ghost-bg);
          color: var(--hl-cta-ghost-text);
        }

        /* Small accessibility niceties */
        a:focus-visible{
          outline: 3px solid rgba(59,130,246,0.55);
          outline-offset: 3px;
        }
      </style>

      <section class="wrap" aria-labelledby="hl-business-case-title">
        <div class="inner">
          <header>
            <h2 id="hl-business-case-title">${this.#escapeHTML(title)}</h2>
            <p class="lede">${this.#escapeHTML(lede)}</p>
          </header>

          <div class="grid" role="list">
            <article class="card profit" role="listitem">
              <div class="top">
                <div class="icon" aria-hidden="true">
                  ${HLBusinessCase.#iconTrendUp()}
                </div>
                <div>
                  <h3>Increase Profit</h3>
                  <p class="subtitle">Increase yield by managing humidity as zones—not a room average.</p>
                </div>
              </div>

              <ul>
                <li>Turn “multiple climates in one room” into a zone map your team can tune against.</li>
                <li>Reduce hidden stress by stabilizing under-canopy and boundary-layer behavior.</li>
                <li>Verify improvements locally: <em>did the zone change, or just the dashboard?</em></li>
              </ul>

              <p class="note"><strong>Outcome:</strong> higher consistency across canopy bands → fewer soft-capped harvests.</p>
            </article>

            <article class="card loss" role="listitem">
              <div class="top">
                <div class="icon" aria-hidden="true">
                  ${HLBusinessCase.#iconShieldVirus()}
                </div>
                <div>
                  <h3>Reduce Loss</h3>
                  <p class="subtitle">Reduce mold risk by finding humidity pockets before they bloom.</p>
                </div>
              </div>

              <ul>
                <li>Detect pocket-prone regions (dead zones, under-canopy pockets, boundary layers).</li>
                <li>Link pockets to modes: lights, irrigation, HVAC/dehu staging, door events.</li>
                <li>Ship “verification hooks” with every fix: what should change, where, and by how much.</li>
              </ul>

              <p class="note"><strong>Outcome:</strong> fewer surprises and less remediation because risk is local first.</p>
            </article>
          </div>

          <div class="footer">
            <p class="footerLine">
              <strong>Receipts, not vibes:</strong> every map includes admissibility checks and a confidence overlay.
              If a window isn’t trustworthy, we don’t pretend it is.
            </p>

            <div class="ctaRow">
              <a class="cta primary" href="${this.#escapeAttr(applyHref)}">${this.#escapeHTML(applyText)}</a>
              <a class="cta ghost" href="${this.#escapeAttr(delivHref)}">${this.#escapeHTML(delivText)}</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  #escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  #escapeAttr(s) {
    // For href attributes; keep it conservative.
    return this.#escapeHTML(s).replaceAll("`", "&#096;");
  }

  static #iconTrendUp() {
    // Simple "trend up" arrow icon (inline SVG)
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 17.5a1 1 0 0 1 1-1h3.2a1 1 0 0 1 .7.29l2.1 2.1 5.2-5.2-2.3-2.3a1 1 0 0 1 .71-1.71H20a1 1 0 0 1 1 1v5.78a1 1 0 0 1-1.71.7l-2.08-2.08-6.62 6.62a1 1 0 0 1-1.41 0L6.78 18.5H4a1 1 0 0 1-1-1z"/>
      </svg>
    `;
  }

  static #iconShieldVirus() {
    // Simple "shield/virus" icon (inline SVG)
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2.5c.2 0 .4.05.57.14l7 3.5A1 1 0 0 1 20 7v5.2c0 4.9-3.06 8.8-7.65 10.3a1.2 1.2 0 0 1-.7 0C7.06 21 4 17.1 4 12.2V7a1 1 0 0 1 .43-.86l7-3.5c.17-.09.37-.14.57-.14zm0 4.5a.9.9 0 0 0-.9.9v.7l-.55-.32a.9.9 0 1 0-.9 1.56l.6.35-.6.35a.9.9 0 1 0 .9 1.56l.55-.32v.7a.9.9 0 0 0 1.8 0v-.7l.55.32a.9.9 0 1 0 .9-1.56l-.6-.35.6-.35a.9.9 0 1 0-.9-1.56l-.55.32v-.7a.9.9 0 0 0-.9-.9z"/>
      </svg>
    `;
  }
}

customElements.define("hl-business-case", HLBusinessCase);
