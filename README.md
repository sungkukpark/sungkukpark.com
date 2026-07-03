# sungkukpark.com

Personal site: technical blog (graphics, technical art, game design) and a growing **Company of Heroes 3** analysis hub.

- **Live (S3):** [sungkukpark.com](http://sungkukpark.com.s3-website.eu-north-1.amazonaws.com)  
- **COH3 unit reference:** `/coh3/` on the same host after deploy  

## Repository layout

| Path | Purpose |
|------|---------|
| `index.html` | Blog landing page |
| `coh3/` | Vite + React COH3 unit catalog (`base: /coh3/`) |
| `scripts/coh3-ingest.ts` | Download [coh3-data](https://github.com/cohstats/coh3-data) from CDN, emit unit JSON |
| `openspec/` | Specs and plans (OpenSpec-style change: `coh3-unit-spec-browser`) |
| `docs/` | Deploy and data runbooks |
| `CLAUDE.md` | Commit message conventions for this repo |

## Requirements

- **Node.js** 20+ (CI uses 22)
- **pnpm** 9 (`packageManager` in `package.json`; or `npm exec pnpm@9.15.4`)

## Development

```bash
pnpm install
pnpm dev:coh3          # COH3 app at http://localhost:5173/coh3/
pnpm coh3:ingest       # refresh game data only
pnpm build             # ingest + Vite build → dist/
```

Game data patch is pinned in [`coh3/data-tag.json`](coh3/data-tag.json). See [`docs/coh3-data.md`](docs/coh3-data.md) for CDN URLs and attribution.

**Languages:** English (default) and Korean for UI and unit strings. Choice is saved in the browser (`localStorage` key `coh3-hub-locale`).

### COH3 data attribution

Unit definitions come from [COH3 Stats Open Data](https://coh3stats.com/other/open-data) ([cohstats/coh3-data](https://github.com/cohstats/coh3-data)). This project is not affiliated with Relic or SEGA. A local [coh3-stats](https://github.com/cohstats/coh3-stats) clone is useful for spot-checking values only—do not fork its UI here.

## Deploy

Pushes to **`main`** run [`.github/workflows/deploy-s3.yml`](.github/workflows/deploy-s3.yml): `pnpm build`, then `aws s3 sync` to bucket `sungkukpark.com` (eu-north-1). Requires GitHub secret `AWS_ROLE_ARN`. Details: [`docs/deploy-s3.md`](docs/deploy-s3.md).

## Commits

Area-based messages (`demo:`, `post:`, `build:`, …)—not Conventional Commits. See [`CLAUDE.md`](CLAUDE.md).

## License

Site content and code in this repository: see `LICENSE` when added. COH3 game data files are produced from community open data; respect coh3-data and game EULA when redistributing derived work.
