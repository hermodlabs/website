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
  window.matchMedia('(min-width: 1101px)').addEventListener('change', () => setMenu(false));
}
