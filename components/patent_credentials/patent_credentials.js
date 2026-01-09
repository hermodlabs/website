// patent-credentials.js
// Self-contained web component (no dependencies).
// Right column uses a 2-column feature grid (when wide enough) + a wide card spanning both columns,
// styled to match your engine-hero card vibe, with overlap-safe grid rules.

(() => {
  const css = `
    :host{
      display:block;

      /* Theme hooks (fallbacks are intentionally calm). */
      --pc-text: var(--text-color, #0f172a);
      --pc-muted: var(--muted-color, rgba(15, 23, 42, 0.72));
      --pc-border: var(--border-color, rgba(15, 23, 42, 0.12));
      --pc-surface: var(--surface-color, #ffffff);
      --pc-surface-2: var(--surface-2-color, rgba(15, 23, 42, 0.03));
      --pc-accent: var(--accent-color, #2563eb);

      --pc-radius: 18px;
      --pc-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);

      color: var(--pc-text);
      font: inherit;
    }

    /* Grid-safety */
    :host, *, *::before, *::after { box-sizing: border-box; }

    @media (prefers-color-scheme: dark){
      :host{
        --pc-text: var(--text-color, #e5e7eb);
        --pc-muted: var(--muted-color, rgba(229, 231, 235, 0.72));
        --pc-border: var(--border-color, rgba(229, 231, 235, 0.14));
        --pc-surface: var(--surface-color, rgba(255, 255, 255, 0.04));
        --pc-surface-2: var(--surface-2-color, rgba(255, 255, 255, 0.06));
        --pc-accent: var(--accent-color, #60a5fa);
        --pc-shadow: 0 14px 40px rgba(0, 0, 0, 0.22);
      }
    }

    .pc{
      padding: clamp(0.75rem, 2vw, 1.25rem) 0;
    }

    .pc__container{
      width: min(1100px, calc(100% - 2rem));
      margin: 0 auto;
    }

    .pc__panel{
      border: 1px solid var(--pc-border);
      background: linear-gradient(180deg, var(--pc-surface) 0%, var(--pc-surface-2) 100%);
      border-radius: var(--pc-radius);
      box-shadow: var(--pc-shadow);
      overflow: clip;
    }

    .pc__inner{
      padding: clamp(1rem, 2.6vw, 1.5rem);
      display: grid;
      gap: 1.1rem;
      align-items: start;
    }

    @media (min-width: 860px){
      .pc__inner{
        grid-template-columns: 1.1fr 1fr;
        gap: 1.5rem;
        align-items: center;
      }
    }

    /* Left column header */
    .pc__kicker{
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      font-size: .82rem;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--pc-muted);
      margin: 0 0 .35rem 0;
    }

    .pc__dot{
      width: .6rem;
      height: .6rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--pc-accent) 28%, transparent);
      box-shadow: 0 0 0 6px color-mix(in srgb, var(--pc-accent) 12%, transparent);
    }

    .pc__title{
      margin: 0;
      font-size: clamp(1.05rem, 1.15rem + 0.6vw, 1.6rem);
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .pc__lede{
      margin: .5rem 0 0 0;
      color: var(--pc-muted);
      line-height: 1.55;
      max-width: 52ch;
    }

    .pc__cta{
      margin-top: .85rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: .75rem;
    }

    /* Default link style (if you don't slot your own button) */
    .pc__link{
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      color: var(--pc-text);
      text-decoration: none;
      font-weight: 600;
      padding: .55rem .75rem;
      border-radius: 999px;
      border: 1px solid var(--pc-border);
      background: color-mix(in srgb, var(--pc-surface) 85%, transparent);
    }
    .pc__link:hover{ border-color: color-mix(in srgb, var(--pc-accent) 35%, var(--pc-border)); }
    .pc__link:focus-visible{
      outline: 2px solid color-mix(in srgb, var(--pc-accent) 55%, transparent);
      outline-offset: 3px;
    }

    /* RIGHT COLUMN: overlap-safe feature grid */
    .pc__features{
      display: grid;
      grid-template-columns: 1fr; /* default 1-col to prevent overlap */
      gap: .8rem;
      align-items: stretch;
      min-width: 0;
    }

    @media (min-width: 560px){
      .pc__features{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .pc-feature{
      margin: 0;
      min-width: 0;
    }

    .pc-feature--wide{
      grid-column: 1 / -1;
    }

    .pc-feature__link{
      display: flex;            /* more stable in grid */
      flex-direction: column;
      height: 100%;
      min-width: 0;

      text-decoration: none;
      color: var(--pc-text);

      border: 1px solid var(--pc-border);
      border-radius: 16px;

      background: color-mix(in srgb, var(--pc-surface) 92%, transparent);

      padding: .95rem 1rem;

      transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
    }

    .pc-feature__link:hover{
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--pc-accent) 30%, var(--pc-border));
      box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
      background: color-mix(in srgb, var(--pc-surface) 96%, transparent);
    }

    .pc-feature__link:focus-visible{
      outline: 2px solid color-mix(in srgb, var(--pc-accent) 55%, transparent);
      outline-offset: 3px;
    }

    @media (prefers-reduced-motion: reduce){
      .pc-feature__link{ transition: none; }
      .pc-feature__link:hover{ transform: none; }
    }

    .pc-feature__top{
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: .75rem;
      margin-bottom: .35rem;
      min-width: 0;
    }

    .pc-feature__title{
      margin: 0;
      font-size: 1rem;
      line-height: 1.2;
      letter-spacing: -0.01em;
      min-width: 0;
    }

    .pc-feature__pill{
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: .35rem;

      font-size: .76rem;
      line-height: 1;
      font-weight: 650;

      padding: .28rem .55rem;
      border-radius: 999px;

      border: 1px solid var(--pc-border);
      background: color-mix(in srgb, var(--pc-surface) 75%, transparent);
      color: color-mix(in srgb, var(--pc-text) 92%, var(--pc-muted));
      white-space: nowrap;
      max-width: 100%;
    }

    .pc-feature__text{
      margin: 0;
      color: var(--pc-muted);
      line-height: 1.45;
      font-size: .92rem;
      max-width: 60ch;
    }

    .pc-feature__action{
      display: inline-flex;
      align-items: center;
      gap: .4rem;

      margin-top: .65rem;
      font-weight: 650;
      font-size: .9rem;
      color: color-mix(in srgb, var(--pc-accent) 72%, var(--pc-text));
    }

    .pc-feature--wide .pc-feature__link{
      padding: 1.05rem 1.05rem;
    }

    .pc__note{
      border-top: 1px solid var(--pc-border);
      padding: .75rem clamp(1rem, 2.6vw, 1.5rem);
      color: var(--pc-muted);
      font-size: .9rem;
      line-height: 1.45;
    }
  `;

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(value) {
    if (value == null) return "";
    const v = String(value).trim();
    return v.length ? v : "";
  }

  class PatentCredentials extends HTMLElement {
    static get observedAttributes() {
      return [
        "kicker",
        "title",
        "lede",
        "href",
        "link-text",
        "issued",
        "pending",
        "jurisdictions",
        "scope",
        "status",
        "filings",
        "wide-title",
        "wide-pill",
        "wide-text",
        "wide-link-text",
      ];
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      this.render();
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>${css}</style>

        <section class="pc" aria-labelledby="pc-title">
          <div class="pc__container">
            <div class="pc__panel" part="panel">
              <div class="pc__inner">
                <header>
                  <p class="pc__kicker"><span class="pc__dot" aria-hidden="true"></span>Features</p>
                  <h2 class="pc__title" id="pc-title" part="title">An engine that earns the right to act.</h2>
                  <p class="pc__lede" part="lede">
                    Five mechanisms make interpretation explicit, publicly checkable, and safer to deploy.
                  </p>

                </header>

                <div class="pc__features" role="list" aria-label="Patent highlights" part="features">
                    <div class="" role="listitem" aria-label="">
                        <a class="pc-feature__link" href="/explore/engine/features/co_timing_validity">
                            <div class="pc-feature__top">
                            <h3 class="pc-feature__title">
                                Co-Timing Validity
                            </h3>
                            <span class="pc-feature__pill">
                                Feature
                            </span>
                            </div>
                            <p class="pc-feature__text">
                                Validates timing relationships across sensors, transforms, and assumptions.
                            </p>
                        </a>
                    </div>

                    <div class="" role="listitem" aria-label="">
                        <a class="pc-feature__link" href="/explore/engine/features/interpretive_entitlement">
                            <div class="pc-feature__top">
                            <h3 class="pc-feature__title">
                                Interpretive Entitlement
                            </h3>
                            <span class="pc-feature__pill">
                                Feature
                            </span>
                            </div>
                            <p class="pc-feature__text">
                                Formalizes when an interpretation may be asserted and used by requiring explicit warrants.
                            </p>
                        </a>
                    </div>

                    <div class="" role="listitem" aria-label="">
                        <a class="pc-feature__link" href="/explore/engine/features/public_criteria_correctness">
                            <div class="pc-feature__top">
                            <h3 class="pc-feature__title">
                                Public Criteria Correctness
                            </h3>
                            <span class="pc-feature__pill">
                                Feature
                            </span>
                            </div>
                            <p class="pc-feature__text">
                                Defines “correct” using shared, inspectable criteria.
                            </p>
                        </a>
                    </div>

                    <div class="" role="listitem" aria-label="">
                        <a class="pc-feature__link" href="/explore/engine/features/construction_selection">
                            <div class="pc-feature__top">
                            <h3 class="pc-feature__title">
                                Construction Selection
                            </h3>
                            <span class="pc-feature__pill">
                                Feature
                            </span>
                            </div>
                            <p class="pc-feature__text">
                                Makes the chosen frame/model explicit.
                            </p>
                        </a>
                    </div>

                    <div class="pc-feature pc-feature--wide" role="listitem" aria-label="">
                        <a class="pc-feature__link" href="/explore/engine/features/multi_layer_permission_to_act_stack">
                            <div class="pc-feature__top">
                            <h3 class="pc-feature__title">
                                Multi-Layer Permission-to-Act Stack
                            </h3>
                            <span class="pc-feature__pill">
                                Feature
                            </span>
                            </div>
                            <p class="pc-feature__text">
                                Separates “can we infer?” from “may we act?”
                            </p>
                        </a>
                    </div>

                </div>
              </div>

              <div class="pc__note" part="note">
                <slot name="note">
                  Coverage varies by jurisdiction and embodiment. Feature names describe behavior; underlying implementations may evolve.
                </slot>
              </div>
            </div>
          </div>
        </section>
      `;
    }
  }

  if (!customElements.get("patent-credentials")) {
    customElements.define("patent-credentials", PatentCredentials);
  }
})();
