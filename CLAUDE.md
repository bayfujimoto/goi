# 語彙 — Word Bank SRS

A single-page progressive web app for learning Japanese vocabulary using spaced repetition.

## Architecture

- **Single file app** — all markup, CSS, and JavaScript live in `index.html`
- **No build tools, no dependencies** — vanilla JS, HTML, CSS only
- **Client-side only** — all data stored in `localStorage`, no backend
- **PWA** — `manifest.json` + `sw.js` service worker for offline support

## File Structure

```
index.html      # Entire app (styles, markup, JS)
sw.js           # Service worker — network-first caching strategy
manifest.json   # PWA manifest
icon-192.png    # App icon
icon-512.png    # App icon
```

## Key Concepts

### localStorage Keys
```js
K = {
  db:     'goi_cards_v2',     // SRS card data (interval, ease, due, lapses, etc.)
  meta:   'goi_meta_v2',      // Word metadata (kanji, furigana, definition, JLPT)
  streak: 'goi_streak',       // Daily streak counter and 30-day history
  export: 'goi_last_export',  // Timestamp of last JSON export
  api:    'goi_api_key',      // Claude API key (stored locally, never sent to a server)
  theme:  'goi_theme',        // 'light' | 'dark' | 'auto'
  caps:   'goi_caps'          // Session caps { newLimit, reviewLimit }
}
```

### Card Schema
```js
{
  interval: 0,           // Days until next review
  easeFactor: 2.5,       // SM-2 ease factor
  repetitions: 0,        // Consecutive correct answers
  due: Date.now(),       // Unix timestamp when due
  lapses: 0,             // Times forgotten
  correctStreak: 0,      // Streak toward graduation
  graduated: false,      // true once mastered (interval >= 21 days)
  importedAt: Date.now() // Import timestamp
}
```

### SRS Algorithm
- **SM-2** with customizations
- Rating buttons map to quality scores: Again→0, Hard→2, Good→4, Easy→5
- Graduation requires 2 consecutive correct responses
- Ease factor: `max(1.3, ef + 0.1 - (5-q)*(0.08+(5-q)*0.02))`
- Lapses increment on Again; words with `lapses > 0` appear in Weak Words

### Card States
| State | Condition |
|-------|-----------|
| New | `!graduated && repetitions === 0` |
| Learning | `!graduated && repetitions > 0` |
| Due Today | `graduated && due within 24h` |
| Overdue | `graduated && overdue by >1 day` |
| Mastered | `graduated && interval >= 21` |

### Screens
All screens use `display: flex/none` toggling — no router.

- `#screen-home` — Dashboard: arc progress, stats, streak, study buttons
- `#screen-study` — Card review: flip card, Again/Hard/Good/Easy rating
- `#screen-weak` — Weak words list (lapses > 0)
- `#screen-done` — Session complete: stats, continue or return home
- `#screen-settings` — Theme, session caps, API key, export/import, reset

## AI Integration

Uses Claude Haiku (`claude-haiku-4-5-20251001`) directly from the browser:
- **Example sentences** — generates a contextual Japanese sentence using the target word
- **Related words** — suggests words sharing kanji or reading; checks user's deck first

```js
// Required header for direct browser access
'anthropic-dangerous-direct-browser-access': 'true'
```

API key is stored in `localStorage` under `goi_api_key`.

## Word Import Format

Markdown table with 3–5 columns:

```md
| JLPT | Word | Reading | Definition | Source |
|------|------|---------|------------|--------|
| N3   | 単語  | たんご   | vocabulary  | 本     |
```

Columns: JLPT level (optional), kanji, furigana, definition, source (optional).

## Service Worker

Cache key: `goi-v2` — bump the `CACHE` constant in `sw.js` on every deploy.

Strategy: **network-first** — always tries the network, caches fresh responses, falls back to cache when offline.

## Theme System

CSS custom properties on `:root` (light) and `[data-theme="dark"]`. Toggled by setting `document.documentElement.dataset.theme`. Auto mode follows `prefers-color-scheme`.

## Development Notes

- To test changes locally, open `index.html` directly in a browser or serve with any static file server
- Service worker only activates over HTTPS or `localhost`
- No linting or test suite — validate manually in browser
- All logic is in one file; search by function name or comment headers like `/* ══ SECTION ══ */`
