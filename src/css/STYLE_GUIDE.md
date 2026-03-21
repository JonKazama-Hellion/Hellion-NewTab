# ⬡ Hellion Dashboard — Design & Theme-System

Leitfaden für das visuelle Design des Hellion Dashboards. Definiert wie Themes aufgebaut
sind und welche Patterns konsistent eingehalten werden — für eine immersive, fokussierte
Nutzererfahrung.

---

## Design-Säulen

| Säule | Beschreibung |
|---|---|
| **Immersion** | Das Interface wirkt wie ein HUD das über der Szenerie schwebt — kein Fremdkörper |
| **Visual Clarity** | Gezielter `blur`-Einsatz trennt UI und Hintergrundbild — reduziert Reizüberflutung |
| **Harmonie** | Jedes Theme zieht seine Farben aus den dominanten Lichtquellen des Hintergrundbildes |

---

## Anatomie eines Themes

Jedes Theme folgt dieser Variablen-Struktur in `main.css`.
Für ein neues Theme diesen Block kopieren und anpassen:

```css
[data-theme="dein-theme-name"] {
  /* 1. AKZENTE — Die Lichtquelle */
  --accent:          #HEXCODE;             /* Hauptfarbe (Neon/Licht) */
  --accent-dim:      rgba(R, G, B, 0.12);  /* Subtiler Hintergrund */
  --accent-glow:     rgba(R, G, B, 0.08);  /* Glow für Logo & Uhr */
  --border-accent:   rgba(R, G, B, 0.25);  /* Fokus-Rahmen */

  /* 2. BASIS — Das Fundament */
  --bg-primary:      #HEXCODE;             /* Dunkelster Punkt im Bild */
  --bg-board:        rgba(R, G, B, 0.55);  /* Glas-Effekt der Boards */

  /* 3. TEXT — Kontrast */
  --text-primary:    #FFFFFF;              /* Klar lesbar, leicht getönt */
  --text-secondary:  #A0A0A0;             /* Entsättigt für weniger Rauschen */

  /* 4. OVERLAY — Vignette */
  --overlay-bg: radial-gradient(
    circle at center,
    transparent 0%,
    var(--bg-primary) 100%
  );
}
```

---

## UI-Patterns

### Frosted Glass

Hardware-beschleunigter Blur für Lesbarkeit auf komplexen Hintergründen:

```css
backdrop-filter: blur(8px);
```

Erzeugt Tiefe und visuelle Ruhe hinter Text und UI-Elementen.

### Typografie-Hierarchie

| Font | Einsatz |
|---|---|
| **Rajdhani** | Display — Uhr, Titel, Logo. Alles was nach "System" aussieht |
| **Inter** | Body — Bookmark-Titel, Listen, interaktive Elemente |
| **Cinzel** | Fantasy — Exklusiv für Themes mit majestätischem oder antikem Vibe (Crescent, Julia & Jin) |

---

## Theme-Übersicht

| Theme | Akzentfarbe | Stimmung |
|---|---|---|
| Nebula | `#b359ff` Magenta | Chill, Cosmic |
| Crescent | `#d4bd8a` Gold | Luxury, Night |
| Event Horizon | `#9d5cff` Purple | Deep Space, Void |
| Merchantman | `#2eb8b8` Emerald | Industrial, Alien |
| Julia & Jin | `#7db3ff` Aetherial Blue | FFXIV Night |
| SC Sunset | `#ff8c3d` Amber | Emotional, Horizon |
| Hellion HUD | `#32ff6a` Neon Green | Tactical, Admin |
| Hellion Energy | `#1eff8e` Acid Green | Overdrive, Power |

---

## ADHS-Optimierung

Bei Hintergrundbildern mit vielen Details (z.B. Julia & Jin) den Board-Alpha erhöhen
und den Blur verstärken — das dimmt das Hintergrundrauschen und lässt das Gehirn
schneller die relevanten Informationen erfassen:

```css
--bg-board: rgba(R, G, B, 0.65);
backdrop-filter: blur(12px);
```

---

Entwickelt von **[Hellion Online Media — Florian Wathling](https://hellion-media.de)** — JonKazama-Hellion
