# Security Policy — Hellion NewTab

## Supported Versions

| Version | Status |
|---|---|
| 1.9.x | Actively supported |
| < 1.9.0 | Not supported |

## Reporting a Vulnerability

If you find a security vulnerability in Hellion NewTab, please **do not** open a public GitHub issue.

### Contact

**Email:** [kontakt@hellion-media.de](mailto:kontakt@hellion-media.de?subject=Hellion%20NewTab%20%E2%80%93%20Security%20Report)

Please include the following information:

- Description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Potential impact (data loss, XSS, etc.)

### Response Times

- **Acknowledgement:** Within 48 hours
- **Initial assessment:** Within 7 days
- **Fix:** Depends on severity, target within 14 days

### Severity Levels

| Level | Description | Example |
|---|---|---|
| Critical | Data loss or remote code execution | Storage manipulation by third parties |
| High | XSS or unintended data transmission | Script injection via bookmark import |
| Medium | UI protection bypass | Blur bypass, settings manipulation |
| Low | Cosmetic or theoretical | Edge cases without practical impact |

---

## Security Architecture

### Data Handling

- **No external data transmission** — all data stays in `chrome.storage.local`
- **No server contact** — except Google Favicons API for bookmark icons
- **No cookies, sessions or tokens**
- **No network access** beyond favicon fetching

### Input Validation

- URL validation on bookmark creation (`new URL()`)
- JSON import validates board and bookmark structure before applying
- HTML sanitization via `escHtml()` and `createElement` — no `innerHTML` for user data
- Storage quota check with warning at 8 MB+

### Permissions

This extension requests the following browser permissions:

| Permission | Browsers | Reason |
|---|---|---|
| `storage` | All | Store boards, settings and widget states locally |
| `bookmarks` | All | Read browser bookmarks for direct import |
| `tabs` | Opera / Opera GX only | Required for the Speed Dial workaround — `background.js` monitors tab URLs and redirects via `chrome.tabs.update` |

No permissions requested for: history, web requests, downloads, clipboard or host access.

### CI/CD Security

- **CodeQL** — Automatic static analysis on every push and PR
- **Dependency Review** — Checks for known vulnerabilities in PRs
- **Weekly scan** — Automated CodeQL run every Monday at 06:00 UTC
- **SHA256 checksums** — All release artifacts are checksummed

---

## Legal

Hellion NewTab is developed and maintained by **Florian Wathling / Hellion Online Media**,
based in Bad Harzburg, Germany.

All security matters are handled in accordance with **German and EU law**, including
the General Data Protection Regulation (GDPR / DSGVO). Users in the European Union
are covered by the same legal framework.

For legal inquiries: [hellion-media.de/impressum](https://hellion-media.de/impressum)

---

**Hellion Dashboard** — [Hellion Online Media — Florian Wathling](https://hellion-media.de) — JonKazama-Hellion
