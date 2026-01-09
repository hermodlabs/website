// ./components/cannabis-market-proof.js
import { LitElement, html, css } from "lit";

export class CannabisMarketProof extends LitElement {
  static properties = {
    kicker: { type: String },
    title: { type: String },
    lede: { type: String },

    href: { type: String },        // primary link (read online)
    hrefText: { type: String },

    secondaryHref: { type: String }, // secondary link (request additions)
    secondaryText: { type: String },

    status: { type: String },      // badge text (e.g., Published)
    note: { type: String },        // small footer note

    // Market sizing “social proof” stats
    horizon: { type: String },     // e.g., 2025–2035
    tam2030: { type: String },     // e.g., $2.84B
    tam2035: { type: String },     // e.g., $5.01B
    naSam2030: { type: String },   // e.g., $0.85B
    naSam2035: { type: String },   // e.g., $1.50B
    som2030: { type: String },     // e.g., $8.5M
    som2035: { type: String },     // e.g., $45M
    assumptions: { type: String }  // e.g., "Base case: 12% env slice; NA=30% share; SOM targets 1%/3%"
  };

  constructor() {
    super();
    this.kicker = "Market Research";
    this.title = "Cannabis Microclimate Sensing — Market Wedge";
    this.lede =
      "We’re entering cannabis through a cost-and-compliance wedge: dense microclimate sensing that turns energy, quality, and audit pressure into measurable stability.";

    this.href = "/engage/invest/research/cannabis/";
    this.hrefText = "Read the deep dive";

    this.secondaryHref = "#request";
    this.secondaryText = "Request additions";

    this.status = "Published";
    this.note =
      "Sizing is top-down and assumption-labeled; we publish the logic so buyers can audit the story.";

    this.horizon = "2025–2035";

    // “Social proof” numbers pulled from your narrative-structured report (base case)
    this.tam2030 = "$2.84B";
    this.tam2035 = "$5.01B";
    this.naSam2030 = "$0.85B";
    this.naSam2035 = "$1.50B";
    this.som2030 = "$8.5M";
    this.som2035 = "$45M";

    this.assumptions =
      "Base case: 12% environmental slice of cannabis-tech spend; North America = 30% of global; SOM targets 1% by 2030 and 3% by 2035.";
  }

  static styles = css`
    :host {
      display: block;
    }

    .wrap {
      max-width: var(--site-max, 1100px);
      margin: 0 auto;
      padding: clamp(16px, 3vw, 28px) clamp(14px, 3vw, 22px);
    }

    .card {
      position: relative;
      border-radius: 18px;
      border: 1px solid rgba(0,0,0,0.10);
      background: rgba(255,255,255,0.92);
      box-shadow: 0 10px 28px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    /* subtle “market proof” accent */
    .card::before {
      content: "";
      position: absolute;
      inset: 0 0 auto 0;
      height: 6px;
      background: linear-gradient(90deg, rgba(16,185,129,0.95), rgba(34,197,94,0.85), rgba(245,158,11,0.65));
    }

    .inner {
      padding: clamp(18px, 3vw, 26px);
    }

    .top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 10px;
    }

    .kicker {
      font-size: 0.82rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(0,0,0,0.55);
      margin: 0 0 6px 0;
    }

    .titleRow {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .title {
      font-size: clamp(1.08rem, 2.2vw, 1.35rem);
      line-height: 1.2;
      margin: 0;
      color: rgba(0,0,0,0.88);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 0.86rem;
      border: 1px solid rgba(16,185,129,0.25);
      background: rgba(16,185,129,0.10);
      color: rgba(0,0,0,0.78);
      white-space: nowrap;
    }

    .lede {
      margin: 8px 0 14px 0;
      color: rgba(0,0,0,0.72);
      line-height: 1.55;
      max-width: 85ch;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 12px;
      margin-top: 10px;
    }

    .stat {
      grid-column: span 4;
      border-radius: 14px;
      border: 1px solid rgba(0,0,0,0.10);
      background: rgba(0,0,0,0.02);
      padding: 12px 12px;
      min-height: 86px;
    }

    @media (max-width: 900px) {
      .stat { grid-column: span 6; }
    }
    @media (max-width: 560px) {
      .stat { grid-column: span 12; }
      .top { flex-direction: column; align-items: flex-start; }
    }

    .statLabel {
      font-size: 0.82rem;
      color: rgba(0,0,0,0.56);
      margin: 0 0 6px 0;
    }

    .statValue {
      font-size: clamp(1.05rem, 2.4vw, 1.35rem);
      margin: 0;
      font-weight: 700;
      color: rgba(0,0,0,0.88);
    }

    .statSub {
      margin: 6px 0 0 0;
      font-size: 0.86rem;
      color: rgba(0,0,0,0.62);
    }

    .assumptions {
      margin-top: 12px;
      border-radius: 14px;
      border: 1px dashed rgba(0,0,0,0.18);
      background: rgba(255,255,255,0.55);
      padding: 10px 12px;
      color: rgba(0,0,0,0.66);
      line-height: 1.5;
      font-size: 0.92rem;
    }

    .actions {
      margin-top: 14px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }

    /* If your site defines .button classes globally, these will inherit.
       Provide minimal fallback styling so the component still looks OK standalone. */
    .button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 12px;
      padding: 10px 12px;
      text-decoration: none;
      font-weight: 700;
      border: 1px solid rgba(0,0,0,0.14);
      color: rgba(0,0,0,0.86);
      background: rgba(255,255,255,0.85);
    }
    .button--primary {
      background: rgba(0,0,0,0.90);
      color: rgba(255,255,255,0.95);
      border-color: rgba(0,0,0,0.90);
    }
    .button--secondary {
      background: rgba(255,255,255,0.85);
    }

    .note {
      margin: 12px 0 0 0;
      font-size: 0.9rem;
      color: rgba(0,0,0,0.60);
    }

    .icon {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: rgba(16,185,129,0.95);
    }
  `;

  render() {
    return html`
      <section class="wrap" aria-label="Cannabis market sizing social proof">
        <div class="card">
          <div class="inner">
            <div class="top">
              <div>
                <p class="kicker">${this.kicker}</p>

                <div class="titleRow">
                  <span class="icon" aria-hidden="true"><i class="fa-solid fa-seedling"></i></span>
                  <h2 class="title">${this.title}</h2>
                </div>

                <p class="lede">${this.lede}</p>
              </div>

              <span class="badge" aria-label="${this.status}">
                <i class="fa-solid fa-check" aria-hidden="true"></i>
                ${this.status}
              </span>
            </div>

            <div class="grid" role="list" aria-label="Market sizing highlights">
              <div class="stat" role="listitem">
                <p class="statLabel">Global TAM (run-rate)</p>
                <p class="statValue">${this.tam2030} → ${this.tam2035}</p>
                <p class="statSub">${this.horizon} horizon (base case)</p>
              </div>

              <div class="stat" role="listitem">
                <p class="statLabel">North America SAM (run-rate)</p>
                <p class="statValue">${this.naSam2030} → ${this.naSam2035}</p>
                <p class="statSub">Serviceable geo anchor</p>
              </div>

              <div class="stat" role="listitem">
                <p class="statLabel">North America SOM target</p>
                <p class="statValue">${this.som2030} → ${this.som2035}</p>
                <p class="statSub">Execution-based capture</p>
              </div>
            </div>

            <div class="assumptions">
              <strong>Assumptions (explicit):</strong> ${this.assumptions}
            </div>

            <div class="actions">
              <a class="button button--primary" href="${this.href}">
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                ${this.hrefText}
              </a>
              <a class="button button--secondary" href="${this.secondaryHref}">
                <i class="fa-solid fa-envelope-open-text" aria-hidden="true"></i>
                ${this.secondaryText}
              </a>
            </div>

            <p class="note">${this.note}</p>
          </div>
        </div>
      </section>
    `;
  }
}

customElements.define("cannabis-market-proof", CannabisMarketProof);
