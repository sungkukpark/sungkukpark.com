## ADDED Requirements

### Requirement: Pinned coh3-data version

The system SHALL record a single `dataTag` matching [coh3-data tags](https://github.com/cohstats/coh3-data/tags) and use it for all ingest URLs.

#### Scenario: Tag configured

- **WHEN** a build or ingest command runs
- **THEN** all downloads use `https://data.coh3stats.com/cohstats/coh3-data/{dataTag}/data/...`

#### Scenario: Tag missing on CDN

- **WHEN** the configured `dataTag` returns 404
- **THEN** ingest fails with a clear error naming the tag and URL

### Requirement: Ingest manifest

The system SHALL write a manifest containing `dataTag`, ingest timestamp, and checksums or sizes of ingested source files.

#### Scenario: Successful ingest

- **WHEN** ingest completes
- **THEN** `manifest.json` exists and is referenced by the built UI for version display

### Requirement: Attribution

The system SHALL display COH3 Stats open-data attribution and the active `dataTag` on every COH3 hub page.

#### Scenario: User views hub

- **WHEN** any `/coh3` page renders
- **THEN** a footer or badge links to `https://coh3stats.com/other/open-data` and shows the current `dataTag`
