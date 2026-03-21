# Sicherheitsrichtlinie — Hellion NewTab

## Unterstützte Versionen

| Version | Status |
| --- | --- |
| 1.2.x | Aktiv unterstützt |
| < 1.2.0 | Nicht unterstützt |

## Sicherheitslücke melden

Wenn du eine Sicherheitslücke in Hellion NewTab findest, melde sie bitte **nicht** über ein öffentliches GitHub Issue.

### Kontakt

**E-Mail:** [kontakt@hellion-media.de](mailto:kontakt@hellion-media.de?subject=Hellion%20NewTab%20%E2%80%93%20Security%20Report)

Bitte folgende Informationen angeben:

- Beschreibung der Schwachstelle
- Schritte zur Reproduktion
- Betroffene Version(en)
- Mögliche Auswirkungen (Datenverlust, XSS, etc.)

### Reaktionszeit

- **Bestätigung:** Innerhalb von 48 Stunden
- **Ersteinschätzung:** Innerhalb von 7 Tagen
- **Fix:** Abhängig von Schweregrad, Ziel innerhalb von 14 Tagen

### Schweregrad-Einstufung

| Stufe | Beschreibung | Beispiel |
| --- | --- | --- |
| Kritisch | Datenverlust oder Remote Code Execution | Storage-Manipulation durch Dritte |
| Hoch | XSS oder ungewollte Datenübertragung | Script-Injection via Bookmark-Import |
| Mittel | Umgehung von UI-Schutzmechanismen | Blur-Bypass, Settings-Manipulation |
| Niedrig | Kosmetisch oder theoretisch | Edge-Cases ohne praktische Auswirkung |

## Sicherheitsarchitektur

### Datenverarbeitung

- **Keine externe Datenübertragung** — Alle Daten bleiben in `chrome.storage.local`
- **Kein Server-Kontakt** — Außer Google Favicons API für Bookmark-Icons
- **Keine Cookies, Sessions oder Tokens**
- **Kein Netzwerkzugriff** außer Favicon-Abruf

### Eingabe-Validierung

- URL-Validierung bei Bookmark-Erstellung (`new URL()`)
- JSON-Import: Board- und Bookmark-Struktur wird validiert
- HTML-Sanitierung via `escHtml()` und `createElement` (kein `innerHTML` für User-Daten)
- Storage-Quota-Prüfung mit Warnung bei 8 MB+

### Permissions

Diese Extension benötigt nur zwei Browser-Permissions:

| Permission | Grund |
| --- | --- |
| `storage` | Boards, Settings und Sticky Note lokal speichern |
| `bookmarks` | Browser-Lesezeichen für HTML-Import lesen |

Keine Permissions für: Tabs, History, Web Requests, Downloads, Clipboard oder Host-Zugriff.

### CI/CD-Sicherheit

- **CodeQL** — Automatische statische Analyse bei Push und PR
- **Dependency Review** — Prüft auf bekannte Schwachstellen in PRs
- **Wöchentlicher Scan** — Automatischer CodeQL-Lauf jeden Montag
- **SHA256-Checksummen** — Alle Release-Artefakte werden signiert

---

**Hellion Dashboard** — [Hellion Online Media - Florian Wathling](https://hellion-media.de) — JonKazama-Hellion
