# COH3 game data (coh3-data)

Unit specs come from the community [coh3-data](https://github.com/cohstats/coh3-data) CDN—not from scraping coh3stats.com.

## Pinned patch

Edit [`coh3/data-tag.json`](../coh3/data-tag.json):

```json
{ "dataTag": "v2.4.2-4" }
```

Tags must exist on [coh3-data releases/tags](https://github.com/cohstats/coh3-data/tags).

## Ingest

```bash
pnpm coh3:ingest
```

Downloads (per tag):

- `locales/en-locstring.json`, `locales/ko-locstring.json` (unit names and in-game strings)
- `chunked/sbps/races/{american,german,british_africa,afrika_korps}.json` — **multiplayer-playable races only** (`british` campaign/data bucket is excluded)

The COH3 app UI is translated in code (`coh3/src/i18n/`). The user’s language choice is stored in `localStorage` under key `coh3-hub-locale` (`en` | `ko`).

**Unit and faction icons** load at runtime from [COH3 Stats assets CDN](https://cdn.coh3stats.com) (`export/icons/…` and `icons/general/…`), using the same paths as [coh3-stats](https://github.com/cohstats/coh3-stats) `getIconsPathOnCDN` / `getFactionIcon`. Icon paths are extracted at ingest from `squad_ui_ext` (`icon_name`, `symbol_icon_name`).

Writes:

- `coh3/public/data/units.index.json`
- `coh3/public/data/units/{faction}/{category}/{unitKey}.json`
- `coh3/.generated/manifest.json` (checksums + warnings)

## UI conventions (`coh3/`)

- **No duplicates:** one list per filter set; do not add a separate “compare top N” panel that repeats the same units and stats as the card list.
- **One stat control** on the list page drives both sort order and bar charts (vs category max).
- Cross-check combat numbers with `pnpm coh3:validate-stats` (requires sibling clone `../coh3-stats`).

## Full build (blog + COH3 app)

```bash
pnpm install
pnpm build
```

Output: `dist/index.html`, `dist/coh3/` (Vite app + data).

## Attribution

Show [COH3 Stats Open Data](https://coh3stats.com/other/open-data) and the active `dataTag` in the UI (required).

## Local reference (read-only)

Compare values against a local [coh3-stats](https://github.com/cohstats/coh3-stats) checkout (`yarn dev`)—do not vendor that repo into this site.
