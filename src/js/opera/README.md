# ⬡ Opera GX — New-Tab Workaround

Opera GX priorisiert die eigene Speed Dial Seite und ignoriert `chrome_url_overrides`
für entpackte Erweiterungen. Um das Hellion Dashboard trotzdem als New-Tab-Seite
zu etablieren, kommen zwei zusätzliche Skripte zum Einsatz.

---

## Warum zwei extra Skripte?

| Browser | New-Tab Override | Zusatzaufwand |
|---|---|---|
| Chrome / Edge / Brave / Vivaldi | `chrome_url_overrides` | Keiner |
| Firefox | `chrome_url_overrides` (MV2) | Eigenes Manifest |
| Opera / Opera GX | Blockiert durch Speed Dial | Workaround nötig |

---

## Was passiert hier?

### `background.js` — Tab-Management

Überwacht Tab-Aktivitäten im Hintergrund und greift ein bevor Opera seine Startseite lädt.

- Erkennt `opera://startpage/` und `chrome://startpage/`
- Leitet per `chrome.tabs.update` auf `newtab.html` um
- Prüft zusätzlich bei `onActivated` — auch im Hintergrund geladene Tabs werden sofort aktualisiert

### `redirect.js` — In-Page Redirect

Einige Opera-Systemprozesse sind so isoliert dass ein externer Eingriff nicht zuverlässig greift.

- Wird als Content Script in Opera-Startseiten-Bereiche injiziert
- Löst den Redirect bei `document_start` aus — minimale Verzögerung, kein Flackern

---

## Datenschutz

Kein Tracking, keine Speicherung, keine externen Requests.
Ausschließlich Standard-Browser-APIs — `chrome.tabs` — um die Kontrolle über den New Tab zurückzugewinnen.

**100% lokal. 0% Analytics. Wie im gesamten Hellion NewTab Projekt.**

---

Entwickelt von **[Hellion Online Media — Florian Wathling](https://hellion-media.de)** — JonKazama-Hellion
