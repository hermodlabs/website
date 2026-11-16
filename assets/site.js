// Classic scripts keep runtime configuration available on file:// previews too.
const decisionLabLocation = window.HERMOD_FEATURE_FLAGS?.decisionLabUrl;
document.querySelectorAll('[data-decision-lab-link]').forEach((link) => {
  if (typeof decisionLabLocation !== 'string' || !decisionLabLocation.trim()) return;
  try {
    const siteRoot = new URL(link.dataset.siteRoot, document.baseURI);
    const location = decisionLabLocation.trim();
    // Resolve site-relative paths within the deployment, including subpaths.
    const target = new URL(location.startsWith('/') && !location.startsWith('//') ? `.${location}` : location, siteRoot);
    if (!['https:', 'http:'].includes(target.protocol)
      && !(siteRoot.protocol === 'file:' && target.protocol === 'file:')) return;
    if (target.protocol === 'file:' && target.pathname.endsWith('/')) target.pathname += 'index.html';
    link.href = target.href;
    link.hidden = false;
  } catch {
    // No alternate destination: only a valid configured app URL enables links.
  }
});

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

if (menuButton && navigation) {
  document.documentElement.classList.add('has-js');
  menuButton.hidden = false;

  const setMenu = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('span').textContent = open ? '−' : '+';
    navigation.classList.toggle('is-open', open);
  };

  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  window.matchMedia('(min-width: 1201px)').addEventListener('change', () => setMenu(false));
}

// Native disclosures remain expanded without JavaScript. On smaller screens,
// readers can open a compact outline without losing meaningful chapter titles.
const readerDisclosures = [...document.querySelectorAll('.reader-nav-disclosure')];
const compactReader = window.matchMedia('(max-width: 900px)');
const setReaderNavigation = () => {
  readerDisclosures.forEach(details => { details.open = !compactReader.matches; });
};
setReaderNavigation();
compactReader.addEventListener('change', setReaderNavigation);
readerDisclosures.forEach(details => {
  details.addEventListener('click', event => {
    if (compactReader.matches && event.target.closest('a[href^="#"]')) details.open = false;
  });
});

// A viewport threshold misses narrow columns beside navigation. Measure each
// scroll region instead, and recheck when images, formulas, or layout resize.
const scrollRegions = document.querySelectorAll('.gantt-scroll, .article-table-scroll, .blog-table-scroll, .blog-figure-scroll, .blog-equation, .model-chart-scroll, .ontology-graph-scroll, .table-scroll');
scrollRegions.forEach((region, index) => {
  const existingHint = region.nextElementSibling;
  let hint = existingHint?.matches('.gantt-scroll-hint, .blog-figure-hint, .model-chart-hint, .ontology-scroll-hint') ? existingHint : null;
  if (!hint) {
    hint = document.createElement('p');
    hint.textContent = region.matches('.blog-equation') ? 'Scroll to view the full formula ↔' : 'Scroll to view the full table ↔';
    region.after(hint);
  }
  hint.classList.add('scroll-hint');
  if (!hint.id) hint.id = `scroll-hint-${index + 1}`;
  hint.removeAttribute('aria-hidden');
  const describedBy = new Set((region.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  describedBy.add(hint.id);
  region.setAttribute('aria-describedby', [...describedBy].join(' '));
  const update = () => { hint.hidden = region.scrollWidth <= region.clientWidth + 1; };
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(update);
    observer.observe(region);
    [...region.children].forEach(child => observer.observe(child));
  } else {
    window.addEventListener('resize', update);
  }
  region.querySelectorAll('img').forEach(img => img.addEventListener('load', update));
  document.fonts?.ready.then(update);
  update();
});
