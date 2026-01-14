// /components/site-hero.js
import { LitElement, html } from "lit";

// Option A (bundler / npm):  npm i d3
//import * as d3 from "d3";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


// Option B (no bundler): comment out the line above and use this instead:
// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export class SiteHero extends LitElement {
  // Keep global CSS working (no shadow DOM)
  createRenderRoot() {
    return this;
  }

  constructor() {
    super();

    // 10 x 6 field (row 0 bottom .. row 5 top), values 1..4
    this._cols = 10;
    this._rows = 6;

    // Same pattern as your TikZ figure (top row first in TikZ)
    const rowsTopToBottom = [
      [1, 1, 1, 2, 2, 2, 3, 3, 3, 3],
      [1, 1, 2, 2, 2, 3, 3, 3, 3, 3],
      [1, 2, 2, 2, 3, 3, 3, 4, 3, 3],
      [1, 2, 2, 3, 3, 3, 4, 4, 3, 2],
      [1, 1, 2, 2, 3, 3, 3, 4, 2, 2],
      [1, 1, 1, 2, 2, 2, 3, 3, 2, 1],
    ];

    // Convert to bottom-to-top indexing, flatten for d3
    const rowsBottomToTop = [...rowsTopToBottom].reverse();
    this._data = [];
    for (let y = 0; y < this._rows; y++) {
      for (let x = 0; x < this._cols; x++) {
        this._data.push({ x, y, v: rowsBottomToTop[y][x] });
      }
    }

    // Color palette (close to your TikZ hexes)
    this._colors = new Map([
      [1, "#2563EB"], // blue
      [2, "#10B981"], // green
      [3, "#F59E0B"], // amber
      [4, "#EF4444"], // red
    ]);

    this._ro = null;
  }

  firstUpdated() {
    this._renderField();

    // Re-render on resize so the SVG stays crisp & sized to its container
    const host = this.querySelector("#hero-field");
    if (host && "ResizeObserver" in window) {
      this._ro = new ResizeObserver(() => this._renderField());
      this._ro.observe(host);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._ro) this._ro.disconnect();
  }

  _renderField() {
    const mount = this.querySelector("#hero-field");
    if (!mount) return;

    // clear
    mount.innerHTML = "";

    const cols = this._cols;
    const rows = this._rows;

    // Responsive: SVG fills container width; height follows aspect ratio
    const width = mount.clientWidth || 520;
    const aspect = rows / cols; // 6/10
    const height = Math.max(220, Math.round(width * aspect));

    const svg = d3
      .select(mount)
      .append("svg")
      .attr("class", "heroField")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${cols} ${rows}`)
      .attr("preserveAspectRatio", "xMaxYMin meet")
      .attr("role", "img")
      .attr(
        "aria-label",
        "Heatmap-style field showing zones and a highlighted worst pocket."
      );

    // subtle background
    svg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", cols)
      .attr("height", rows)
      .attr("rx", 0.35)
      .attr("ry", 0.35)
      .attr("class", "heroField__bg");

    // cells
    svg
      .selectAll("rect.heroField__cell")
      .data(this._data)
      .enter()
      .append("rect")
      .attr("class", "heroField__cell")
      .attr("x", (d) => d.x)
      .attr("y", (d) => rows - 1 - d.y) // flip so "top" visually matches your TikZ intuition
      .attr("width", 1)
      .attr("height", 1)
      .attr("fill", (d) => this._colors.get(d.v));

    // room outline
    svg
      .append("rect")
      .attr("class", "heroField__room")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", cols)
      .attr("height", rows)
      .attr("rx", 0.35)
      .attr("ry", 0.35);

    // find a "worst pocket" (first v=4 from your pattern)
    const worst = this._data.find((d) => d.v === 4) || { x: 7, y: 3, v: 4 };
    const worstVisY = rows - 1 - worst.y;

    // pulse ring around worst pocket
    //const ring = svg
    //  .append("rect")
    //  .attr("x", worst.x)
    //  .attr("y", worstVisY)
    //  .attr("width", 1)
    //  .attr("height", 1)
    //  .attr("class", "heroField__pulse");

    // marker arrow
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "heroFieldArrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "currentColor");

    // arrow + label near top-right, pointing to pocket
    const labelX = cols - 0.15;
    const labelY = 1.15;

    //svg
    //  .append("line")
    //  .attr("class", "heroField__arrow")
    //  .attr("x1", labelX - 0.6)
    //  .attr("y1", labelY + 0.25)
    //  .attr("x2", worst.x + 0.5)
    //  .attr("y2", worstVisY + 0.5)
    //  .attr("marker-end", "url(#heroFieldArrow)");

    //svg
    //  .append("text")
    //  .attr("class", "heroField__label")
    //  .attr("x", labelX - 0.1)
    //  .attr("y", labelY)
    //  .attr("text-anchor", "end")
    //  .text("Worst pocket");
  }

render() {
  return html`
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__inner hero__grid">
        <!-- Left column: copy -->
        <div class="hero__copy">

          <!-- Topological header stack -->
          <div class="hero__subheadBlock topo">
            <div class="topo__kicker">Topology of the room</div>

            <h1 class="hero__title topo__title" id="hero-title">
              Our 3D humidity-gradient modeling turns
              <span class="topo__quote">“room average”</span>
              into <span class="topo__em">actionable zones</span>.
            </h1>

            <p class="topo__lede">
              We map boundaries, pockets, and stable regions so interventions have coordinates.
            </p>

            <!-- “Topological” bullets -->
            <ul class="hero__bullets topo__features">
              <li class="topo__feature">
                <span class="topo__glyph" aria-hidden="true"></span>
                <span class="topo__text"><strong>Detect pockets:</strong> hotspots and airflow dead zones</span>
              </li>
              <li class="topo__feature">
                <span class="topo__glyph" aria-hidden="true"></span>
                <span class="topo__text"><strong>Stabilize runs:</strong> outcomes stay consistent across cycles</span>
              </li>
              <li class="topo__feature">
                <span class="topo__glyph" aria-hidden="true"></span>
                <span class="topo__text"><strong>Reduce surprises:</strong> fewer late-stage failures</span>
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
            <a class="button button--primary" href="/promo/priority_access">Get Priority Access</a>
          </div>
        </div>

        <!-- Right column: viz -->
        <div class="hero__viz" aria-hidden="false">
          <div class="hero__vizCard">
            <div class="hero__vizKicker">3D humidity-gradient modeler</div>
            <div class="hero__vizSub">Zones + pockets (2D analog)</div>
            <div id="hero-field" class="hero__vizMount"></div>
            <div class="hero__vizCaption">
              Still trusting the room average? That’s how pockets survive.
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

}

customElements.define("site-hero", SiteHero);
