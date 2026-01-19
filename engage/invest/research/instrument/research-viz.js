// research-viz.js
import * as Plot from "@observablehq/plot";

// Tiny helper: render only if the container exists
function mount(id, figure) {
  const el = document.querySelector(id);
  if (!el) return;
  el.innerHTML = "";
  el.appendChild(figure);
}

// --------------------
// Drivers (qual scores)
// --------------------
const drivers = [
  { key: "Preservation", score: 5 },
  { key: "Standards", score: 4 },
  { key: "Insurance", score: 4 },
  { key: "Climate", score: 3.5 },
  { key: "IoT", score: 3 },
  { key: "Efficiency", score: 2.5 }
];

mount("#viz-drivers",
  Plot.plot({
    height: 220,
    marginLeft: 110,
    x: { domain: [0, 5], label: "Pressure (1–5)" },
    y: { label: null },
    marks: [
      Plot.ruleX([0]),
      Plot.barX(drivers, { x: "score", y: "key" }),
      Plot.text(drivers, { x: "score", y: "key", text: d => d.score.toFixed(1), dx: 8, textAnchor: "start" })
    ]
  })
);

// --------------------
// TAM/SAM/SOM envelope
// --------------------
const segments = [
  { metric: "Global TAM", year: "2025", value: 0.3 },
  { metric: "Global TAM", year: "2030", value: 1.25 },
  { metric: "Global TAM", year: "2035", value: 4.0 },

  { metric: "NA/EU SAM", year: "2025", value: 0.1 },
  { metric: "NA/EU SAM", year: "2030", value: 1.0 },
  { metric: "NA/EU SAM", year: "2035", value: 1.75 },

  // SOM plotted on same axis as a visual cue; it’s revenue, not market size (label in page copy).
  { metric: "SOM (Revenue)", year: "2030", value: 0.0225 },
  { metric: "SOM (Revenue)", year: "2035", value: 0.0875 }
];

mount("#viz-segments",
  Plot.plot({
    height: 260,
    marginLeft: 110,
    x: { label: "Year" },
    y: { label: "USD (Billions, approx.)" },
    color: { legend: true },
    marks: [
      Plot.ruleY([0]),
      Plot.line(segments.filter(d => d.metric !== "SOM (Revenue)"), { x: "year", y: "value", stroke: "metric" }),
      Plot.dot(segments.filter(d => d.metric !== "SOM (Revenue)"), { x: "year", y: "value", stroke: "metric" }),
      Plot.dot(segments.filter(d => d.metric === "SOM (Revenue)"), { x: "year", y: "value", stroke: "metric" })
    ]
  })
);

// --------------------
// Buying triggers
// --------------------
const buying = [
  { key: "Incident", score: 5 },
  { key: "Insurance", score: 4 },
  { key: "Loan", score: 4 },
  { key: "Efficiency", score: 2.5 }
];

mount("#viz-buying",
  Plot.plot({
    height: 200,
    marginLeft: 110,
    x: { domain: [0, 5], label: "Pressure (1–5)" },
    y: { label: null },
    marks: [
      Plot.ruleX([0]),
      Plot.barX(buying, { x: "score", y: "key" }),
      Plot.text(buying, { x: "score", y: "key", text: d => d.score.toFixed(1), dx: 8, textAnchor: "start" })
    ]
  })
);
