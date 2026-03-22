/* =============================================
   HELLION NEWTAB — onboarding.js
   Mehrstufiger Willkommens-Flow beim ersten Start
   ============================================= */

const Onboarding = {
  currentSlide: 0,

  slides: [
    {
      hero: '\u2B21',
      titleKey: 'onboarding.s1.title',
      textKey: 'onboarding.s1.text'
    },
    {
      hero: '\uD83D\uDCCB',
      titleKey: 'onboarding.s2.title',
      featureKeys: ['onboarding.s2.f1', 'onboarding.s2.f2', 'onboarding.s2.f3', 'onboarding.s2.f4']
    },
    {
      hero: '\uD83C\uDFA8',
      titleKey: 'onboarding.s3.title',
      textKey: 'onboarding.s3.text',
      showThemes: true
    },
    {
      hero: '\uD83E\uDDF0',
      titleKey: 'onboarding.s4.title',
      featureKeys: ['onboarding.s4.f1', 'onboarding.s4.f2', 'onboarding.s4.f3', 'onboarding.s4.f4', 'onboarding.s4.f5', 'onboarding.s4.f6']
    },
    {
      hero: '\uD83D\uDEE1\uFE0F',
      titleKey: 'onboarding.s5.title',
      textKey: 'onboarding.s5.text'
    },
    {
      hero: '\uD83C\uDFAE',
      titleKey: 'onboarding.s6.title',
      textKey: 'onboarding.s6.text',
      interactive: 'gaming-board'
    },
    {
      hero: '\uD83D\uDE80',
      titleKey: 'onboarding.s7.title',
      textKey: 'onboarding.s7.text'
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
      skip.textContent = t('onboarding.skip');
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
    title.textContent = t(slide.titleKey);
    slideEl.appendChild(title);

    if (slide.textKey) {
      const text = document.createElement('div');
      text.className = 'onboarding-text';
      text.textContent = t(slide.textKey);
      slideEl.appendChild(text);
    }

    if (slide.featureKeys) {
      const list = document.createElement('ul');
      list.className = 'onboarding-feature-list';
      slide.featureKeys.forEach(key => {
        const li = document.createElement('li');
        li.textContent = t(key);
        list.appendChild(li);
      });
      slideEl.appendChild(list);
    }

    if (slide.showThemes) {
      const grid = document.createElement('div');
      grid.className = 'onboarding-theme-grid';
      const themeNames = ['Nebula', 'Crescent', 'Event Horizon', 'Merchantman', 'Julia & Jin', 'SC Sunset', 'Hellion HUD', 'Hellion Energy', 'Satisfactory', 'Avorion', 'Hellion Stealth'];
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
      backBtn.textContent = t('onboarding.back');
      backBtn.addEventListener('click', () => {
        this.currentSlide--;
        this._render();
      });
      nav.appendChild(backBtn);
    }

    if (slide.interactive === 'gaming-board') {
      // Interaktive Slide: Zwei Buttons statt "Weiter"
      const noBtn = document.createElement('button');
      noBtn.className = 'btn-secondary';
      noBtn.textContent = t('onboarding.no');
      noBtn.addEventListener('click', () => {
        this.currentSlide++;
        this._render();
      });

      const yesBtn = document.createElement('button');
      yesBtn.className = 'btn-primary';
      yesBtn.textContent = t('onboarding.yes');
      yesBtn.addEventListener('click', async () => {
        await this._createGamingBoard();
        this.currentSlide++;
        this._render();
      });

      nav.append(noBtn, yesBtn);
    } else if (isLast) {
      const startBtn = document.createElement('button');
      startBtn.className = 'btn-primary';
      startBtn.textContent = t('onboarding.start');
      startBtn.addEventListener('click', () => this._finish());
      nav.appendChild(startBtn);
    } else {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn-primary';
      nextBtn.textContent = t('onboarding.next');
      nextBtn.addEventListener('click', () => {
        this.currentSlide++;
        this._render();
      });
      nav.appendChild(nextBtn);
    }

    footer.appendChild(nav);
    modal.appendChild(footer);
  },

  /**
   * Gaming Starter Board erstellen
   * Vorbefuelltes Board mit Community-Links fuer Factory/Space Games
   */
  async _createGamingBoard() {
    const gamingBoard = {
      id: uid(),
      title: '\uD83C\uDFAE Gaming',
      bookmarks: [
        { id: uid(), title: 'Satisfactory Wiki', url: 'https://satisfactory.wiki.gg', desc: '' },
        { id: uid(), title: 'Satisfactory Calculator', url: 'https://satisfactorytools.com', desc: '' },
        { id: uid(), title: 'Factorio Wiki', url: 'https://wiki.factorio.com', desc: '' },
        { id: uid(), title: 'Factorio Cheatsheet', url: 'https://factoriocheatsheet.com', desc: '' },
        { id: uid(), title: 'Avorion Wiki', url: 'https://wiki.avorion.net', desc: '' },
        { id: uid(), title: 'Minecraft Wiki', url: 'https://minecraft.wiki', desc: '' },
        { id: uid(), title: 'Modrinth (Mods)', url: 'https://modrinth.com', desc: '' },
        { id: uid(), title: 'Star Citizen Wiki', url: 'https://starcitizen.tools', desc: '' },
        { id: uid(), title: 'UEX Corp (Trading)', url: 'https://uexcorp.space', desc: '' },
        { id: uid(), title: 'Hellion TradeCenter', url: 'https://hellion-initiative.online/tradecenter', desc: 'Trade Center f\u00FCr Star Citizen' }
      ],
      blurred: false
    };

    boards.push(gamingBoard);
    await saveBoards();
    renderBoards();
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
