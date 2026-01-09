// bootstrap.js

import "./components/patent_credentials/patent_credentials.js";
import "./components/cannabis_market_proof/cannabis_market_proof.js";



function getDeployBase() {
  // Optional manual override:
  // <meta name="app-base" content="/my-repo/" />
  const meta = document.querySelector('meta[name="app-base"]')?.getAttribute("content");
  if (meta) return meta.endsWith("/") ? meta : meta + "/";

  const { hostname, pathname } = window.location;
  const isGithubPages = hostname.endsWith("github.io");
  const firstSegment = pathname.split("/").filter(Boolean)[0]; // repo name on repo pages

  return isGithubPages && firstSegment ? `/${firstSegment}/` : `/`;
}

function rewriteHrefForBase(href, base) {
  if (!href) return href;

  const lower = href.toLowerCase();
  if (
    href.startsWith("#") ||
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("javascript:")
  ) {
    return href;
  }

  const b = base.endsWith("/") ? base : base + "/";
  if (href.startsWith(b)) return href;

  // Only rewrite root-absolute paths
  if (href.startsWith("/")) return b + href.slice(1);

  // Relative paths already work
  return href;
}

function patchAnchors(root, base) {
  const scope = root instanceof Element ? root : document;
  const anchors = scope.querySelectorAll("a[href]");
  for (const a of anchors) {
    const raw = a.getAttribute("href"); // keep original, not resolved
    const next = rewriteHrefForBase(raw, base);
    if (next !== raw) a.setAttribute("href", next);
  }
}

const base = getDeployBase();

// Patch existing anchors now
patchAnchors(document, base);

// Patch anchors added later (web components, templates, client routing, etc.)
const obs = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches?.("a[href]")) {
        patchAnchors(node, base);
      } else {
        patchAnchors(node, base);
      }
    }
  }
});

obs.observe(document.documentElement, { childList: true, subtree: true });

const { hostname, pathname } = window.location;

const isGithubPages = hostname.endsWith("github.io");
const firstSegment = pathname.split("/").filter(Boolean)[0];
//const base = isGithubPages && firstSegment ? `/${firstSegment}/` : `/`;

// CSS
const css = document.getElementById("main-css");
if (css) css.href = `${base}css/main.css`;

// Load modules (order preserved)
const loadModule = (src) =>
  new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = `${base}${src}`;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });

await loadModule("components/site_page/site_page.js");
await loadModule("components/site_header/site_header.js");
await loadModule("components/site_footer/site_footer.js");

await loadModule("components/site_hero/site_hero.js");
await loadModule("components/social_proof/social_proof.js");
await loadModule("components/site_about/site_about.js");
await loadModule("components/event_invite/event_invite.js");
await loadModule("components/bloglist/bloglist.js");
