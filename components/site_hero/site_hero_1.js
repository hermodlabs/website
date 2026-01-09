// /components/site-hero.js
import { LitElement, html } from "lit";

/**
 * SiteHero
 * - Renders a hero + an embedded 3D demo stage
 * - Includes a “hero-style HUD” overlay (mode/pause/slice + legend + note)
 * - Uses light DOM so your global CSS can keep styling it if desired
 *
 * NOTES
 * - This component dynamically imports Three.js from a CDN by default:
 *   https://unpkg.com/three@0.160.0/build/three.module.js
 *   If you already bundle Three, set `window.THREE` (or modify ensureThree()).
 */
export class SiteHero extends LitElement {
  createRenderRoot() {
    return this; // light DOM
  }

  constructor() {
    super();

    // demo state
    this._mode = "zones"; // "zones" | "average"
    this._paused =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this._sliceFrac = 1.0;

    // three handles
    this._THREE = null;
    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._raf = 0;
    this._ro = null;

    // interaction state
    this._dragging = false;
    this._lastX = 0;
    this._lastY = 0;

    // orbit params
    this._target = null;
    this._theta = Math.PI * 0.92;
    this._phi = Math.PI * 0.30;
    this._radius = 30;

    this._thetaGoal = this._theta;
    this._phiGoal = this._phi;
    this._radiusGoal = this._radius;

    // voxel data
    this._mesh = null;
    this._positions = null;
    this._values = null;
    this._minV = 0;
    this._maxV = 1;
    this._avg = 0;

    // raycast
    this._raycaster = null;
    this._mouse = null;

    // cached DOM
    this._els = {
      stage: null,
      tip: null,
      modeBtn: null,
      modeLabel: null,
      pauseBtn: null,
      pauseLabel: null,
      slice: null,
      sliceVal: null,
    };
  }

  render() {
    return html`
      <section class="hero hero--viz" aria-labelledby="hero-title">
        ${this._renderStyles()}

        <div class="hero__inner hero__inner--viz">
          <div class="hero__copy">
            <h1 class="hero__title" id="hero-title">
              <span>Our 3D humidity-gradient modeling turns "room average" into actionable zones.</span>
              <span>Find hotspots and airflow dead zones</span>
              <span>Stabilize outcomes across runs</span>
              <span>Reduce late-stage surprises</span>
            </h1>

            <p class="hero__lead">
              We verify your signals are comparable before you trust the result.
            </p>

            <p class="hero__note">
              <strong>Early partners lock in pricing.</strong><br />
              Secure your vertical early to keep your options open.
            </p>

            <div class="hero__cta-row">
              <a class="button button--primary" href="/promo/priority_access">Get Priority Access</a>
              <a class="button button--secondary" href="/asset/file/operator_playbook_v_1_0_0.pdf">Read the Whitepaper</a>
            </div>
          </div>

          <div class="hero__viz">
            <div class="heroViz" aria-label="3D humidity field demo">
              <!-- stage -->
              <div class="heroViz__stage" id="stage" aria-label="3D room visualization"></div>

              <!-- HUD overlay (desktop) / becomes normal flow (mobile) -->
              <div class="heroHud" role="region" aria-label="Humidity field demo controls">
                <div class="heroHud__titleRow">
                  <div class="heroHud__title">Humidity field (demo)</div>
                  <div class="heroHud__chip" aria-live="polite">
                    Mode: <span id="modeLabel">Zones</span>
                  </div>
                </div>

                <p class="heroHud__subhead">
                  Our 3D humidity-gradient modeling turns “room average” into actionable zones.
                </p>

                <ul class="heroHud__bullets">
                  <li>Find hotspots and airflow dead zones</li>
                  <li>Stabilize outcomes across runs</li>
                  <li>Reduce late-stage surprises</li>
                </ul>

                <div class="heroHud__row">
                  <button
                    id="modeBtn"
                    class="heroHud__btn"
                    type="button"
                    aria-pressed="false"
                    title="Toggle room-average vs zones"
                  >
                    Toggle mode
                  </button>

                  <button
                    id="pauseBtn"
                    class="heroHud__btn"
                    type="button"
                    aria-pressed="false"
                    title="Pause/Resume rotation"
                  >
                    <span id="pauseLabel">Pause</span>
                  </button>
                </div>

                <div class="heroHud__row heroHud__row--slider">
                  <label class="heroHud__lbl" for="slice">Slice height</label>
                  <input id="slice" class="heroHud__range" type="range" min="0" max="100" value="100" />
                  <span class="heroHud__val"><span id="sliceVal">100</span>%</span>
                </div>

                <div class="heroHud__legend" aria-label="Legend">
                  <div class="heroHud__legendBar" role="img" aria-label="Low to high"></div>
                  <div class="heroHud__legendTicks">
                    <span>Low</span><span>High</span>
                  </div>
                </div>

                <p class="heroHud__note">
                  Drag to orbit • Scroll to zoom • Hover for value • Slice to “see zones”
                </p>
              </div>

              <!-- tooltip -->
              <div id="tip" class="heroViz__tip" role="status" aria-live="polite"></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderStyles() {
    // This style tag is injected into light DOM under this component subtree.
    // Keep it tight + scoped to .hero--viz / .heroViz / .heroHud classes.
    return html`
      <style>
        /* Layout helpers: if you already have hero layout CSS, you can delete these. */
        .hero__inner--viz {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: clamp(18px, 3vw, 34px);
          align-items: start;
        }
        .hero__viz {
          min-width: 0;
        }
        @media (max-width: 980px) {
          .hero__inner--viz {
            grid-template-columns: 1fr;
          }
        }

        /* --- 3D stage wrapper --- */
        .heroViz {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          min-height: clamp(340px, 56vh, 640px);
          background:
            radial-gradient(1100px 700px at 20% 10%, rgba(90,140,255,0.14), transparent 55%),
            radial-gradient(900px 600px at 90% 30%, rgba(0,255,200,0.10), transparent 55%),
            #0b0f16;
        }

        .heroViz__stage {
          width: 100%;
          height: 100%;
          overflow: hidden;
          touch-action: none; /* enables better pointer controls */
        }

        /* tooltip */
        .heroViz__tip {
          position: absolute;
          right: 14px;
          bottom: 14px;
          z-index: 5;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(16, 22, 34, 0.72);
          border: 1px solid rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.9);
          box-shadow: 0 18px 60px rgba(0,0,0,0.55);
          backdrop-filter: blur(10px);
          font-size: 13px;
          font-variant-numeric: tabular-nums;
          max-width: min(520px, calc(100% - 28px));
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 120ms ease, transform 120ms ease;
          pointer-events: none;
        }
        .heroViz__tip.show { opacity: 1; transform: translateY(0); }

        /* --- HUD panel (hero-friendly “glass”) --- */
        .heroHud {
          --hud-bg: rgba(16, 22, 34, 0.78);
          --hud-border: rgba(255, 255, 255, 0.10);
          --hud-text: rgba(255, 255, 255, 0.92);
          --hud-muted: rgba(255, 255, 255, 0.65);
          --hud-shadow: 0 18px 60px rgba(0,0,0,0.55);

          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 6;

          width: min(360px, calc(100% - 28px));
          padding: 14px 14px 12px;

          background: var(--hud-bg);
          border: 1px solid var(--hud-border);
          border-radius: 14px;
          box-shadow: var(--hud-shadow);
          backdrop-filter: blur(10px);

          color: var(--hud-text);
        }

        .heroHud__titleRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .heroHud__title {
          font-weight: 750;
          letter-spacing: 0.2px;
        }

        .heroHud__chip {
          font-size: 12px;
          color: var(--hud-muted);
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          padding: 6px 10px;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .heroHud__subhead {
          margin: 0 0 10px;
          color: var(--hud-text);
          line-height: 1.35;
        }

        .heroHud__bullets {
          margin: 0 0 10px;
          padding-left: 1.1em;
          color: var(--hud-muted);
        }
        .heroHud__bullets li { margin: 4px 0; }

        .heroHud__row {
          display: flex;
          gap: 10px;
          align-items: center;
          margin: 10px 0;
        }

        .heroHud__btn {
          appearance: none;
          border: 1px solid var(--hud-border);
          background: rgba(255,255,255,0.06);
          color: var(--hud-text);
          padding: 8px 10px;
          border-radius: 10px;
          font-weight: 650;
          cursor: pointer;
          transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
        }
        .heroHud__btn:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.18);
        }
        .heroHud__btn:active { transform: translateY(1px); }

        .heroHud__row--slider .heroHud__lbl {
          font-size: 13px;
          color: var(--hud-muted);
          min-width: 86px;
        }

        .heroHud__range { width: 100%; }

        .heroHud__val {
          font-variant-numeric: tabular-nums;
          font-size: 13px;
          color: var(--hud-muted);
          min-width: 52px;
          text-align: right;
        }

        .heroHud__legend {
          margin-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 10px;
        }

        .heroHud__legendBar {
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(90deg,
            #2b6cff 0%,
            #00d4ff 25%,
            #00ff9a 50%,
            #ffe14a 75%,
            #ff4d4d 100%
          );
          border: 1px solid rgba(255,255,255,0.14);
        }

        .heroHud__legendTicks {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 12px;
          color: var(--hud-muted);
        }

        .heroHud__note {
          margin: 10px 0 0;
          font-size: 12px;
          color: var(--hud-muted);
          line-height: 1.35;
        }

        /* responsive: HUD becomes a normal block under the stage */
        @media (max-width: 820px) {
          .heroHud {
            position: static;
            width: 100%;
            margin: 12px 0 0;
            border-radius: 16px;
          }
        }
      </style>
    `;
  }

  async firstUpdated() {
    // Cache elements
    this._els.stage = this.querySelector("#stage");
    this._els.tip = this.querySelector("#tip");
    this._els.modeBtn = this.querySelector("#modeBtn");
    this._els.modeLabel = this.querySelector("#modeLabel");
    this._els.pauseBtn = this.querySelector("#pauseBtn");
    this._els.pauseLabel = this.querySelector("#pauseLabel");
    this._els.slice = this.querySelector("#slice");
    this._els.sliceVal = this.querySelector("#sliceVal");

    // Wire HUD
    this._wireHud();

    // Init Three
    try {
      await this._initThree();
      this._startLoop();
    } catch (err) {
      console.error(err);
      this._showTip("3D demo failed to load.");
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._destroy();
  }

  /* -----------------------------
   * HUD wiring
   * ----------------------------- */
  _wireHud() {
    const { modeBtn, modeLabel, pauseBtn, pauseLabel, slice, sliceVal } = this._els;

    const setMode = (next) => {
      this._mode = next;
      modeLabel.textContent = this._mode === "average" ? "Room average" : "Zones";
      modeBtn.setAttribute("aria-pressed", this._mode === "average" ? "true" : "false");
      this._applyColors();
    };

    const setPaused = (p) => {
      this._paused = p;
      pauseLabel.textContent = this._paused ? "Resume" : "Pause";
      pauseBtn.setAttribute("aria-pressed", this._paused ? "true" : "false");
    };

    const setSlice = (frac) => {
      this._sliceFrac = frac;
      this._applySlice();
    };

    // init labels
    setMode(this._mode);
    setPaused(this._paused);
    sliceVal.textContent = slice.value;

    // listeners
    modeBtn.addEventListener("click", () => setMode(this._mode === "zones" ? "average" : "zones"));
    pauseBtn.addEventListener("click", () => setPaused(!this._paused));
    slice.addEventListener("input", () => {
      sliceVal.textContent = slice.value;
      setSlice(Number(slice.value) / 100);
    });
  }

  /* -----------------------------
   * Three.js boot
   * ----------------------------- */
  async _ensureThree() {
    if (this._THREE) return this._THREE;

    // Prefer existing global THREE if you provide it
    if (typeof window !== "undefined" && window.THREE) {
      this._THREE = window.THREE;
      return this._THREE;
    }

    // Dynamic import of module build (works in modern browsers / bundlers that allow remote import)
    const mod = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
    this._THREE = mod;
    return this._THREE;
  }

  async _initThree() {
    const THREE = await this._ensureThree();
    const stage = this._els.stage;
    if (!stage) throw new Error("Stage element not found.");

    // Scene
    this._scene = new THREE.Scene();
    this._scene.fog = new THREE.Fog(0x0b0f16, 18, 70);

    // Camera
    this._camera = new THREE.PerspectiveCamera(55, 1, 0.1, 240);

    // Renderer
    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.appendChild(this._renderer.domElement);

    // Lights
    this._scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(10, 16, 6);
    this._scene.add(dir);

    // Grid (subtle)
    const grid = new THREE.GridHelper(34, 34, 0x26324a, 0x162033);
    grid.position.y = 0;
    grid.material.opacity = 0.22;
    grid.material.transparent = true;
    this._scene.add(grid);

    // Orbit target
    this._target = new THREE.Vector3(0, 4, 0);

    // Build “TikZ-like room” context
    this._addRoomContext();

    // Build voxel field
    this._addVoxelField();

    // Raycaster
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2(-2, -2);

    // Pointer controls
    this._wirePointerControls();

    // Resize observer
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(stage);
    this._resize();

    // Apply initial states
    this._applyColors();
    this._applySlice();
    this._updateCamera(1);
  }

  _addRoomContext() {
    const THREE = this._THREE;
    const scene = this._scene;

    // room dims roughly like your TikZ snippet (scaled to fit our world)
    const room = { Lx: 16, Lz: 12, H: 11, inset: 1.4 };
    const centerY = room.H * 0.5;

    // wireframe
    const roomGeom = new THREE.BoxGeometry(room.Lx, room.H, room.Lz);
    const roomEdges = new THREE.EdgesGeometry(roomGeom);
    const roomLines = new THREE.LineSegments(
      roomEdges,
      new THREE.LineBasicMaterial({ color: 0x2b3b5a, transparent: true, opacity: 0.60 })
    );
    roomLines.position.set(0, centerY, 0);
    scene.add(roomLines);

    // faint roof panel
    const roof = new THREE.Mesh(
      new THREE.PlaneGeometry(room.Lx, room.Lz),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, side: THREE.DoubleSide })
    );
    roof.rotation.x = -Math.PI / 2;
    roof.position.set(0, room.H, 0);
    scene.add(roof);

    // speaker markers (6 overhead: corners + 2 midpoints)
    const speakerMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.0, color: 0xe6e6e6 });
    const speakerGeom = new THREE.BoxGeometry(0.8, 0.22, 0.8);

    const X = (t) => (t - 0.5) * room.Lx;
    const Z = (t) => (t - 0.5) * room.Lz;

    const speakers = [
      new THREE.Vector3(X(0), room.H, Z(0)),
      new THREE.Vector3(X(1), room.H, Z(0)),
      new THREE.Vector3(X(1), room.H, Z(1)),
      new THREE.Vector3(X(0), room.H, Z(1)),
      new THREE.Vector3(X(0.5), room.H, Z(0)),
      new THREE.Vector3(X(0.5), room.H, Z(1)),
    ];

    speakers.forEach((p) => {
      const m = new THREE.Mesh(speakerGeom, speakerMat);
      m.position.copy(p);
      scene.add(m);

      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, -1, 0),
        p.clone().add(new THREE.Vector3(0, -0.35, 0)),
        1.3,
        0xffffff,
        0.35,
        0.22
      );
      arrow.line.material.transparent = true;
      arrow.line.material.opacity = 0.55;
      scene.add(arrow);
    });

    // mic markers (3 layers x 6 points)
    const micGeom = new THREE.SphereGeometry(0.22, 12, 12);
    const micMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.0, color: 0x111111 });

    const layers = [
      { y: 2.4, tag: "L" },
      { y: 6.2, tag: "M" },
      { y: 9.3, tag: "H" },
    ];

    const xi = room.Lx * 0.5 - room.inset;
    const zi = room.Lz * 0.5 - room.inset;

    const ringPoints = (y) => [
      new THREE.Vector3(-xi, y, -zi),
      new THREE.Vector3(+xi, y, -zi),
      new THREE.Vector3(+xi, y, +zi),
      new THREE.Vector3(-xi, y, +zi),
      new THREE.Vector3(0,   y, -zi),
      new THREE.Vector3(0,   y, +zi),
    ];

    const micPts = [];
    layers.forEach(({ y }) => micPts.push(...ringPoints(y)));

    micPts.forEach((p) => {
      const m = new THREE.Mesh(micGeom, micMat);
      m.position.copy(p);
      scene.add(m);
    });

    // faint rays (a few)
    const rayMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
    const ray = (a, b) => {
      const g = new THREE.BufferGeometry().setFromPoints([a, b]);
      scene.add(new THREE.Line(g, rayMat));
    };

    // representative links
    ray(speakers[0], micPts[1]);
    ray(speakers[1], micPts[10]);
    ray(speakers[2], micPts[12]);
    ray(speakers[3], micPts[17]);
    ray(speakers[4], micPts[8]);
    ray(speakers[5], micPts[5]);

    // aim orbit target at center of volume
    this._target.set(0, room.H * 0.45, 0);
  }

  _addVoxelField() {
    const THREE = this._THREE;
    const scene = this._scene;

    // Voxel field (instanced)
    const NX = 18, NY = 10, NZ = 14;
    const spacing = 0.8;
    const baseY = 0.6;
    const total = NX * NY * NZ;

    const geom = new THREE.BoxGeometry(0.62, 0.62, 0.62);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.55,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
    });

    const mesh = new THREE.InstancedMesh(geom, mat, total);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(total * 3), 3);

    const group = new THREE.Group();
    group.add(mesh);
    scene.add(group);

    const origin = new THREE.Vector3(
      -(NX - 1) * spacing * 0.5,
      baseY,
      -(NZ - 1) * spacing * 0.5
    );

    // bounding box helper (subtle)
    const box = new THREE.Box3(
      new THREE.Vector3(origin.x, origin.y, origin.z),
      new THREE.Vector3(
        origin.x + (NX - 1) * spacing,
        origin.y + (NY - 1) * spacing,
        origin.z + (NZ - 1) * spacing
      )
    );
    const boxHelper = new THREE.Box3Helper(box, 0x2b3b5a);
    boxHelper.material.transparent = true;
    boxHelper.material.opacity = 0.35;
    scene.add(boxHelper);

    function gaussian3(x, y, z, cx, cy, cz, s) {
      const dx = x - cx, dy = y - cy, dz = z - cz;
      return Math.exp(-(dx*dx + dy*dy + dz*dz) / (2 * s * s));
    }

    const values = new Float32Array(total);
    const positions = new Array(total);

    let minV = Infinity, maxV = -Infinity;
    let idx = 0;

    for (let ix = 0; ix < NX; ix++) {
      for (let iy = 0; iy < NY; iy++) {
        for (let iz = 0; iz < NZ; iz++) {
          const x = origin.x + ix * spacing;
          const y = origin.y + iy * spacing;
          const z = origin.z + iz * spacing;

          let v =
            0.35 +
            0.18 * (ix / (NX - 1)) +
            0.22 * (1 - iy / (NY - 1)) +
            0.12 * (iz / (NZ - 1));

          // hotspots + dead-zone pocket
          v += 0.55 * gaussian3(x, y, z, origin.x + 4.2,  origin.y + 2.4, origin.z + 2.8, 1.35);
          v += 0.42 * gaussian3(x, y, z, origin.x + 10.0, origin.y + 1.0, origin.z + 8.6, 1.15);
          v += 0.50 * gaussian3(x, y, z, origin.x + 12.8, origin.y + 5.2, origin.z + 4.2, 1.6);

          // structured noise
          v += 0.03 * Math.sin(ix * 0.9) * Math.cos(iz * 0.7) + 0.02 * Math.sin(iy * 1.4);

          values[idx] = v;
          positions[idx] = { ix, iy, iz, x, y, z };

          if (v < minV) minV = v;
          if (v > maxV) maxV = v;

          idx++;
        }
      }
    }

    // average baseline
    let avg = 0;
    for (let i = 0; i < total; i++) avg += values[i];
    avg /= total;

    // place instances once
    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const p = positions[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // stash
    this._mesh = mesh;
    this._positions = positions;
    this._values = values;
    this._minV = minV;
    this._maxV = maxV;
    this._avg = avg;

    // store field dims needed by slicer
    this._field = { NX, NY, NZ, spacing, baseY, total, dummy };
  }

  _wirePointerControls() {
    const THREE = this._THREE;
    const el = this._renderer.domElement;

    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

    el.addEventListener("pointerdown", (e) => {
      this._dragging = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
    });

    el.addEventListener("pointermove", (e) => {
      // hover coords
      const r = el.getBoundingClientRect();
      this._mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      this._mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);

      if (!this._dragging) return;

      const dx = e.clientX - this._lastX;
      const dy = e.clientY - this._lastY;
      this._lastX = e.clientX;
      this._lastY = e.clientY;

      this._thetaGoal -= dx * 0.006;
      this._phiGoal -= dy * 0.006;
      this._phiGoal = clamp(this._phiGoal, 0.15, Math.PI - 0.15);
    });

    el.addEventListener("pointerup", (e) => {
      this._dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
    });

    el.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        this._radiusGoal *= delta > 0 ? 1.08 : 0.92;
        this._radiusGoal = clamp(this._radiusGoal, 12, 70);
      },
      { passive: false }
    );

    el.addEventListener("pointerleave", () => {
      this._mouse.x = -2;
      this._mouse.y = -2;
      this._hideTip();
    });
  }

  _resize() {
    if (!this._renderer || !this._camera || !this._els.stage) return;

    const stage = this._els.stage;
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || 400;

    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h, false);
  }

  _updateCamera(k = 0.12) {
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

    this._theta += (this._thetaGoal - this._theta) * k;
    this._phi += (this._phiGoal - this._phi) * k;
    this._radius += (this._radiusGoal - this._radius) * k;

    this._phi = clamp(this._phi, 0.15, Math.PI - 0.15);
    this._radius = clamp(this._radius, 12, 70);

    const sinPhi = Math.sin(this._phi);
    const x = this._radius * sinPhi * Math.cos(this._theta);
    const z = this._radius * sinPhi * Math.sin(this._theta);
    const y = this._radius * Math.cos(this._phi);

    this._camera.position.set(
      this._target.x + x,
      this._target.y + y,
      this._target.z + z
    );
    this._camera.lookAt(this._target);
  }

  /* -----------------------------
   * Color + slice behavior
   * ----------------------------- */
  _norm(v) {
    const den = (this._maxV - this._minV) || 1;
    return (v - this._minV) / den;
  }

  _clamp01(t) {
    return Math.max(0, Math.min(1, t));
  }

  _colorFromT(t) {
    const THREE = this._THREE;
    t = this._clamp01(t);

    const stops = [
      { t: 0.00, c: new THREE.Color("#2b6cff") },
      { t: 0.25, c: new THREE.Color("#00d4ff") },
      { t: 0.50, c: new THREE.Color("#00ff9a") },
      { t: 0.75, c: new THREE.Color("#ffe14a") },
      { t: 1.00, c: new THREE.Color("#ff4d4d") },
    ];

    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1];
      if (t >= a.t && t <= b.t) {
        const u = (t - a.t) / ((b.t - a.t) || 1);
        return a.c.clone().lerp(b.c, u);
      }
    }
    return stops[stops.length - 1].c.clone();
  }

  _applyColors() {
    if (!this._mesh || !this._values) return;

    const total = this._field.total;
    const avgT = this._norm(this._avg);

    for (let i = 0; i < total; i++) {
      const t = this._mode === "average" ? avgT : this._norm(this._values[i]);
      this._mesh.setColorAt(i, this._colorFromT(t));
    }
    this._mesh.instanceColor.needsUpdate = true;
  }

  _applySlice() {
    if (!this._mesh || !this._positions) return;

    const { NY, total, dummy } = this._field;
    const maxYIndex = Math.floor((NY - 1) * this._sliceFrac + 1e-6);

    for (let i = 0; i < total; i++) {
      const p = this._positions[i];
      dummy.position.set(p.x, p.y, p.z);
      const on = p.iy <= maxYIndex;
      dummy.scale.set(on ? 1 : 0.001, on ? 1 : 0.001, on ? 1 : 0.001);
      dummy.updateMatrix();
      this._mesh.setMatrixAt(i, dummy.matrix);
    }
    this._mesh.instanceMatrix.needsUpdate = true;
  }

  /* -----------------------------
   * Loop + tooltip
   * ----------------------------- */
  _startLoop() {
    const THREE = this._THREE;
    const clock = new THREE.Clock();

    const tick = () => {
      this._raf = requestAnimationFrame(tick);

      const dt = clock.getDelta();

      // auto-rotate (calm)
      if (!this._paused && !this._dragging) {
        this._thetaGoal += dt * 0.18;
      }

      this._updateCamera();

      // hover tooltip (raycast instanced mesh)
      if (this._raycaster && this._mouse && this._camera && this._mesh) {
        this._raycaster.setFromCamera(this._mouse, this._camera);
        const hits = this._raycaster.intersectObject(this._mesh, false);

        if (hits.length) {
          const hit = hits[0];
          const i = hit.instanceId;
          if (i != null) {
            const { NY } = this._field;
            const maxYIndex = Math.floor((NY - 1) * this._sliceFrac + 1e-6);
            const p = this._positions[i];
            if (p && p.iy <= maxYIndex) {
              const v = this._mode === "average" ? this._avg : this._values[i];
              this._showTip(
                `Voxel [x=${p.ix}, y=${p.iy}, z=${p.iz}] • value=${v.toFixed(3)} • mode=${this._mode === "average" ? "avg" : "zones"}`
              );
            } else {
              this._hideTip();
            }
          }
        } else {
          this._hideTip();
        }
      }

      this._renderer.render(this._scene, this._camera);
    };

    tick();
  }

  _showTip(text) {
    const tip = this._els.tip;
    if (!tip) return;
    tip.textContent = text;
    tip.classList.add("show");
  }

  _hideTip() {
    const tip = this._els.tip;
    if (!tip) return;
    tip.classList.remove("show");
  }

  /* -----------------------------
   * Cleanup
   * ----------------------------- */
  _destroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;

    if (this._ro && this._els.stage) {
      try { this._ro.disconnect(); } catch (_) {}
    }
    this._ro = null;

    // dispose renderer + remove canvas
    if (this._renderer) {
      try {
        this._renderer.dispose?.();
      } catch (_) {}
      try {
        const canvas = this._renderer.domElement;
        canvas?.parentNode?.removeChild(canvas);
      } catch (_) {}
    }

    this._renderer = null;
    this._scene = null;
    this._camera = null;
    this._mesh = null;
    this._positions = null;
    this._values = null;
    this._raycaster = null;
    this._mouse = null;
  }
}

customElements.define("site-hero", SiteHero);
