/* =============================================
   HELLION NEWTAB — themes.js
   Theme-Definitionen & Anwendungslogik
   ============================================= */

const THEMES = {
  'nebula':          { bg: 'assets/themes/bg-nebula.jpg' },
  'crescent':        { bg: 'assets/themes/bg-crescent.jpg' },
  'event-horizon':   { bg: 'assets/themes/bg-event-horizon.jpg' },
  'merchantman':    { bg: 'assets/themes/bg-merchantman.webp' },
  'julia-jin':      { bg: 'assets/themes/bg-julia-jin.png' },
  'sc-sunset':      { bg: 'assets/themes/bg-sc-sunset.jpg' },
  'hellion-hud':    { bg: 'assets/themes/bg-hellion-hud.png' },
  'hellion-energy': { bg: 'assets/themes/bg-hellion-energy.jpg' }
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
