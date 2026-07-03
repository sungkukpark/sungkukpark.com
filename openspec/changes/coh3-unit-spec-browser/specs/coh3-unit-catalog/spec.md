## ADDED Requirements

### Requirement: Faction selection

The system SHALL let users filter units by faction using the coh3-data race keys (`american`, `german`, `british`, `afrika_korps`, `british_africa`).

#### Scenario: Faction chosen

- **WHEN** user selects a faction
- **THEN** the unit list only includes units from that faction’s sbps race file

#### Scenario: Default faction

- **WHEN** user opens the unit list without a faction query param
- **THEN** the UI prompts for faction selection or applies a documented default (e.g. last used from localStorage)

### Requirement: Category selection

The system SHALL let users filter by unit category: infantry, vehicles, team_weapons, emplacements, aircraft.

#### Scenario: Category tab

- **WHEN** user selects a category tab
- **THEN** the list shows only units under that category key in the sbps JSON

### Requirement: Text search

The system SHALL filter the current list by substring match on `displayName` and `unitKey` without an extra network request.

#### Scenario: Search narrows list

- **WHEN** user types in the search field
- **THEN** only matching units remain visible in the list

### Requirement: Unit detail page

The system SHALL provide a dedicated view per unit showing all spec sections and an optional raw JSON view of the normalized detail object.

#### Scenario: Navigate from list

- **WHEN** user activates a unit row
- **THEN** the detail route opens with the correct `{faction}/{category}/{unitKey}`

#### Scenario: Raw audit mode

- **WHEN** user enables “Show raw JSON”
- **THEN** the full detail payload is visible as formatted JSON

### Requirement: Data version visibility

The system SHALL show the active coh3-data `dataTag` on list and detail views.

#### Scenario: Patch visibility

- **WHEN** user views the unit list or detail
- **THEN** the UI displays the same `dataTag` as in the ingest manifest
