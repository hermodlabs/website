const { hostname, pathname } = window.location;

const isGithubPages = hostname.endsWith("github.io");
const firstSegment = pathname.split("/").filter(Boolean)[0];
const base = isGithubPages && firstSegment ? `/${firstSegment}/` : `/`;

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
