import * as Plot from "@observablehq/plot";
import * as d3 from "d3";

/**
 * Simple, editorial charts:
 * - grayscale + one subtle accent via opacity
 * - hover tooltips (tip: true + title)
 * - responsive rerender on resize
 */

function mountPlot(el, specFn) {
  if (!el) return;

  let plot = null;
  const render = () => {
    const w = Math.max(320, el.clientWidth || 0);
    const next = specFn(w);

    // Clear and mount
    el.innerHTML = "";
    plot = next;
    el.appendChild(plot);
  };

  // initial render
  render();

  // responsive: resize observer with small debounce
  let raf = null;
  const ro = new ResizeObserver(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  });
  ro.observe(el);

  // return cleanup if you ever need it
  return () => ro.disconnect();
}

function commonStyle() {
  // If your site uses dark theme, you may want to swap these to currentColor-based.
  return {
    marginLeft: 80,
    marginRight: 18,
    marginTop: 10,
    marginBottom: 36,
    style: {
      fontFamily: "inherit",
      fontSize: 12
    }
  };
}

/* =========================================================
   1) Core demand drivers (ranked bars)
   ========================================================= */
function driversChart(width) {
  const data = [
    { driver: "Uptime + risk asymmetry", score: 5, note: "Failure costs dwarf monitoring cost." },
    { driver: "Regulatory / reporting pressure", score: 4, note: "Auditability + logging expectations tighten." },
    { driver: "Asset density", score: 4, note: "Small deviations cause outsized outcomes." },
    { driver: "Operational scrutiny", score: 3, note: "Teams must explain drift, not just see alarms." },
    { driver: "Energy constraints", score: 3, note: "HVAC optimization under cost + decarb pressure." }
  ];

  const isNarrow = width < 520;

  // Optional: shorten the long label on narrow screens
  const short = {
    "Uptime + risk asymmetry": "Uptime + risk",
    "Regulatory / reporting pressure": "Regulatory pressure",
    "Asset density": "Asset density",
    "Operational scrutiny": "Ops scrutiny",
    "Energy constraints": "Energy constraints"
  };

  const yLabel = (d) => (isNarrow ? short[d] : d);

  // Dynamic margin so y labels never clip; clamp to a fraction of width
  const rendered = data.map(d => yLabel(d.driver));
  const longest = rendered.reduce((a, b) => (a.length >= b.length ? a : b), "");
  const marginLeftRaw = Math.max(100, 50 + longest.length * 7);
  const marginLeft = Math.min(marginLeftRaw, Math.floor(width * 0.38));

  return Plot.plot({
    ...commonStyle(),
    width,
    height: 240,
    marginLeft,
    marginBottom: 36,
    x: { label: "Pressure (qualitative)", domain: [0, 5], ticks: 5 },
    y: { label: null, tickFormat: yLabel },
    marks: [
      Plot.ruleX([0], { stroke: "currentColor", strokeOpacity: 0.2 }),

      Plot.barX(data, {
        x: "score",
        y: "driver",
        sort: { y: "x", reverse: true },
        fill: "currentColor",
        fillOpacity: 0.12,
        stroke: "currentColor",
        strokeOpacity: 0.18,
        tip: true,
        title: (d) => `${d.driver}\nPressure: ${d.score}/5\n${d.note}`
      }),

      Plot.text(data, {
        x: "score",
        y: "driver",
        text: (d) => `${d.score}/5`,
        dx: 8,
        fill: "currentColor",
        fillOpacity: 0.75,
        fontWeight: 800
      })
    ]
  });
}


/* =========================================================
   2) Technology & market inflection (step lines)
   ========================================================= */
function inflectionChart(width) {
  const isNarrow = width < 560;

  const tracks = [
    { track: "Sensors & connectivity", short: "Sensors" },
    { track: "Cloud-connected BMS", short: "Cloud BMS" },
    { track: "Analytics / digital twin", short: "Analytics" }
  ];

  // Milestones (kept short in-chart)
  const steps = [
    { step: 1, label: "Then" },
    { step: 2, label: "Now" },
    { step: 3, label: "Enables" }
  ];

  // Full text lives in tooltips + table (not in-chart)
  const points = [
    { track: tracks[0].track, step: 1, short: "Then", tip: "Low density, costly installs" },
    { track: tracks[0].track, step: 2, short: "Now", tip: "Cheap, reliable, deployable at scale" },
    { track: tracks[0].track, step: 3, short: "Enables", tip: "Dense instrumentation becomes practical" },

    { track: tracks[1].track, step: 1, short: "Then", tip: "Siloed on-prem dashboards" },
    { track: tracks[1].track, step: 2, short: "Now", tip: "Continuous ingestion + integration" },
    { track: tracks[1].track, step: 3, short: "Enables", tip: "Central monitoring + continuous analysis" },

    { track: tracks[2].track, step: 1, short: "Then", tip: "Mostly alarms + thresholds" },
    { track: tracks[2].track, step: 2, short: "Now", tip: "Modeling + optimization mainstream" },
    { track: tracks[2].track, step: 3, short: "Enables", tip: "Explain drift, not just detect it" }
  ];

  const xTick = (d) => {
    if (!isNarrow) return d;
    const t = tracks.find((x) => x.track === d);
    return t ? t.short : d;
  };

  // left margin based on "Enables" label etc (small)
  const marginLeft = Math.min(Math.max(70, Math.floor(width * 0.18)), 120);

  return Plot.plot({
    ...commonStyle(),
    width,
    height: isNarrow ? 260 : 230,
    marginLeft,
    marginBottom: isNarrow ? 52 : 38,
    x: {
      label: null,
      domain: tracks.map((t) => t.track),
      tickFormat: xTick,
      tickRotate: isNarrow ? -18 : 0,
      padding: 0.35
    },
    y: {
      label: null,
      domain: [1, 2, 3],
      tickFormat: (d) => steps.find((s) => s.step === d)?.label ?? d,
      padding: 0.4
    },
    marks: [
      Plot.frame({ stroke: "currentColor", strokeOpacity: 0.12 }),

      // Connect the three milestones per track
      Plot.line(points, {
        x: "track",
        y: "step",
        z: "track",
        stroke: "currentColor",
        strokeOpacity: 0.22,
        strokeWidth: 2
      }),

      // Dots (visible, minimal)
      Plot.dot(points, {
        x: "track",
        y: "step",
        r: 8,
        fill: "currentColor",
        fillOpacity: 0.12,
        stroke: "currentColor",
        strokeOpacity: 0.85,
        strokeWidth: 2,
        tip: true,
        title: (d) => `${d.track} — ${d.short}\n${d.tip}`
      }),

      // 1/2/3 labels inside dots
      Plot.text(points, {
        x: "track",
        y: "step",
        text: (d) => String(d.step),
        fill: "currentColor",
        fillOpacity: 0.9,
        fontWeight: 900
      })
    ]
  });
}



/* =========================================================
   3) TAM/SAM/SOM logic (editorial “funnel bar”)
   ========================================================= */
function segmentsChart(width) {
  // Assumed intended order (consistent funnel):
  // TAM 70B, SAM 24B, SOM 3B
  const steps = [
    { stage: "TAM", value: 70, label: "$70B", note: "Total addressable: global high-tolerance environmental monitoring" },
    { stage: "SAM", value: 24, label: "$24B", note: "Serviceable: practical geography + reachable facilities" },
    { stage: "SOM", value: 3,  label: "$3B",  note: "Obtainable: minimum viable segment under scrutiny + forced buying" }
  ];

  const max = d3.max(steps, d => d.value);

  return Plot.plot({
    ...commonStyle(),
    width,
    height: 220,
    x: { label: "Market size (USD, billions)", domain: [0, max], ticks: 5 },
    y: { label: null },
    marks: [
      Plot.ruleX([0], { stroke: "currentColor", strokeOpacity: 0.2 }),

      Plot.barX(steps, {
        x: "value",
        y: "stage",
        sort: { y: null },
        fill: "currentColor",
        fillOpacity: 0.12,
        stroke: "currentColor",
        strokeOpacity: 0.18,
        tip: true,
        title: (d) => `${d.stage}: ${d.label}\n${d.note}`
      }),

      // show $ labels at the end of each bar
      Plot.text(steps, {
        x: "value",
        y: "stage",
        text: "label",
        dx: 8,
        fill: "currentColor",
        fillOpacity: 0.75,
        fontWeight: 800
      })
    ]
  });
}


/* =========================================================
   4) Adoption & buying dynamics (trigger → buyer role map)
   ========================================================= */
function buyingChart(width) {
  const pts = [
    { trigger: "Audit / compliance",    role: "Facilities",      weight: 4, note: "Reliability + auditability + reporting fit" },
    { trigger: "Audit / compliance",    role: "QA / Compliance", weight: 5, note: "Logging + defensible narrative" },
    { trigger: "Expansion / retrofit",  role: "Facilities",      weight: 5, note: "Integration + commissioning timelines" },
    { trigger: "Expansion / retrofit",  role: "Operations",      weight: 3, note: "Operational continuity" },
    { trigger: "Near-miss / incident",  role: "Reliability",     weight: 5, note: "Explain drift, identify origin/propagation" },
    { trigger: "Near-miss / incident",  role: "Operations",      weight: 4, note: "Root cause + prevent recurrence" }
  ];

  const xDomain = ["Audit / compliance", "Expansion / retrofit", "Near-miss / incident"];
  const yDomain = ["Facilities", "Operations", "Reliability", "QA / Compliance"];

  // Responsive behavior
  const isNarrow = width < 520;

  // Short axis labels for small screens (full labels still appear in tooltips)
  const xShort = {
    "Audit / compliance": "Audit",
    "Expansion / retrofit": "Expansion",
    "Near-miss / incident": "Incident"
  };

  const yShort = {
    "Facilities": "Facilities",
    "Operations": "Ops",
    "Reliability": "Reliability",
    "QA / Compliance": "QA"
  };

  const xTick = (d) => (isNarrow ? xShort[d] : d);
  const yTick = (d) => (isNarrow ? yShort[d] : d);

  // Dynamic left margin based on labels we actually render
  const yLabelsRendered = yDomain.map(yTick);
  const longest = yLabelsRendered.reduce((a, b) => (a.length >= b.length ? a : b), "");
  // ~7px per char + padding, but clamp to avoid huge whitespace on narrow screens
  const marginLeftRaw = Math.max(80, 40 + longest.length * 7);
  const marginLeft = Math.min(marginLeftRaw, Math.floor(width * 0.28)); // <= 28% of chart width

  // Map 1..5 to an editorial opacity range
  const opacity = (w) => 0.12 + (w - 1) * (0.46 / 4); // 1->0.12, 5->0.58

  return Plot.plot({
    ...commonStyle(),
    width,
    height: isNarrow ? 280 : 260,
    marginLeft,
    marginBottom: isNarrow ? 70 : 48, // extra room for rotated x labels
    x: {
      label: null,
      domain: xDomain,
      padding: isNarrow ? 0.18 : 0.3,
      tickFormat: xTick,
      tickRotate: isNarrow ? -28 : 0
    },
    y: {
      label: null,
      domain: yDomain,
      padding: isNarrow ? 0.28 : 0.3,
      tickFormat: yTick
    },
    marks: [
      Plot.frame({ stroke: "currentColor", strokeOpacity: 0.12 }),

      Plot.cell(pts, {
        x: "trigger",
        y: "role",
        fill: "currentColor",
        fillOpacity: (d) => opacity(d.weight),
        stroke: "currentColor",
        strokeOpacity: 0.12,
        tip: true,
        title: (d) => `${d.trigger} → ${d.role}\nPressure: ${d.weight}/5\n${d.note}`
      }),

      Plot.text(pts, {
        x: "trigger",
        y: "role",
        text: (d) => `${d.weight}/5`,
        fill: "currentColor",
        fillOpacity: 0.92,
        fontWeight: 900
      })
    ]
  });
}










/* =========================================================
   5) Market gaps (capability coverage matrix)
   ========================================================= */
function gapsChart(width) {
  const isNarrow = width < 560;

  const rows = [
    "Detect threshold violation",
    "Compliance logging",
    "Explain drift (why)",
    "Spatial variability (where)",
    "Propagation / origin (how)",
    "Defensible narrative (audit)"
  ];

  const cols = [
    "Typical BMS",
    "More sensors",
    "Analytics layer",
    "Validity + co-timing"
  ];

  // Short labels for narrow screens (full labels still available via tooltips + note)
  const colShort = {
    "Typical BMS": "BMS",
    "More sensors": "Sensors",
    "Analytics layer": "Analytics",
    "Validity + co-timing": "Validity"
  };

  // Also shorten long row labels on narrow screens to prevent left cropping
  const rowShort = {
    "Detect threshold violation": "Detect",
    "Compliance logging": "Logging",
    "Explain drift (why)": "Explain why",
    "Spatial variability (where)": "Explain where",
    "Propagation / origin (how)": "Explain how",
    "Defensible narrative (audit)": "Audit-ready"
  };

  const xTick = (d) => (isNarrow ? colShort[d] : d);
  const yTick = (d) => (isNarrow ? rowShort[d] : d);

  // Coverage values (0..1). Keep your existing mapping/feel.
  const coverage = [
    // Typical BMS
    { cap: rows[0], sys: cols[0], v: 1,   note: "Strong at alarms" },
    { cap: rows[1], sys: cols[0], v: 1,   note: "Logging exists" },
    { cap: rows[2], sys: cols[0], v: 0.0, note: "Doesn’t explain drift" },
    { cap: rows[3], sys: cols[0], v: 0.0, note: "Sparse point coverage" },
    { cap: rows[4], sys: cols[0], v: 0.0, note: "No propagation model" },
    { cap: rows[5], sys: cols[0], v: 0.0, note: "Weak under scrutiny" },

    // More sensors
    { cap: rows[0], sys: cols[1], v: 1,   note: "More alarms" },
    { cap: rows[1], sys: cols[1], v: 1,   note: "More logs" },
    { cap: rows[2], sys: cols[1], v: 0.2, note: "More data ≠ explanation" },
    { cap: rows[3], sys: cols[1], v: 0.4, note: "Better spatial sampling" },
    { cap: rows[4], sys: cols[1], v: 0.1, note: "Still hard to infer origin" },
    { cap: rows[5], sys: cols[1], v: 0.2, note: "Hard to defend causality" },

    // Analytics layer
    { cap: rows[0], sys: cols[2], v: 1,   note: "Better detection" },
    { cap: rows[1], sys: cols[2], v: 1,   note: "Better reporting" },
    { cap: rows[2], sys: cols[2], v: 0.5, note: "Partial explanation" },
    { cap: rows[3], sys: cols[2], v: 0.6, note: "Spatial inference improves" },
    { cap: rows[4], sys: cols[2], v: 0.4, note: "Propagation sometimes" },
    { cap: rows[5], sys: cols[2], v: 0.5, note: "Still can be questioned" },

    // Validity + co-timing
    { cap: rows[0], sys: cols[3], v: 1,   note: "Detection preserved" },
    { cap: rows[1], sys: cols[3], v: 1,   note: "Logging + receipts" },
    { cap: rows[2], sys: cols[3], v: 0.8, note: "Explain what changed" },
    { cap: rows[3], sys: cols[3], v: 0.8, note: "Field-like observables" },
    { cap: rows[4], sys: cols[3], v: 0.7, note: "Propagation inference" },
    { cap: rows[5], sys: cols[3], v: 0.9, note: "Validity gates + defensibility" }
  ];

  // Dynamic margins to prevent cropping:
  // Left margin based on rendered y labels; bottom margin larger when ticks rotate/are longer.
  const yLabelsRendered = rows.map(yTick);
  const yLongest = yLabelsRendered.reduce((a, b) => (a.length >= b.length ? a : b), "");
  const marginLeftRaw = Math.max(92, 40 + yLongest.length * 7);
  const marginLeft = Math.min(marginLeftRaw, Math.floor(width * 0.34));

  const marginBottom = isNarrow ? 54 : 44;

  return Plot.plot({
    ...commonStyle(),
    width,
    height: isNarrow ? 340 : 320,
    marginLeft,
    marginBottom,
    x: {
      label: null,
      domain: cols,
      padding: 0.25,
      tickFormat: xTick,
      tickRotate: isNarrow ? -20 : 0
    },
    y: {
      label: null,
      domain: rows,
      padding: 0.25,
      tickFormat: yTick
    },
    marks: [
      Plot.frame({ stroke: "currentColor", strokeOpacity: 0.12 }),

      Plot.cell(coverage, {
        x: "sys",
        y: "cap",
        fill: (d) => d.v,
        fillOpacity: 0.55,
        stroke: "currentColor",
        strokeOpacity: 0.12,
        tip: true,
        title: (d) =>
          `${d.sys}\n${d.cap}\nCoverage: ${Math.round(d.v * 100)}%\n${d.note}`
      }),

      Plot.text(coverage, {
        x: "sys",
        y: "cap",
        text: (d) => (d.v >= 0.95 ? "✓" : d.v <= 0.15 ? "—" : ""),
        fill: "currentColor",
        fillOpacity: 0.78,
        fontWeight: 900
      })
    ]
  });
}


/* =========================================================
   Mount charts where slots exist
   ========================================================= */
mountPlot(document.getElementById("viz-drivers"), driversChart);
mountPlot(document.getElementById("viz-inflection"), inflectionChart);
mountPlot(document.getElementById("viz-segments"), segmentsChart);
mountPlot(document.getElementById("viz-buying"), buyingChart);
mountPlot(document.getElementById("viz-gaps"), gapsChart);
