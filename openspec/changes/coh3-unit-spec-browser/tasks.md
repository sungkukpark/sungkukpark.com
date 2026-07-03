# COH3 unit spec browser — implementation tasks

## 1. OpenSpec & project scaffold

- [x] 1.1 Add `openspec/project.md` and this change folder (done when merged).
- [x] 1.2 Create `coh3/` Vite + TypeScript app; base path `/coh3/` for S3 static hosting.
- [x] 1.3 Wire root site link to hub; extend deploy workflow `Prepare distribution` to run `pnpm build` for COH3 app.

## 2. Data ingest (coh3-data-ingest)

- [x] 2.1 Add `coh3/data-tag.json` with pinned tag (e.g. `v2.4.2-4`).
- [x] 2.2 Implement `scripts/coh3-ingest.ts`: download `chunked/sbps/races/*.json`, `weapon.json`, `locstring.json`, required `ebps` slices (or full `ebps.json` if acceptable at build).
- [x] 2.3 Validate HTTP 200 + JSON parse; write `coh3/.generated/manifest.json` (tag, timestamp, file checksums).
- [x] 2.4 Document attribution + tag bump process in `docs/coh3-data.md`.

## 3. Normalization (coh3-unit-normalize)

- [x] 3.1 Define TypeScript types: `UnitSummary`, `UnitDetail`, `SpecSection`, `SpecRow`.
- [x] 3.2 Build unit index: flatten race × category × unitKey → summaries with `displayName` from locstring resolution.
- [x] 3.3 Build detail shards: walk extensions/squadexts (ebps/weapon join — follow-up).
- [x] 3.4 Emit `public/data/units.index.json` and `public/data/units/{id}.json` (or equivalent under `coh3/public`).
- [x] 3.5 Build report: units missing display name, broken weapon refs (warn, do not fail silently).

## 4. Unit catalog UI (coh3-unit-catalog)

- [x] 4.1 Route `/coh3` — hub copy, data version badge, faction grid linking to list.
- [x] 4.2 Route list — query params `faction` + `category`; chips + tabs; client search.
- [x] 4.3 Route detail — full spec sections + “Show raw JSON” toggle.
- [x] 4.4 Empty states: no faction selected, no units in category, failed shard load.
- [x] 4.5 Minimal accessible layout (semantic tables, keyboard nav); no decorative parity with coh3stats.com.

## 5. Quality & ship

- [ ] 5.1 Spot-check 5 units per faction against coh3stats.com unit pages (values, not layout).
- [x] 5.2 Add `pnpm run coh3:ingest` + `pnpm run build` to CI before S3 sync.
- [ ] 5.3 `analysis` post stub linking to hub for SEO (optional).

## 6. Archive OpenSpec change

- [ ] 6.1 After v1 live, merge capability specs into `openspec/specs/` and archive this change per OpenSpec workflow.
