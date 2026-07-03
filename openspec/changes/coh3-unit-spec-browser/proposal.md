## Why

Build the foundation for a COH3 **game analysis and strategy hub** (unit reference → filters/visualization → chatbot). The fastest path to trustworthy content is to **list every spec field per unit** from the same open data [COH3 Stats](https://coh3stats.com/other/open-data) uses—not scraped HTML or copied CSS from coh3stats.com.

Benchmark repos: [cohstats](https://github.com/cohstats) org, especially [coh3-data](https://github.com/cohstats/coh3-data) and [coh3-stats](https://github.com/cohstats/coh3-stats).

## What Changes

- Introduce a **data pipeline** that pins a `coh3-data` tag and produces a local **unit index + detail payloads**.
- Introduce **minimal UX**: Faction → Category → Unit list → **Unit detail (full spec table)**.
- Add OpenSpec capability `coh3-unit-catalog` (requirements only in this change; implementation follows `tasks.md`).
- No matchmaking, leaderboards, or chatbot in this change.

## Capabilities

### New Capabilities

- `coh3-data-ingest`: Download versioned JSON from `data.coh3stats.com`, validate, record manifest metadata.
- `coh3-unit-normalize`: Map raw `sbps` / linked `ebps` / `weapon` / `locstring` into stable unit records and display fields.
- `coh3-unit-catalog`: Faction/category filters, search, unit list, and per-unit full spec view.

### Modified Capabilities

- (none — greenfield COH3 module on sungkukpark.com)

## Impact

- New `coh3/` app area in repo (Vite + TypeScript recommended).
- Build step before S3 deploy; larger `dist/` (prebuilt JSON shards, not full raw dumps in browser).
- Dependency option: reuse types/utils from `coh3-data-types-library` (GitHub tag) when normalization logic overlaps—evaluate in implementation, do not block v1 on it.

## Success criteria (this milestone)

1. User can pick **faction** and **category**, see a **complete unit list** with correct display names.
2. User opens a unit and sees **all normalized attributes** plus optional **raw extension tree** for audit.
3. UI shows **game patch / data tag** matching coh3-data (e.g. `v2.4.2-4`).
