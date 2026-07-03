# Sungkuk Park — technical blog (graphics / TA / C++ / game design)

Public portfolio and writing surface aimed at graphics engineering and technical art roles (AAA engines, GPU vendors). Content spans **GPU and engine craft**, **technical art** (shaders, lookdev, tooling), **game design** essays, **favorite-game analysis** (e.g. *Company of Heroes 3*—systems, UX, art direction, RTS craft), and **Three.js** web demos used for tech-art visualization and portfolio pieces.

Commits on this repo are part of the narrative: they should read like a careful engineer’s lab notebook, not a product changelog.

---

## Commit message format

```
<area>: <imperative summary>

[optional body — motivation, tradeoff, measurement, link]
```

**Examples**

```
post: add draft on clustered forward+ tile sizing

Motivation: compare 16 vs 32 pixel tiles for VRAM vs ALU on mobile TBDR.
Figures live in assets/clustered-forward-tiles/. Not published yet.
```

```
analysis: outline CoH3 cover-and-suppression readability

Focus: telegraphy vs realism in UI and VFX. Spoilers through mission 3 only.
Screenshots: assets/coh3-analysis/ (fair use, commentary).
```

```
demo: add Three.js portfolio viewer for stylized foliage cards

r152, PMREM env, custom ShaderMaterial for wind. Body lists draw calls
and target devices. Tied to post slug stylized-foliage-ta.
```

### Subject line

| Rule | Reason |
|------|--------|
| Use **`<area>:`** then a **short imperative** phrase (no period at end). | Scopes by *subsystem* (what broke or what artifact changed), which matches engine teams and paper supplements—not by release semantics. |
| Keep the subject **≤ 72 characters**. | Standard git / GitHub truncation; keeps `git log --oneline` readable during bisect. |
| **Do not** use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.). | Those types optimize npm libraries for semver and automated changelogs. This repo mixes articles, game analysis, Three.js demos, and site glue; `feat` vs `fix` does not help a hiring manager and mislabels non-code work. |
| Prefer **precise vocabulary** for the area (graphics: *instance culling*, *LUT*, *BC7*; design: *economy*, *counter-play*, *onboarding*; analysis: named game, mode, or patch). | Signals domain fluency to graphics and design leads without vague “game thoughts” subjects. |
| One **logical change** per commit. | Enables `git bisect` on demos and posts; mirrors how engine patches are reviewed. |

### Body (when to write one)

| Rule | Reason |
|------|--------|
| Add a body when you made a **tradeoff**, **measured** something, or **split** work across commits. | Hiring reviewers often skim blame and messages; the body is where reasoning lives (same bar as a good PR description). |
| Put **links** (paper DOI, SIGGRAPH talk, issue, post slug) in the body, not the subject. | Keeps the one-line log scannable. |
| For **visual or numerical** claims in a post, note capture conditions in the body (API, GPU, resolution, frame, tool). | Reproducibility is core graphics culture; future you will need it. |
| Wrap body text at **~72 characters** per line (soft wrap). | Matches git tradition and plays nicely with `git log` in terminals. |

---

## Areas (prefixes)

Use the smallest area that fits. If two areas change, split the commit.

| Area | Use for |
|------|---------|
| `post` | General technical articles: rendering, TA pipelines, C++, career notes. |
| `gamedesign` | Game design writing—mechanics, systems, pacing, UX, prototypes on paper. |
| `analysis` | Structured critiques and studies of specific games or patches (RTS, AAA, indie). |
| `demo` | Interactive web samples—**Three.js** (and React Three Fiber if used), WebGPU/WebGL, WASM embeds; portfolio and TA visualization scenes. |
| `shader` | HLSL/GLSL/WGSL/SLANG, Three.js `ShaderMaterial` / node graphs tied to posts or demos. |
| `asset` | Meshes, textures, EXRs, bakes, LUTs, reference photos (with license note in body if needed). |
| `site` | HTML, CSS, JS shell, routing, typography, accessibility, SEO. |
| `tool` | One-off generators, exporters, Python/C++ utilities for content. |
| `build` | CI, deploy, bundler, compression, LFS policy. |
| `meta` | LICENSE, README, this file, editor config that does not affect published output. |

**Reason for area-based prefixes:** Engine, TA, and design-adjacent teams organize history by artifact and pipeline—not by “feature vs chore.” Splitting `gamedesign` and `analysis` from generic `post` keeps RTS deep dives (e.g. CoH3) scannable separately from shader math posts; `demo` marks Three.js portfolio work clearly in the log.

---

## Content-specific rules

| Rule | Reason |
|------|--------|
| **Large binaries**: commit in isolation; body mentions size, source, and compression. Prefer **Git LFS** once assets grow. | Keeps text history blame useful; avoids mixing refactors with multi‑MB dumps. |
| **WIP posts**: commit to a branch; on `main`, messages should describe a **coherent slice** (section, figure set, or demo milestone). | `main` is public portfolio; messy WIP messages read as noise to recruiters. |
| **Renames/moves**: subject states intent (`post: rename slug for clustered-shading`). | Pure renames without context waste reviewer time in diffs. |
| **Fixes**: use normal language (`site: correct gamma on hero screenshot`), not `fix:`. | “Fix” without subsystem context is weaker than naming what was wrong in graphics terms. |
| **AI-assisted edits**: optional `Assisted-by: Cursor` (or similar) in the body for transparency—not in the subject. | Honest attribution without cluttering the one-liner. |
| **Game analysis media**: note **spoiler scope**, capture source (your footage vs marketing), and rights/fair-use stance in the body when using screenshots or audio. | Public portfolio; clarity avoids ambiguity for readers and hosts. |
| **Three.js demos**: when performance matters, body notes **revision**, key extensions (e.g. postprocessing), and rough **draw calls / texture memory** if you optimized for it. | TA and graphics interviews often ask “what did you measure?”—commit body is a lightweight audit trail. |
| Do not mix **unrelated** `analysis` / `gamedesign` / `demo` in one commit unless the body explains one deliverable (e.g. analysis post + its figure demo). | Keeps bisect sane when a Three.js scene breaks independently of prose. |

---

## What good history looks like (targets)

Aim for a log a technical lead could scroll in two minutes and infer:

1. **What systems you touch** (rendering, TA, design, analysis, Three.js demos).
2. **That you commit in reviewable units** (bisect-friendly).
3. **That you document tradeoffs** when GPU, art pipeline, or design claims need backing.

Avoid: vague subjects (`update stuff`, `changes`, `wip`), subject lines that are entire paragraphs, and commit storms that mix unrelated post + site + asset without reason in the body.

---

## Agents and automation

When an agent creates commits in this repo, it must follow this document—not Conventional Commits—and should ask before committing unless the user explicitly requested a commit.
