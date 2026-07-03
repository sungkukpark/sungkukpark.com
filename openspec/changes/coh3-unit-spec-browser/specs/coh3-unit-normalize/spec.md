## ADDED Requirements

### Requirement: Stable unit identifiers

The system SHALL assign each playable unit a stable id `{faction}/{category}/{unitKey}` derived from coh3-data `sbps` structure.

#### Scenario: Index generation

- **WHEN** ingest processes `chunked/sbps/races/{faction}.json`
- **THEN** every unit object under supported categories appears exactly once in the unit index

### Requirement: Display names

The system SHALL resolve human-readable names using `locstring.json` when squad or UI extensions reference locstring ids.

#### Scenario: Locstring present

- **WHEN** a unit references a resolvable locstring id
- **THEN** `displayName` equals the locstring value

#### Scenario: Locstring missing

- **WHEN** resolution fails
- **THEN** `displayName` falls back to `unitKey` and the build report records the unit id

### Requirement: Exhaustive spec listing

The system SHALL include all extension fields from the unit’s raw `sbps` record in the detail payload, grouped by extension type.

#### Scenario: User opens unit detail

- **WHEN** detail data is loaded
- **THEN** every key under each `extensions` / `squadexts` entry is present in at least one spec section or raw JSON view

### Requirement: Linked combat data

The system SHALL attach nested spec sections for linked entities and weapons when references can be resolved in `ebps` and `weapon.json`.

#### Scenario: Squad with weapons

- **WHEN** a unit loadout references entities with weapon extensions
- **THEN** detail includes weapon sections with stats from `weapon.json`
