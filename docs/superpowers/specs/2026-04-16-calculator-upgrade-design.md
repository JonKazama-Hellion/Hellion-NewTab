# Hellion NewTab — Calculator Upgrade Design

**Datum:** 2026-04-16
**Autor:** Florian Wathling / Claude Code
**Status:** Approved
**Scope:** Calculator erweitern um Scientific, Unit-Converter und Game-Rechner (Satisfactory, Factorio, Stationeers)
**Ziel-Version:** v2.1.0

---

## Kontext

Der Calculator ist aktuell ein reiner Grundrechenarten-Taschenrechner (720 Zeilen, Shunting-Yard Parser, 4x5 Button-Grid, History). Das Upgrade macht ihn zum zentralen Tool-Widget mit 6 Modi:

1. **Standard** (bestehend)
2. **Scientific** (Wurzel, Potenz, Pi, Formel-Helfer)
3. **Unit-Converter** (Länge, Gewicht, Temperatur, Volumen, Geschwindigkeit, Fläche)
4. **Satisfactory** (Items/Min, Overclock-Power, Maschinen-Rechner)
5. **Factorio** (Assembler-Ratios, Belt-Throughput, Maschinen-Rechner)
6. **Stationeers** (Idealgas, Furnace/Verbrennung, Solar/Batterie, Atmosphäre)

---

## Sektion 1: Architektur und Dateistruktur

### Datei-Aufteilung

```
src/js/
├── calculator.js          # Core: Tab-System, Standard-Modus, erweiterter Shunting-Yard Parser
├── calc-scientific.js     # Scientific-Modus
├── calc-converter.js      # Unit-Converter
├── calc-satisfactory.js   # Satisfactory Calculator
├── calc-factorio.js       # Factorio Calculator
└── calc-stationeers.js    # Stationeers Calculator
```

### Load-Order in newtab.html

```
... → widgets.js → notes.js → calculator.js → calc-scientific.js → calc-converter.js →
calc-satisfactory.js → calc-factorio.js → calc-stationeers.js → timer.js → ...
```

Alle Mode-Dateien laden nach `calculator.js` und vor `timer.js`. Kein zirkulärer Dependency-Konflikt.

### Registrierungs-Pattern

Jede Mode-Datei registriert sich beim Calculator-Objekt:

```javascript
Calculator.registerMode('scientific', {
  label: '\uD83D\uDCD0',        // Icon
  shortName: 'Sci',              // Tab-Label (3 Zeichen)
  titleKey: 'calculator.tab.scientific',  // i18n-Key
  render(bodyEl) { /* UI aufbauen */ },
  destroy() { /* Cleanup, Event-Listener entfernen */ }
});
```

`calculator.js` bekommt:

```javascript
_modes: new Map(),
_activeMode: 'standard',

registerMode(name, config) {
  this._modes.set(name, config);
},
```

Die Tab-Leiste wird dynamisch aus `_modes` gebaut. Standard-Modus ist immer registriert (intern, nicht per externer Datei). Die anderen Modi kommen dazu wenn ihre Script-Datei geladen ist.

### Tab-Wechsel

```javascript
switchMode(name) {
  const mode = this._modes.get(name);
  if (!mode) return;
  this._activeMode = name;
  const body = WidgetManager.getBody(this.WIDGET_ID);
  if (!body) return;

  // Alten Modus aufräumen
  const oldMode = this._modes.get(this._previousMode);
  if (oldMode && oldMode.destroy) oldMode.destroy();

  // Neuen Modus rendern
  body.textContent = '';
  mode.render(body);

  // Tab-UI aktualisieren
  this._updateTabBar();

  // State speichern
  this.save();
}
```

### Storage

Jeder Modus speichert seinen State als Sub-Key unter `calculator` im bestehenden `widgetStates`:

```javascript
{
  calculator: {
    x: 400, y: 120, width: 320, height: 480,
    open: true,
    activeMode: 'standard',
    history: [{ expr: '42 × 7', result: '294' }],
    converter: { lastCategory: 'length', fromUnit: 'cm', toUnit: 'in' },
    satisfactory: { lastSubMode: 'itemsPerMin' },
    factorio: { lastSubMode: 'ratio', lastAssembler: 'asm3' },
    stationeers: { lastSubMode: 'gas' }
  }
}
```

Read-before-write Pattern bleibt: `const data = await Store.get(this.STORAGE_KEY) || {};`

---

## Sektion 2: Standard-Modus (Änderungen)

### Parser-Erweiterung

Der Shunting-Yard Parser wird um zwei Operationen erweitert:

**Potenz-Operator `^`:**
- Binärer Operator mit höchster Precedence (über `*` und `/`)
- Rechts-assoziativ: `2^3^2` = `2^(3^2)` = 512
- Tokenizer erkennt `^` als `{ type: 'op', value: '^' }`
- parseFactor() → parsePower() → parseFactor() (neue Precedence-Stufe)

**Wurzel-Funktion `sqrt`:**
- Wird vom Scientific-Modus als `sqrt(` in die Expression eingefügt
- Tokenizer erkennt `sqrt` als `{ type: 'func', value: 'sqrt' }`
- parseFactor() prüft auf Functions vor Numbers

Die bestehende Operator-Hierarchie wird:
```
parseExpr:   + -
parseTerm:   * / %
parsePower:  ^           ← NEU
parseFactor: number | (expr) | func(expr)  ← func NEU
```

### Keine Änderungen am Standard-UI

Das 4x5 Button-Grid, History-Panel und Keyboard-Support bleiben identisch. Die Parser-Erweiterung ist rückwärtskompatibel (keine bestehende Expression bricht).

---

## Sektion 3: Scientific-Modus

### Zusätzliche Buttons

2 neue Reihen über dem Standard-Grid:

| Button | Wert | Aktion |
|---|---|---|
| √ | `sqrt(` | Unäre Funktion, öffnet Klammer |
| x² | `^2` | Hängt `^2` an Expression |
| xⁿ | `^` | Fügt Potenz-Operator ein |
| π | `3.14159265359` | Konstante einfügen |
| e | `2.71828182846` | Konstante einfügen |
| ± | toggle | Vorzeichen des letzten Werts wechseln |

Darunter das Standard 4x5-Grid (C, Klammern, %, ÷, 0-9, Operatoren, =). Der Scientific-Modus nutzt den gleichen `_handleKey()`/`_calculate()`-Flow.

### Formel-Helfer

Ein Dropdown unter dem Button-Grid mit vorgefertigten Formeln:

| Formel | Eingabefelder | Berechnung |
|---|---|---|
| Kreis-Fläche | Radius (r) | `π × r²` |
| Kreis-Umfang | Radius (r) | `2 × π × r` |
| °C → °F | Temperatur | `(C × 9/5) + 32` |
| °F → °C | Temperatur | `(F - 32) × 5/9` |
| Pythagoras | a, b | `√(a² + b²)` |
| Prozent-Wert | Wert, Prozent | `Wert × Prozent / 100` |

Jede Formel öffnet inline Eingabefelder + Live-Ergebnis. Nutzt `_formatResult()` für einheitliche Zahlenformatierung.

### Keyboard

Gleicher Keyboard-Support wie Standard-Modus, plus:
- `p` → Pi einfügen
- `e` → Euler einfügen (kein Konflikt: `e` ist im Standard nicht belegt, nur `c`/`C` und `Escape` sind Clear)

---

## Sektion 4: Unit-Converter

### UI-Aufbau

```
┌──────────────────────────┐
│ [Kategorie-Dropdown    ▼]│
│                          │
│ [123.45    ] [cm      ▼] │
│       ⇅ (Swap-Button)    │
│ [48.622    ] [in      ▼] │
│                          │
│ Schnellreferenz:         │
│  1 cm = 0.3937 in       │
│  1 in = 2.54 cm         │
└──────────────────────────┘
```

### Kategorien und Einheiten

| Kategorie | Einheiten | Basis-Einheit |
|---|---|---|
| Länge | mm, cm, m, km, in, ft, yd, mi | m |
| Gewicht | mg, g, kg, t, oz, lb | g |
| Temperatur | °C, °F, K | (Spezialfunktionen) |
| Volumen | ml, L, m³, gal(US), gal(UK), ft³ | ml |
| Geschwindigkeit | m/s, km/h, mph, kn | m/s |
| Fläche | mm², cm², m², km², ha, acre, ft², in² | m² |

### Konvertierungs-Logik

Jede Einheit hat `toBase(value)` und `fromBase(value)`:

```javascript
const LENGTH_UNITS = {
  mm:  { toBase: v => v / 1000,     fromBase: v => v * 1000 },
  cm:  { toBase: v => v / 100,      fromBase: v => v * 100 },
  m:   { toBase: v => v,            fromBase: v => v },
  km:  { toBase: v => v * 1000,     fromBase: v => v / 1000 },
  in:  { toBase: v => v * 0.0254,   fromBase: v => v / 0.0254 },
  ft:  { toBase: v => v * 0.3048,   fromBase: v => v / 0.3048 },
  yd:  { toBase: v => v * 0.9144,   fromBase: v => v / 0.9144 },
  mi:  { toBase: v => v * 1609.344, fromBase: v => v / 1609.344 }
};
```

Temperatur bekommt eigene Funktionen (nicht linear):

```javascript
const TEMP_CONVERSIONS = {
  'C_F': v => (v * 9/5) + 32,
  'C_K': v => v + 273.15,
  'F_C': v => (v - 32) * 5/9,
  'F_K': v => (v - 32) * 5/9 + 273.15,
  'K_C': v => v - 273.15,
  'K_F': v => (v - 273.15) * 9/5 + 32
};
```

### Verhalten

- Live-Update bei Eingabe (kein "Berechnen"-Button)
- Swap-Button (⇅) tauscht Quell- und Ziel-Einheit
- Schnellreferenz zeigt `1 [from] = x [to]` und umgekehrt
- Kein Keyboard-Override (native `<input>` Felder)

### Storage

```javascript
converter: { lastCategory: 'length', fromUnit: 'cm', toUnit: 'in' }
```

---

## Sektion 5: Satisfactory Calculator

### Sub-Modi

Drei Buttons oben wählen den aktiven Rechner:

#### 5a: Items/Min

**Eingabefelder:**
- Items per Craft (default: 1)
- Craft Time in Sekunden (default: 4)
- Clock Speed in % (default: 100)

**Formel:**
```
Output = (ItemsPerCraft × 60) / CraftTime × (ClockSpeed / 100)
```

**Ausgabe:** `X.XX items/min`

#### 5b: Overclock Power

**Eingabefelder:**
- Base Power in MW (default: 30)
- Clock Speed in % (default: 100)

**Formeln:**
```
PowerUsage = BasePower × (ClockSpeed / 100) ^ 1.321928
EnergyPerItem = (ClockSpeed / 100) ^ 0.321928
```

**Ausgabe:**
- `Power Usage: X.X MW`
- `Efficiency: ↓ X.X% per item` (nur bei ClockSpeed > 100)

#### 5c: Maschinen

**Eingabefelder:**
- Target Output/Min (default: 60)
- Items per Craft (default: 1)
- Craft Time in Sekunden (default: 4)
- Clock Speed in % (default: 100)
- Base Power in MW (default: 30)

**Formeln:**
```
ItemsPerMin = (ItemsPerCraft × 60) / CraftTime × (ClockSpeed / 100)
Machines = ceil(TargetOutput / ItemsPerMin)
TotalPower = Machines × BasePower × (ClockSpeed / 100) ^ 1.321928
```

**Ausgabe:**
- `Machines needed: X`
- `Total Power: X.X MW`

### Verhalten

Alle Felder berechnen live. `<input type="number">` mit `step`-Attribut für sinnvolle Schrittweiten.

---

## Sektion 6: Factorio Calculator

### Sub-Modi

#### 6a: Assembler-Ratio

**Eingabefelder:**
- Assembler-Dropdown: Assembler 1 (0.5), Assembler 2 (0.75), Assembler 3 (1.25)
- Recipe Output Count (default: 1)
- Recipe Time in Sekunden (default: 1)

**Formel:**
```
OutputPerSecond = RecipeOutput × CraftingSpeed / RecipeTime
OutputPerMinute = OutputPerSecond × 60
```

**Ausgabe:**
- `X.XX items/s`
- `X.XX items/min`

#### 6b: Belt-Throughput

**Eingabefelder:**
- Belt-Dropdown: Yellow (15/s), Red (30/s), Blue (45/s)
- Items consumed per second per machine (default: 1)

**Feste Werte:**

| Belt | Total (items/s) | Per Side (items/s) |
|---|---|---|
| Yellow | 15 | 7.5 |
| Red | 30 | 15 |
| Blue | 45 | 22.5 |

**Formel:**
```
MachinesPerBelt = floor(BeltThroughput / ItemsConsumedPerSec)
Utilization = (ItemsConsumedPerSec × MachinesPerBelt) / BeltThroughput × 100
```

**Ausgabe:**
- `Machines per belt: X`
- `Belt utilization: X%`

#### 6c: Maschinen

**Eingabefelder:**
- Assembler-Dropdown
- Target Output/s (default: 10)
- Recipe Output Count (default: 1)
- Recipe Time in Sekunden (default: 1)

**Formel:**
```
OutputPerMachine = RecipeOutput × CraftingSpeed / RecipeTime
Machines = ceil(TargetOutput / OutputPerMachine)
TotalThroughput = Machines × OutputPerMachine
BeltNeeded = kleinster Belt der TotalThroughput schafft
```

**Ausgabe:**
- `Machines needed: X`
- `Belt needed: [Color] (X% utilization)`

---

## Sektion 7: Stationeers Calculator

### Sub-Modi

Vier Buttons oben (statt drei wie bei den anderen Game-Rechnern).

#### 7a: Gas (Idealgas PV=nRT)

**Eingabefelder:**
- Dropdown: Gesucht = P, V, n oder T
- Die drei anderen Variablen als Eingabefelder

**Konstante:** R = 8314.46261815324 (Stationeers-spezifisch, Einheit: L·Pa / mol·K)

**Formeln:**
```
P = nRT / V
V = nRT / P
n = PV / RT
T = PV / nR
```

**Eingabe-Einheiten:**
- P in kPa (wird intern × 1000 zu Pa)
- V in Litern
- T in Kelvin (Hilfstext zeigt °C-Äquivalent)
- n in mol

#### 7b: Furnace / Verbrennung

**Eingabefelder:**
- Fuel Ratio (0 bis 1, Anteil Brennstoff am Gesamtgas)
- Start-Temperatur in Kelvin
- Start-Druck in kPa

**Formeln:**
```
T_nach = (T_vor × specificHeat + fuel × 563452) / (specificHeat + fuel × 172.615)
P_nach = P_vor × T_nach × (1 + 5.7 × fuel) / T_vor
```

Wobei:
- `fuel = min(ratioO2, ratioVolatile / 2)`
- `specificHeat` = gewichtete Summe der Gas-Wärmekapazitäten
- Vereinfachung: Fuel Ratio als einzelner Wert (0-1), `specificHeat(before)` wird aus reinem Fuel berechnet (61.9 J/mol·K für 1:2 O₂:H₂ Mischung)
- 563452 = Energie pro Mol bei 95% Effizienz
- 172.615 = 0.95 × (243.6 - 61.9)

**Validierung:**
- Warnung wenn Fuel < 0.05 (unter 5% Minimum)
- Warnung wenn Start-Druck < 10 kPa

**Ausgabe:**
- `T after ignition: X K (X °C)`
- `P after ignition: X kPa`

#### 7c: Solar / Batterie

**Eingabefelder:**
- Anzahl Panels (default: 12)
- Watt pro Panel (default: 500, Mond-Wert)
- Tag-Länge in Sekunden (default: 600)
- Nacht-Länge in Sekunden (default: 600)
- Verbrauch in Watt (default: 2000)

**Formeln:**
```
Generation = Panels × WattsPerPanel
Surplus = Generation - Consumption
NightEnergy = Consumption × NightLength    (in Watt-Sekunden)
BatteriesNeeded = ceil(NightEnergy / 50000)  (Station Battery = 50.000 Ws)
```

**Ausgabe:**
- `Generation: X W`
- `Surplus: X W` (rot wenn negativ)
- `Night Energy: X Ws`
- `Batteries needed: X`

#### 7d: Atmosphäre / Gas-Mischer

**Eingabefelder:**
- Target Temperatur in Kelvin
- Gas 1 Temperatur in Kelvin
- Gas 2 Temperatur in Kelvin

**Formel:**
```
M1 = |T2 - T0| / (|T1 - T0| + |T2 - T0|)
M2 = 1 - M1
```

**Ausgabe:**
- `Mixer Input 1: X.X%`
- `Mixer Input 2: X.X%`

**Aufklappbare Wärmekapazität-Referenz:**

| Gas | Cp (J/mol·K) |
|---|---|
| O₂ | 21.1 |
| H₂ | 20.4 |
| CO₂ | 28.2 |
| N₂ | 20.6 |
| H₂O | 72.0 |
| N₂O | 23.0 |
| Pollutant | 24.8 |

---

## Sektion 8: UI, i18n und Widget-Sizing

### Tab-Leiste

Horizontale Leiste direkt unter dem Widget-Header. Immer sichtbar (kein Scrollen).

| Tab | Icon | Label |
|---|---|---|
| Standard | 🔢 | Std |
| Scientific | 📐 | Sci |
| Converter | ⚖️ | Unit |
| Satisfactory | ⚙️ | SAT |
| Factorio | 🏭 | FAC |
| Stationeers | 🚀 | STA |

Aktiver Tab: `border-bottom: 2px solid var(--accent)`, Text in `var(--accent)`.
Inaktive Tabs: `color: rgba(255,255,255,0.5)`.
CSS-Klasse: `.calc-tab-bar` und `.calc-tab`.

### Widget-Sizing

- Standard-Modus Minimum: 280 × 400 px
- Komplexe Modi (Scientific, Game-Rechner): Auto-Resize auf 320 × 480 px (falls aktuell kleiner)
- User-Resize überschreibt Auto-Resize
- Widget-System-Minimum bleibt 200 × 150 px

### i18n

Geschätzt ~100 neue Keys in `STRINGS.de` und `STRINGS.en`:

- 6 Tab-Labels
- 6 Kategorie-Namen (Converter)
- ~48 Einheiten-Langformen (Converter)
- ~30 Feld-Labels (Game-Rechner)
- ~10 Ergebnis-Labels

Einheiten-Abkürzungen (cm, kg, °C, kPa) werden nicht übersetzt.

### Keyboard

- Standard-Modus: Bestehender Keyboard-Support (0-9, +, -, *, /, Enter, Backspace, Escape)
- Scientific-Modus: Gleicher Support + `p` (Pi), `^` (Potenz)
- Converter und Game-Modi: Kein Custom-Keyboard (native `<input>` Felder)

---

## Betroffene Dateien (Gesamt)

| Datei | Änderung |
|---|---|
| `src/js/calculator.js` | Tab-System, registerMode(), switchMode(), Parser-Erweiterung (^, sqrt) |
| `src/js/calc-scientific.js` | NEU: Scientific-Modus |
| `src/js/calc-converter.js` | NEU: Unit-Converter |
| `src/js/calc-satisfactory.js` | NEU: Satisfactory Calculator |
| `src/js/calc-factorio.js` | NEU: Factorio Calculator |
| `src/js/calc-stationeers.js` | NEU: Stationeers Calculator |
| `src/css/main.css` | Tab-Bar Styles, Mode-spezifische Styles |
| `src/js/i18n.js` | ~100 neue Keys (DE + EN) |
| `newtab.html` | 5 neue `<script>` Tags in Load-Order |
| `manifest.json` | Version → 2.1.0 |
| `manifest.firefox.json` | Version → 2.1.0 |
| `manifest.opera.json` | Version → 2.1.0 |
| `CHANGELOG.md` | v2.1.0 Eintrag |

## Implementierungsreihenfolge

1. **Calculator Core** — Tab-System, registerMode(), switchMode(), Tab-Bar CSS
2. **Parser-Erweiterung** — `^` Operator und `sqrt` Funktion
3. **Scientific-Modus** — Buttons, Formel-Helfer, Registrierung
4. **Unit-Converter** — Kategorien, Einheiten, Konvertierungs-Logik, UI
5. **Satisfactory Calculator** — 3 Sub-Modi, Formeln, UI
6. **Factorio Calculator** — 3 Sub-Modi, Formeln, UI
7. **Stationeers Calculator** — 4 Sub-Modi, Formeln, UI
8. **i18n** — Alle neuen Keys (DE + EN)
9. **Version Bump** — Manifests, CHANGELOG
