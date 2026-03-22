/* =============================================
   HELLION NEWTAB — themes.js
   Theme-Definitionen & Anwendungslogik
   ============================================= */

const THEMES = {
  'nebula':          { bg: 'assets/themes/bg-nebula.webp' },
  'crescent':        { bg: 'assets/themes/bg-crescent.webp' },
  'event-horizon':   { bg: 'assets/themes/bg-event-horizon.webp' },
  'merchantman':    { bg: 'assets/themes/bg-merchantman.webp' },
  'julia-jin':      { bg: 'assets/themes/bg-julia-jin.webp' },
  'sc-sunset':      { bg: 'assets/themes/bg-sc-sunset.webp' },
  'hellion-hud':    { bg: 'assets/themes/bg-hellion-hud.webp' },
  'hellion-energy': { bg: 'assets/themes/bg-hellion-energy.webp' },
  'satisfactory':   { bg: 'assets/themes/bg-satisfactory.webp' },
  'avorion':        { bg: 'assets/themes/bg-avorion.webp' },
  'hellion-stealth': { bg: 'assets/themes/bg-scPolaris.webp' }
};

function applyTheme(themeName, skipBgOverride) {
  const theme = THEMES[themeName];
  if (!theme) return;

  document.documentElement.setAttribute('data-theme', themeName);

  if (!skipBgOverride) {
    document.getElementById('bgLayer').style.backgroundImage = `url('${theme.bg}')`;
  }

  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.value === themeName);
  });
}
