# ⬡ Opera GX — New-Tab Workaround

Opera GX ist der einzige Browser in diesem Projekt der sich aktiv dagegen wehrt,
eine eigene New-Tab-Seite zu nutzen. Während Chrome, Edge, Firefox und selbst Vivaldi
einfach `chrome_url_overrides` respektieren, priorisiert Opera GX seine eigene
Speed Dial Seite und ignoriert den Standard-Override für entpackte Erweiterungen.

Das Ergebnis: vier Stunden Debugging, zwei Workaround-Skripte und ein Reddit-Thread
der tatsächlich geholfen hat. Hier ist was dabei rausgekommen ist.

---

## Warum zwei extra Skripte?

| Browser | New-Tab Override | Zusatzaufwand |
|---|---|---|
| Chrome / Edge / Brave / Vivaldi | `chrome_url_overrides` | Keiner |
| Firefox | `chrome_url_overrides` (MV3) | Eigenes Manifest |
| Opera / Opera GX | Blockiert durch Speed Dial | Dieser Ordner hier |

---

## Was passiert hier?

### `background.js` — Tab-Management

Überwacht Tab-Aktivitäten im Hintergrund und greift ein bevor Opera seine Startseite laden kann.

- Erkennt `opera://startpage/` und `chrome://startpage/`
- Leitet per `chrome.tabs.update` auf `newtab.html` um
- Prüft zusätzlich bei `onActivated`, weil Opera manche Tabs im Hintergrund lädt
  und der erste Redirect dann nicht greift

### `redirect.js` — In-Page Redirect

Manche Opera-Systemprozesse sind so weit isoliert dass ein externer Eingriff
nicht zuverlässig ankommt. Also nochmal von innen.

- Wird als Content Script direkt in Opera-Startseiten-Bereiche injiziert
- Löst den Redirect bei `document_start` aus, bevor die Speed Dial Seite
  überhaupt anfangen kann sich aufzubauen

Ja, es braucht wirklich beide Skripte. Opera GX hat das so entschieden.

Das Gute daran: die GitHub Actions kümmern sich darum dass jeder Browser nur bekommt
was er braucht. Das Opera-ZIP enthält die Workaround-Skripte, das Chrome-ZIP nicht.
Wer sich das manuell zusammensuchen müsste wäre vermutlich genauso genervt wie ich
beim Debuggen war.

---

## Datenschutz

Kein Tracking, keine Speicherung, keine externen Requests.
Nur Standard-Browser-APIs, `chrome.tabs`, um zurückzubekommen was eigentlich
standardmäßig funktionieren sollte.

**100% lokal. 0% Analytics. Wie im gesamten Hellion NewTab Projekt.**

---

Entwickelt von **[Hellion Online Media — Florian Wathling](https://hellion-media.de)** — JonKazama-Hellion
