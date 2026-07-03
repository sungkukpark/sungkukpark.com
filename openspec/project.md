# Project: sungkukpark.com — COH3 strategy & analysis hub

## Purpose

Personal technical blog and analysis surface expanding into an **international Company of Heroes 3** player hub: accurate unit data, filters, visualization, and (later) chatbot-assisted strategy—not a clone of [coh3stats.com](https://coh3stats.com/) UI.

## Data ethics & attribution

- Game definitions: [cohstats/coh3-data](https://github.com/cohstats/coh3-data) via CDN (`data.coh3stats.com`), tagged per game patch.
- Reference implementation patterns: [cohstats/coh3-stats](https://github.com/cohstats/coh3-stats), [coh3-data-types-library](https://github.com/cohstats/coh3-data-types-library).
- **Requirement:** visible credit and link to COH3 Stats open data; pin `dataTag` in config and surface patch version in UI.

## Technical direction (brownfield)

- Site today: static `index.html` + S3 deploy via GitHub Actions.
- COH3 hub: Vite SPA (or sub-app) under `/coh3/`, same deploy pipeline (`dist/`).
- Prefer **build-time ingestion** of coh3-data for accuracy and speed; optional runtime refresh later.

## Scope boundary

- **In scope:** this repo (`sungkukpark.com`) only—blog shell, COH3 hub, ingest, deploy.
- **Out of scope:** changes to a local [coh3-stats](https://github.com/cohstats/coh3-stats) clone (read-only reference for spot-checks; keep upstream `yarn` there).
- **Package manager (this repo):** **pnpm** (`packageManager` in root `package.json`, `pnpm-lock.yaml`, CI with frozen lockfile).

## Local reference checkout (developer)

For benchmarking behavior and normalization logic—not vendored into this repo, **do not modify**:

- Path: `D:\wkspaces\renderbrains\coh3-stats` (upstream [cohstats/coh3-stats](https://github.com/cohstats/coh3-stats), `yarn install` + `yarn dev` → localhost:3000).
- Data URLs: `config.getPatchDataUrl()` → `https://data.coh3stats.com/cohstats/coh3-data/{dataTag}/data/...` (see `config.ts` `patches` / `latestPatch`).
- Unit pipeline entry: `src/unitStats/mappings.ts` → `getMappings()` (fetches locstring, then `mappingSbps.ts`, `mappingEbps.ts`, `mappingWeapon.ts`, etc.).
- Closest UX reference for v1 list: `pages/explorer/unit-browser.tsx` + `components/unitStats/unitTable.tsx` (reuse **data shape**, not Mantine/CSS).
- Game-data patches / workarounds: `src/unitStats/workarounds.ts`, `coh3-unit-configs.ts` (accuracy pitfalls when diffing against coh3stats.com).

