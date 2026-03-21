/* =============================================
   HELLION NEWTAB — onboarding.js
   Mehrstufiger Willkommens-Flow beim ersten Start
   ============================================= */

const Onboarding = {
  currentSlide: 0,

  slides: [
    {
      hero: '\u2B21',
      title: 'Willkommen bei Hellion Dashboard',
      text: 'Dein neuer Browser-Startbildschirm. Minimalistisch, schnell und vollst\u00E4ndig lokal \u2014 keine Cloud, kein Account, keine Datensammlung.'
    },
    {
      hero: '\uD83D\uDCCB',
      title: 'Boards & Bookmarks',
      features: [
        'Erstelle Boards mit dem \u201E+ Board\u201C Button oben',
        'Importiere Browser-Lesezeichen \u00FCber den \u201EImport\u201C Button im Header',
        'Drag & Drop zum Umsortieren von Boards und Links',
        'Blur-Modus f\u00FCr private Boards (\uD83D\uDD12 Icon)'
      ]
    },
    {
      hero: '\uD83C\uDFA8',
      title: '8 handgefertigte Themes',
      text: 'Klicke auf den „Theme" Button im Header um dein Theme zu wählen. Jedes hat seinen eigenen Stil und Farbpalette.',
      showThemes: true
    },
    {
      hero: '\u26A1',
      title: 'Weitere Features',
      features: [
        'Suchleiste mit Google, DuckDuckGo oder Bing',
        'Sticky Notes f\u00FCr schnelle Notizen',
        'Funktioniert komplett offline \u2014 alles lokal gespeichert'
      ]
    },
    {
      hero: '\uD83D\uDEE1\uFE0F',
      title: 'Backups nicht vergessen!',
      text: 'Deine Daten sind lokal im Browser gespeichert. Wenn du Browserdaten l\u00F6schst, gehen sie verloren! Sichere regelm\u00E4\u00DFig \u00FCber Settings \u2192 Data \u2192 Export. Wir erinnern dich alle 7 Tage daran.'
    },
    {
      hero: '\uD83D\uDE80',
      title: 'Bereit!',
      text: 'Klicke auf \u201E+ Board\u201C um dein erstes Board zu erstellen, oder nutze den \u201EImport\u201C Button im Header um deine Browser-Lesezeichen zu importieren.'
    }
  ],

  /** Startet das Onboarding */
  start() {
    this.currentSlide = 0;
    this._render();
    this._bindKeyboard();
    const overlay = document.getElementById('onboardingOverlay');
    requestAnimationFrame(() => overlay.classList.add('active'));
  },

  /** Schlie\u00DFt das Onboarding und speichert den Status */
  async _finish() {
    const overlay = document.getElementById('onboardingOverlay');
    overlay.classList.remove('active');
    document.removeEventListener('keydown', this._keyHandler);
    await Store.set('onboardingDone', true);
  },

  /** Rendert den aktuellen Slide */
  _render() {
    const modal = document.getElementById('onboardingModal');
    modal.replaceChildren();

    const slide = this.slides[this.currentSlide];
    const isLast = this.currentSlide === this.slides.length - 1;

    // Skip-Button (nicht auf letztem Slide)
    if (!isLast) {
      const skip = document.createElement('button');
      skip.className = 'onboarding-skip';
      skip.textContent = '\u00DCberspringen';
      skip.addEventListener('click', () => this._finish());
      modal.appendChild(skip);
    }

    // Slide-Content
    const slideEl = document.createElement('div');
    slideEl.className = 'onboarding-slide';

    const hero = document.createElement('div');
    hero.className = 'onboarding-hero';
    hero.textContent = slide.hero;
    slideEl.appendChild(hero);

    const title = document.createElement('div');
    title.className = 'onboarding-title';
    title.textContent = slide.title;
    slideEl.appendChild(title);

    if (slide.text) {
      const text = document.createElement('div');
      text.className = 'onboarding-text';
      text.textContent = slide.text;
      slideEl.appendChild(text);
    }

    if (slide.features) {
      const list = document.createElement('ul');
      list.className = 'onboarding-feature-list';
      slide.features.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        list.appendChild(li);
      });
      slideEl.appendChild(list);
    }

    if (slide.showThemes) {
      const grid = document.createElement('div');
      grid.className = 'onboarding-theme-grid';
      const themeNames = ['Nebula', 'Crescent', 'Event Horizon', 'Merchantman', 'Julia & Jin', 'SC Sunset', 'Hellion HUD', 'Hellion Energy'];
      themeNames.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'onboarding-theme-chip';
        chip.textContent = name;
        grid.appendChild(chip);
      });
      slideEl.appendChild(grid);
    }

    modal.appendChild(slideEl);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'onboarding-footer';

    // Dots
    const dots = document.createElement('div');
    dots.className = 'onboarding-dots';
    for (let i = 0; i < this.slides.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'onboarding-dot' + (i === this.currentSlide ? ' active' : '');
      dots.appendChild(dot);
    }
    footer.appendChild(dots);

    // Navigation
    const nav = document.createElement('div');
    nav.className = 'onboarding-nav';

    if (this.currentSlide > 0) {
      const backBtn = document.createElement('button');
      backBtn.className = 'btn-secondary';
      backBtn.textContent = 'Zur\u00FCck';
      backBtn.addEventListener('click', () => {
        this.currentSlide--;
        this._render();
      });
      nav.appendChild(backBtn);
    }

    if (isLast) {
      const startBtn = document.createElement('button');
      startBtn.className = 'btn-primary';
      startBtn.textContent = 'Los geht\u2019s!';
      startBtn.addEventListener('click', () => this._finish());
      nav.appendChild(startBtn);
    } else {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn-primary';
      nextBtn.textContent = 'Weiter';
      nextBtn.addEventListener('click', () => {
        this.currentSlide++;
        this._render();
      });
      nav.appendChild(nextBtn);
    }

    footer.appendChild(nav);
    modal.appendChild(footer);
  },

  /** Keyboard-Navigation */
  _bindKeyboard() {
    this._keyHandler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (this.currentSlide < this.slides.length - 1) {
          this.currentSlide++;
          this._render();
        } else {
          this._finish();
        }
      }
      if (e.key === 'ArrowLeft' && this.currentSlide > 0) {
        e.preventDefault();
        this.currentSlide--;
        this._render();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this._finish();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }
};
