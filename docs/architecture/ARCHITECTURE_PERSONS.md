# Persons — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — §11 #1, #4 cross-linked to APPLICATION and LOGBOOK issues (consistency pass)

## Table of Contents

1. [Overview](#1-overview)
2. [Key Concepts](#2-key-concepts)
3. [How It Works](#3-how-it-works)
4. [Components & Files](#4-components--files)
5. [Data Model & Persistence](#5-data-model--persistence)
6. [Data Flow](#6-data-flow)
7. [Config & Constants](#7-config--constants)
8. [Error Handling & Edge Cases](#8-error-handling--edge-cases)
9. [Integration Points](#9-integration-points)
10. [Testing](#10-testing)
11. [Known Issues & Tech Debt](#11-known-issues--tech-debt)
12. [Rules for Future Development](#12-rules-for-future-development)
13. [AI Notes](#13-ai-notes)

## 1. Overview

Persons is the pilot's directory of people ("crew members", `CHANGELOG.md:266`) and the link between those people and individual flight records. A pilot keeps a list of persons (name, phone, email, remarks), attaches any of them to a flight with a free-text role, and can open a person to see every flight they were on (`README.md:228-230`), with a summed total-time footer (`app/ui/src/components/Persons/PersonViewFlightsTable.jsx:64-74,111`).

Backend: 12 handlers in `app/handlers_person.go` mounted under `/api/person` (`app/routes.go:105-118`), DBModel methods in `internal/models/persons.go`, tables `persons` and `person_to_log` (`internal/driver/db_structure.go:147-166`). UI: the Persons list page (`/persons`), the Person view page (`/persons/:uuid`) (`app/ui/src/main.jsx:62-67`), and the "Persons" card embedded in the flight record page (`app/ui/src/components/FlightRecord/FlightRecord.jsx:82`). Persons are also created and linked by the import (`app/handlers_import.go:227-334`) and copied by the "Return flight" action (`app/ui/src/components/FlightRecord/ReturnFlightRecordButton.jsx:32`).

## 2. Key Concepts

| Term | Meaning | Evidence |
|---|---|---|
| Person | Row in `persons`: server-generated UUID v4 + `first_name`, `middle_name`, `last_name`, `phone`, `email`, `remarks` (all NOT NULL text) | `internal/driver/db_structure.go:147-155`, `internal/models/structs.go:103-111`, `HandlerApiPersonNew` in `app/handlers_person.go:44-49` |
| Person-to-log link | Row in `person_to_log` joining `person_uuid` to a logbook record `log_uuid` with a `role`. It has its own `uuid` PK, which is generated but never used for lookups | `internal/driver/db_structure.go:157-166` (TODO comment), `internal/models/structs.go:113-118` |
| Link identity | In practice a link is addressed by the pair `(log_uuid, person_uuid)`: update and delete use that pair, never the link `uuid` | `UpdatePersonToLog` `internal/models/persons.go:137`, `DeletePersonToLog` `internal/models/persons.go:147` |
| Role | Free text stored per link. There is no roles table; the role list is `SELECT DISTINCT role FROM person_to_log` | `GetPersonsRoles` `internal/models/persons.go:200-220` |
| PersonForLog | `Person` embedded + `role`; marshals to a flat JSON object | `internal/models/structs.go:120-123` |
| FlightRecordForPerson | Flight summary for the person view: `log_uuid`, `role`, `date`, `departure`, `arrival`, `total_time` (**string**), `aircraft{model, reg_name}`, `sim_type` | `internal/models/structs.go:125-137` |
| Name uniqueness | `AddPerson` rejects an exact (first, middle, last) triple that already exists. Application-level check only; no DB constraint | `internal/models/persons.go:73-78` |
| Link uniqueness | `AddPersonToLog` rejects an existing (person_uuid, log_uuid) pair. Application-level check only | `internal/models/persons.go:112-117` |
| Cascade on person delete | `DeletePerson` deletes the person's links, then the person (in code, no FK) | `internal/models/persons.go:186-196` |
| No cascade on flight delete | Deleting a flight record removes attachments but not `person_to_log` rows | `HandlerApiFlightRecordDelete` `app/handlers_flightrecord.go:52-70`, `DeleteFlightRecord` `internal/models/flightrecords.go:119-125` |
| Display name | `printPerson` = `` `${first_name} ${middle_name} ${last_name}` `` (two spaces when the middle name is empty) | `app/ui/src/util/helpers.jsx:269-272` |
| Time in minutes | Since v5, `logbook.total_time` is integer minutes and dates are ISO `YYYY-MM-DD` | `internal/driver/db_structure.go:35`, `internal/driver/data_overhaul.go:15` |

## 3. How It Works

| # | User action | What happens | Evidence |
|---|---|---|---|
| 1 | Open "Persons" in the nav | `/persons` → `PersonsPage` → `Persons` grid loads `GET /api/person/list` | `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:47`, `app/ui/src/components/Persons/Persons.jsx:20-26` |
| 2 | Add a person | Toolbar "Add Person" opens `AddEditPersonModal` with `isNew: true` → Save → `POST /api/person` → server assigns UUID → returns created person → `["persons"]` invalidated | `app/ui/src/components/Persons/AddPersonButton.jsx:14-18`, `app/ui/src/components/Persons/SavePersonButton.jsx:14-27` |
| 3 | Edit a person | Row menu "Edit" opens the same modal with the row → `PUT /api/person`; or edit in the Person view card and press Save | `app/ui/src/components/Persons/EditPersonButton.jsx:15-19`, `app/ui/src/components/Persons/PersonView.jsx:63-64` |
| 4 | Delete a person | Row menu "Delete" → confirm "delete this person and all references" → `DELETE /api/person/{uuid}` → links then person removed | `app/ui/src/components/Persons/DeletePersonButton.jsx:26-36`, `internal/models/persons.go:182-197` |
| 5 | View a person | Row menu "View" → `/persons/{uuid}` → `GET /api/person/{uuid}` + `GET /api/person/logs-for-person/{uuid}` | `app/ui/src/components/Persons/ViewPersonButton.jsx:13`, `app/ui/src/components/Persons/PersonView.jsx:27-41` |
| 6 | Attach a person to a flight | On a saved flight (not `new`) → "Persons" card → "+" → modal: pick existing person (`PersonSelect`) or create one inline (`AddPersonButton`), type/pick role (`PersonRole`) → `POST /api/person/person-to-log` | `app/ui/src/components/Persons/FlightRecordPersons.jsx:26-35`, `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx:79-117` |
| 7 | Change role on a flight | Click the person icon → "Edit Person" → same modal, person selector hidden (`isNew: false`) → `PUT /api/person/person-to-log` | `app/ui/src/components/Persons/EditFlightRecordPersonButton.jsx:13-17`, `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx:97` |
| 8 | Remove a person from a flight | Person icon → "Delete Person" → confirm → `DELETE /api/person/person-to-log` with JSON body | `app/ui/src/components/Persons/DeletePersonToLogButton.jsx:16-36` |
| 9 | Jump to a flight | Person view flights grid: date cell links to `/logbook/{log_uuid}` | `app/ui/src/components/Persons/PersonViewFlightsTable.jsx:35` |
| 10 | Return flight | "Return" puts `copy_persons: <source uuid>` into the new-flight state; after the new record is created, `POST /api/person/copy-flight-record` copies links and roles | `app/ui/src/components/FlightRecord/ReturnFlightRecordButton.jsx:32`, `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:32-34` |
| 11 | Import with "Create Persons" | Import creates persons from PIC name and selected custom fields and links them (role `PIC` or the custom field name) | `app/handlers_import.go:309-333` |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/handlers_person.go` | 12 HTTP handlers: decode JSON / URL params, generate UUIDs, call DBModel, write JSON |
| `app/routes.go:104-118` | `/api/person` sub-router (under `app.Auth`) |
| `internal/models/persons.go` | All SQL for `persons` / `person_to_log` (13 methods incl. helper) |
| `internal/models/structs.go:102-137` | `Person`, `PersonToLog`, `PersonForLog`, `FlightRecordForPerson` |
| `internal/driver/db_structure.go:147-166` | Declarative DDL for both tables |
| `app/ui/src/pages/PersonsPage.jsx` | Wrapper → `Persons` |
| `app/ui/src/pages/PersonViewPage.jsx` | Wrapper → `PersonView` |
| `app/ui/src/components/Persons/Persons.jsx` | Persons list grid (`XDataGrid`, `tableId='persons'`) + row actions + toolbar |
| `app/ui/src/components/Persons/PersonView.jsx` | Person page: flights grid (left) + editable data card (right) |
| `app/ui/src/components/Persons/PersonViewFlightsTable.jsx` | Flights-of-person grid, total-time sum footer, CSV export |
| `app/ui/src/components/Persons/PersonDataCard.jsx` | Six text fields for the person view |
| `app/ui/src/components/Persons/AddEditPersonModal.jsx` | Create/edit person dialog |
| `app/ui/src/components/Persons/SavePersonButton.jsx` | Create/update mutation, invalidates `["persons"]` |
| `app/ui/src/components/Persons/AddPersonButton.jsx` | Opens the dialog; toolbar or icon variant; returns the created person via `onSave` |
| `app/ui/src/components/Persons/EditPersonButton.jsx` | Opens the dialog for a row or a payload |
| `app/ui/src/components/Persons/DeletePersonButton.jsx` | Confirm + delete mutation |
| `app/ui/src/components/Persons/ViewPersonButton.jsx` | Navigates to `/persons/{uuid}` |
| `app/ui/src/components/Persons/FlightRecordPersons.jsx` | "Persons" card on the flight record page |
| `app/ui/src/components/Persons/PersonForLog.jsx` | One attached person: link to person page + edit/delete menu |
| `app/ui/src/components/Persons/AddFlightrecordPersonButton.jsx` | Opens the link dialog in "new" mode |
| `app/ui/src/components/Persons/EditFlightRecordPersonButton.jsx` | Opens the link dialog in "edit role" mode |
| `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx` | Link dialog + inner `SaveButton` mutation |
| `app/ui/src/components/Persons/DeletePersonToLogButton.jsx` | Confirm + unlink mutation |
| `app/ui/src/components/UIElements/PersonSelect.jsx` | Autocomplete over all persons (`freeSolo={false}`) |
| `app/ui/src/components/UIElements/PersonRole.jsx` | Free-solo autocomplete over existing roles |
| `app/ui/src/util/http/person.jsx` | 12 fetch functions for `/api/person/*` |
| `app/ui/src/components/UIElements/CSVExportButton.jsx:135-149` | CSV mappers `persons` and `person-flights` |

### 4.2 API Endpoints

All routes are inside the `/api` group guarded by `app.Auth` (`app/routes.go:26-27`). Success bodies for mutations are JSON strings; errors are HTTP 500 `{"ok":false,"message":"..."}` via `handleError` (`app/helpers.go:53-63`).

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/person/list` | `HandlerApiPersonList` `app/handlers_person.go:14` | gzip (`middleware.Compress(5)`, `app/routes.go:106`); `[]Person`, `[]` when empty |
| GET | `/api/person/{uuid}` | `HandlerApiPersonByID` `app/handlers_person.go:24` | param lowercased; `Person`; panics when not found (§11 #1) |
| DELETE | `/api/person/{uuid}` | `HandlerApiPersonDelete` `app/handlers_person.go:165` | param lowercased; `"Person deleted"` |
| POST | `/api/person` (sub-route `/`) | `HandlerApiPersonNew` `app/handlers_person.go:36` | body `Person`; UUID assigned by server (`app/handlers_person.go:44-49`); returns the created `Person` |
| PUT | `/api/person` (sub-route `/`) | `HandlerApiPersonUpdate` `app/handlers_person.go:61` | body `Person` incl. `uuid`; `"Person updated"` |
| GET | `/api/person/logs-for-person/{personUuid}` | `HandlerApiLogsForPerson` `app/handlers_person.go:152` | `[]FlightRecordForPerson`, `null` when none |
| GET | `/api/person/persons-for-log/{logUuid}` | `HandlerApiPersonsForLog` `app/handlers_person.go:140` | `[]PersonForLog`, `null` when none |
| POST | `/api/person/person-to-log` | `HandlerApiPersonToLogNew` `app/handlers_person.go:79` | body `{person_uuid, log_uuid, role}`; link UUID assigned by server (`app/handlers_person.go:87-92`); `"Person added"` |
| PUT | `/api/person/person-to-log` | `HandlerApiPersonToLogUpdate` `app/handlers_person.go:104` | updates `role` only; `"Person updated"` |
| DELETE | `/api/person/person-to-log` | `HandlerApiPersonToLogDelete` `app/handlers_person.go:122` | **JSON body** `{person_uuid, log_uuid}`; `"Person-to-log deleted"` |
| GET | `/api/person/roles` | `HandlerApiPersonsRoles` `app/handlers_person.go:177` | `[]string`, `null` when none |
| POST | `/api/person/copy-flight-record` | `HandlerApiCopyPersonsFlightRecord` `app/handlers_person.go:187` | body `{from_uuid, to_uuid}`; always `"Persons copied"` unless the read fails |

### 4.3 Data Access

All in `internal/models/persons.go`. Every method that runs SQL opens its own `ContextWithDefaultTimeout` (60 s, `internal/models/helpers.go:14,22`); `GetPersons` and `GetPersonById` get it through `fetchPersons` (`internal/models/persons.go:11`). `CopyPersonsForLog` opens no context of its own (`internal/models/persons.go:222-233`), so the copy has no overall timeout and each inner `GetPersonsForLog` / `AddPersonToLog` call gets its own 60 s.

| Method | Lines | Purpose | SQL / tables |
|---|---|---|---|
| `fetchPersons` | `internal/models/persons.go:10-31` | Shared SELECT + scan of 7 person columns; returns `[]Person{}` (non-nil) on success | caller's query |
| `GetPersons` | `internal/models/persons.go:34-37` | All persons, no ORDER BY | `SELECT ... FROM persons` |
| `GetPersonById` | `internal/models/persons.go:39-43` | One person; returns `persons[0]` without a length check | `persons WHERE uuid = ?` |
| `GetPersonsForLog` | `internal/models/persons.go:45-66` | Persons attached to a flight with role | `person_to_log INNER JOIN persons` on `ptl.log_uuid = ?` |
| `AddPerson` | `internal/models/persons.go:69-92` | Duplicate-name check, then INSERT | `persons` |
| `UpdatePerson` | `internal/models/persons.go:95-105` | Update all 6 data columns by `uuid` (no duplicate check) | `persons` |
| `AddPersonToLog` | `internal/models/persons.go:108-130` | Duplicate-pair check, then INSERT | `person_to_log` |
| `UpdatePersonToLog` | `internal/models/persons.go:133-140` | Set `role` by `(log_uuid, person_uuid)` | `person_to_log` |
| `DeletePersonToLog` | `internal/models/persons.go:143-150` | Delete by `(log_uuid, person_uuid)` | `person_to_log` |
| `GetFlightRecordsForPerson` | `internal/models/persons.go:152-179` | Flights of a person, `ORDER BY lb.date DESC` | `person_to_log INNER JOIN logbook_view` |
| `DeletePerson` | `internal/models/persons.go:182-197` | Delete links, then person (two statements, no transaction) | `person_to_log`, `persons` |
| `GetPersonsRoles` | `internal/models/persons.go:200-220` | Distinct roles, no ORDER BY | `SELECT DISTINCT role FROM person_to_log` |
| `CopyPersonsForLog` | `internal/models/persons.go:222-233` | Read links of `fromUUID`, insert same person+role for `toUUID`, ignore every insert error | via `GetPersonsForLog` + `AddPersonToLog` |

External callers: `app/handlers_import.go:159` (`GetPersons`), `app/handlers_import.go:272` (`AddPerson`), `app/handlers_import.go:300` (`AddPersonToLog`).

### 4.4 UI

**Routes** (`app/ui/src/main.jsx:62-67`, children of the `Root` layout route at `app/ui/src/main.jsx:40-46`): `/persons` → `PersonsPage`, `/persons/:uuid` → `PersonViewPage`. The route's `authLoader` (`app/ui/src/util/auth.jsx:18-22`) only reads the token and username from `localStorage` and does not redirect; nothing on the client guards these pages. The redirect to `/signin` happens only when an API call returns 401 (`handle401`, `app/ui/src/util/http/http.jsx:6-11,17`; see [ARCHITECTURE_FRONTEND.md](ARCHITECTURE_FRONTEND.md) §11 #8). The flight record page embeds `FlightRecordPersons` (`app/ui/src/components/FlightRecord/FlightRecord.jsx:82`).

**Query keys** (all `useQuery` calls are inline in components; Persons has no hook in `app/ui/src/hooks/queries/`):

| Key | Fetcher | Used in | staleTime / gcTime |
|---|---|---|---|
| `["persons"]` | `fetchPersons` | `app/ui/src/components/Persons/Persons.jsx:20-26`, `app/ui/src/components/UIElements/PersonSelect.jsx:16-21` | 1 h / 1 h |
| `["persons", "person", uuid]` | `fetchPersonByUuid` | `app/ui/src/components/Persons/PersonView.jsx:27-32` | 1 h / 1 h |
| `["persons", "flights", uuid]` | `fetchLogsForPerson` | `app/ui/src/components/Persons/PersonView.jsx:35-41` | 1 h / 1 h |
| `["persons", "log", logUuid]` | `fetchPersonsForLog` | `app/ui/src/components/Persons/FlightRecordPersons.jsx:14-20` (`enabled: id !== "new"`) | 1 h / 1 h |
| `["persons", "roles"]` | `fetchRoles` | `app/ui/src/components/UIElements/PersonRole.jsx:8-14` (`select: data \|\| []`) | 1 h / 1 h |

**Invalidation** (TanStack prefix match — `["persons"]` invalidates every key above):

| Mutation | Invalidates | Evidence |
|---|---|---|
| Create/update person | `["persons"]` | `app/ui/src/components/Persons/SavePersonButton.jsx:25` |
| Delete person | `["persons"]` | `app/ui/src/components/Persons/DeletePersonButton.jsx:20` |
| Create/update link | `["persons","log",log_uuid]`, `["persons","flights"]`, `["persons","roles"]` | `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx:49-51` |
| Delete link | `["persons","log",logUuid]`, `["persons","flights"]` | `app/ui/src/components/Persons/DeletePersonToLogButton.jsx:19-20` |
| Copy links (Return flight) | none | `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:20-22` |
| Import run | everything (`invalidateQueries()`) | `app/ui/src/components/Import/RunImportButton.jsx:34` |

**HTTP functions** live in `app/ui/src/util/http/person.jsx`, which is not re-exported from `app/ui/src/util/http/index.js`. Each one sends `Authorization: Bearer <token>` from `getAuthToken` (`app/ui/src/util/auth.jsx:13`) and goes through `handleFetch` (`app/ui/src/util/http/http.jsx:13-31`).

| Function | Line | Call |
|---|---|---|
| `fetchPersons` | `app/ui/src/util/http/person.jsx:5` | GET `/person/list` |
| `fetchPersonByUuid` | `app/ui/src/util/http/person.jsx:15` | GET `/person/{uuid}` |
| `fetchPersonsForLog` | `app/ui/src/util/http/person.jsx:25` | GET `/person/persons-for-log/{logUuid}` |
| `fetchLogsForPerson` | `app/ui/src/util/http/person.jsx:35` | GET `/person/logs-for-person/{personUuid}` |
| `createPerson` / `updatePerson` | `app/ui/src/util/http/person.jsx:45`, `app/ui/src/util/http/person.jsx:55` | POST / PUT `/person` |
| `createPersonToLog` / `updatePersonToLog` / `deletePersonToLog` | `app/ui/src/util/http/person.jsx:65`, `app/ui/src/util/http/person.jsx:75`, `app/ui/src/util/http/person.jsx:85` | POST / PUT / DELETE `/person/person-to-log` |
| `deletePerson` | `app/ui/src/util/http/person.jsx:95` | DELETE `/person/{uuid}` |
| `fetchRoles` | `app/ui/src/util/http/person.jsx:104` | GET `/person/roles` |
| `copyPersonsFlightRecord` | `app/ui/src/util/http/person.jsx:114` | POST `/person/copy-flight-record` |

**Grids**: `Persons` columns first/middle/last name, phone, email, remarks + actions View/Edit/Delete (`app/ui/src/components/Persons/Persons.jsx:29-50`). `PersonsViewFlightsTable` columns date (link), role, departure, arrival, total (sum footer), type, reg, sim (`app/ui/src/components/Persons/PersonViewFlightsTable.jsx:23-97`); date and time formats come from `useSettings` (`app/ui/src/components/Persons/PersonViewFlightsTable.jsx:21`).

## 5. Data Model & Persistence

**`persons`** (`internal/driver/db_structure.go:147-155`)

| Column | SQLite | MySQL | Properties |
|---|---|---|---|
| `uuid` (PK) | TEXT | VARCHAR(36) | PRIMARY KEY |
| `first_name`, `middle_name`, `last_name` | TEXT | VARCHAR(255) | NOT NULL |
| `phone`, `email` | TEXT | VARCHAR(255) | NOT NULL DEFAULT '' |
| `remarks` | TEXT | VARCHAR(512) | NOT NULL DEFAULT '' |

**`person_to_log`** (`internal/driver/db_structure.go:161-166`)

| Column | SQLite | MySQL | Properties |
|---|---|---|---|
| `uuid` (PK) | TEXT | VARCHAR(36) | PRIMARY KEY (unused for lookups, TODO at `internal/driver/db_structure.go:157-160`) |
| `person_uuid` | TEXT | VARCHAR(36) | NOT NULL |
| `log_uuid` | TEXT | VARCHAR(36) | NOT NULL |
| `role` | TEXT | VARCHAR(255) | NOT NULL |

Type mapping: `UUID`, `SmallText`, `BigText` (`internal/driver/db_structure.go:6,8,9`). Tables are created with only the PK and columns are added by `ALTER TABLE ... ADD COLUMN` (`internal/driver/db_operations.go:30,32,94-112,167-172`).

- No foreign keys, no UNIQUE constraints, no secondary indexes on either table (no `Index: true` in `internal/driver/db_structure.go:147-166`).
- Read-only dependency on view `logbook_view` (`internal/driver/db_structure.go:168-227`) for `GetFlightRecordsForPerson`; `logbook_view.total_time` is the integer-minute column from `logbook` (`internal/driver/db_structure.go:35,177`).
- Both tables are registered in `validateDB`'s table list (`internal/driver/driver.go:60-64`), which runs only when the stored version differs from `schemaVersion` (`internal/driver/driver.go:56`, value `"101"` at `internal/driver/db_structure.go:4`). The v5 data-overhaul migration does not touch these tables (no reference in `internal/driver/data_overhaul.go`).
- **Persists:** DB only. **In memory:** TanStack Query cache (1 h); grid pagination/column/filter state in `localStorage` keys `persons-pagination`, `persons-columns`, `persons-filter-model`, `persons-quick-filter-model` and the same four with the `person-flights-` prefix (`app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:111-112`; filter keys via `FilterProvider storageKey={tableId}` at `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:292`, `app/ui/src/components/UIElements/XDataGrid/FilterContext.jsx:7-8`); per-import-run name caches `personCache` / `lastNameCache` (`app/handlers_import.go:157-167`).

## 6. Data Flow

| Operation | UI → HTTP | Handler → Model | SQL | Back to UI |
|---|---|---|---|---|
| List | `app/ui/src/components/Persons/Persons.jsx:20-26` → `fetchPersons` → `GET /api/person/list` | `HandlerApiPersonList` → `GetPersons` → `fetchPersons` | `SELECT uuid, first_name, ... FROM persons` (`internal/models/persons.go:35`) | `[]Person` → grid rows keyed by `uuid` (`app/ui/src/components/Persons/Persons.jsx:68`) |
| Create | `app/ui/src/components/Persons/SavePersonButton.jsx:15` → `createPerson` → `POST /api/person` | `HandlerApiPersonNew` (UUID `app/handlers_person.go:44-49`) → `AddPerson` | dup check `internal/models/persons.go:74`, `INSERT INTO persons` `internal/models/persons.go:80` | created `Person` → `onClose(savedPerson)` (`app/ui/src/components/Persons/SavePersonButton.jsx:32-33`) → `AddPersonButton` `onSave` (`app/ui/src/components/Persons/AddPersonButton.jsx:16-17`) |
| Update | `app/ui/src/components/Persons/SavePersonButton.jsx:16` → `updatePerson` → `PUT /api/person` | `HandlerApiPersonUpdate` → `UpdatePerson` | `UPDATE persons SET ... WHERE uuid = ?` (`internal/models/persons.go:99`) | `"Person updated"`; `["persons"]` refetched |
| Delete | `app/ui/src/components/Persons/DeletePersonButton.jsx:18` → `DELETE /api/person/{uuid}` | `HandlerApiPersonDelete` → `DeletePerson` | `DELETE FROM person_to_log WHERE person_uuid = ?` then `DELETE FROM persons WHERE uuid = ?` (`internal/models/persons.go:187,194`) | `"Person deleted"` |
| View | `app/ui/src/components/Persons/PersonView.jsx:29,37` → `GET /api/person/{uuid}`, `GET /api/person/logs-for-person/{uuid}` | `HandlerApiPersonByID` → `GetPersonById`; `HandlerApiLogsForPerson` → `GetFlightRecordsForPerson` | `persons WHERE uuid = ?` (`internal/models/persons.go:40`); `person_to_log JOIN logbook_view ... ORDER BY lb.date DESC` (`internal/models/persons.go:156-161`) | person copied into local state (`app/ui/src/components/Persons/PersonView.jsx:46-51`); flights grid |
| Flight card | `app/ui/src/components/Persons/FlightRecordPersons.jsx:16` → `GET /api/person/persons-for-log/{logUuid}` | `HandlerApiPersonsForLog` → `GetPersonsForLog` | `person_to_log JOIN persons WHERE ptl.log_uuid = ?` (`internal/models/persons.go:49`) | one `PersonForLog` row per person (`app/ui/src/components/Persons/FlightRecordPersons.jsx:30-32`) |
| Link | `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx:37-45` → `POST`/`PUT /api/person/person-to-log` | `HandlerApiPersonToLogNew` → `AddPersonToLog`; `HandlerApiPersonToLogUpdate` → `UpdatePersonToLog` | dup check `internal/models/persons.go:113`, INSERT `internal/models/persons.go:119`; UPDATE role `internal/models/persons.go:137` | string message; three keys invalidated |
| Unlink | `app/ui/src/components/Persons/DeletePersonToLogButton.jsx:17` → `DELETE /api/person/person-to-log` + body | `HandlerApiPersonToLogDelete` → `DeletePersonToLog` | `DELETE FROM person_to_log WHERE log_uuid = ? AND person_uuid = ?` (`internal/models/persons.go:147`) | string message |
| Roles | `app/ui/src/components/UIElements/PersonRole.jsx:8-14` → `GET /api/person/roles` | `HandlerApiPersonsRoles` → `GetPersonsRoles` | `SELECT DISTINCT role FROM person_to_log` (`internal/models/persons.go:204`) | autocomplete options |
| Copy | `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:32-34` → `POST /api/person/copy-flight-record` | `HandlerApiCopyPersonsFlightRecord` → `CopyPersonsForLog` | `GetPersonsForLog(from)` + `AddPersonToLog` per person (`internal/models/persons.go:223-231`) | `"Persons copied"` |

## 7. Config & Constants

| Name | Value | Where | Kind |
|---|---|---|---|
| DB query timeout | 60 s (`DefaultTimeout`) | `internal/models/helpers.go:14` | (hardcoded) |
| gzip level for `/person/list` | 5 | `app/routes.go:106` | (hardcoded) |
| Query `staleTime` / `gcTime` | 3600000 ms (1 h) | `app/ui/src/components/Persons/Persons.jsx:23-24`, `app/ui/src/components/Persons/PersonView.jsx:30-31,38-39`, `app/ui/src/components/Persons/FlightRecordPersons.jsx:18-19`, `app/ui/src/components/UIElements/PersonSelect.jsx:19-20`, `app/ui/src/components/UIElements/PersonRole.jsx:11-12` | (hardcoded) |
| `refetchOnWindowFocus` | `false` for list and person flights | `app/ui/src/components/Persons/Persons.jsx:25`, `app/ui/src/components/Persons/PersonView.jsx:40` | (hardcoded) |
| API base URL | `/api`; `http://localhost:4000/api` in Vite dev mode | `app/ui/src/constants/constants.jsx:9-12` | (hardcoded, by build mode) |
| Date display format | `dateFieldsFormat`, default `DD/MM/YYYY` | `app/ui/src/hooks/useSettings.jsx:137`, used at `app/ui/src/components/Persons/PersonViewFlightsTable.jsx:31` | (configurable, Settings) |
| Time display format | `timeFieldsFormat`, default `1` (HH:MM) | `app/ui/src/hooks/useSettings.jsx:136`, used at `app/ui/src/components/Persons/PersonViewFlightsTable.jsx:72-73` | (configurable, Settings) |
| Date parse format of `date` | `YYYY-MM-DD` | `app/ui/src/components/Persons/PersonViewFlightsTable.jsx:30` | (hardcoded) |
| MySQL column limits | name/phone/email/role 255, remarks 512 chars | `internal/driver/db_structure.go:8-9,149-154,165` | (hardcoded) |
| Import role for PIC | `"PIC"` | `app/handlers_import.go:310` | (hardcoded) |
| Import role fallback for custom fields | `"Crew"` when field name unknown/empty | `app/handlers_import.go:322-324` | (hardcoded) |
| Import "self" names skipped | `"Self"` and settings `SelfPICLabel` | `app/handlers_import.go:141-144,236` | (configurable, Settings) |
| Import name formats | `fn_mn_ln` (default), `ln_fn_md`, `fn_ln_md` | `app/handlers_import.go:366-424` | (configurable per import run) |
| Grid ids | `persons`, `person-flights` (also CSV file names) | `app/ui/src/components/Persons/Persons.jsx:62`, `app/ui/src/components/Persons/PersonViewFlightsTable.jsx:104`, `app/ui/src/components/UIElements/CSVExportButton.jsx:135,141` | (hardcoded) |

## 8. Error Handling & Edge Cases

| Situation | Behaviour | Evidence |
|---|---|---|
| Any handler error (bad JSON, DB error, duplicate) | HTTP 500 + `{"ok":false,"message":err}`; there is no 400/404/409 distinction | `app/helpers.go:53-63` |
| UI error display | The notification shows `error.info?.message \|\| error?.message \|\| fallbackMessage` for 3 s. For HTTP errors `handleFetch` always sets both `error.message` (status text or the fetcher's text) and `error.info` (the backend JSON, or a message built from the fetcher's text and the status text), so the component's `fallbackMessage` is practically never shown. On a dropped connection (§11 #1) `fetch` rejects with a `TypeError` that has no `.info`, so the browser's network-error text (e.g. `Failed to fetch`) is shown | `app/ui/src/hooks/useAppNotifications.jsx:9-14`, `app/ui/src/util/http/http.jsx:13-31` |
| Duplicate person name | `Person <first> <middle> <last> already exists` | `internal/models/persons.go:77` |
| Duplicate link | `person-to-log record for person X and log Y already exists` | `internal/models/persons.go:116` |
| Unknown person UUID on `GET /api/person/{uuid}` | index out of range panic; no recover middleware in the router | `internal/models/persons.go:41-42`, `app/routes.go:9-22` (§11 #1) |
| Unknown UUID on update / link update / unlink | statements affect 0 rows, success message returned | `internal/models/persons.go:99-104,137-139,147-149` |
| Empty results | `/list` returns `[]`; `/persons-for-log`, `/logs-for-person`, `/roles` return `null` (nil slices) | `internal/models/persons.go:20` vs `internal/models/persons.go:45,152,200` |
| `null` handling in UI | roles: `select: data \|\| []`; flight card: `(data && data.length) && ...` | `app/ui/src/components/UIElements/PersonRole.jsx:13`, `app/ui/src/components/Persons/FlightRecordPersons.jsx:30` |
| New flight record | Persons card hidden and query disabled until the flight has a UUID | `app/ui/src/components/Persons/FlightRecordPersons.jsx:17,26` |
| Edit link | Person cannot be changed, only role (selector rendered only when `isNew`) | `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx:97-110` |
| Save link without picking a person | `''.id` → `undefined` → `person_uuid` omitted from JSON → row stored with `person_uuid = ''` | `app/ui/src/components/Persons/AddFlightrecordPersonButton.jsx:15`, `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx:38` (§11 #3) |
| Role field | Free text; typed text is written on every keystroke via `onInputChange` | `app/ui/src/components/UIElements/PersonRole.jsx:24-28` |
| Empty person form | No client or server validation; an all-empty person can be created once | `app/ui/src/components/Persons/AddEditPersonModal.jsx:49-90`, `HandlerApiPersonNew` `app/handlers_person.go:36-58` |
| Add dialog initial payload lacks `phone`/`email`/`remarks` | Those inputs start with `value={undefined}` (uncontrolled), unlike `PersonDataCard` which uses `?? ''` | `app/ui/src/components/Persons/AddPersonButton.jsx:15`, `app/ui/src/components/Persons/AddEditPersonModal.jsx:75-89`, `app/ui/src/components/Persons/PersonDataCard.jsx:33-47` |
| Long remarks on MySQL | Column is VARCHAR(512); no UI limit | `internal/driver/db_structure.go:9,154` |
| Extra JSON fields (`isNew`) | Ignored by `json.Decoder` (no `DisallowUnknownFields`) | `app/handlers_person.go:38`, `app/ui/src/components/Persons/AddPersonButton.jsx:15` |
| Deleting a flight | Links stay in `person_to_log`; they disappear from reads because of the INNER JOINs but still feed `/roles` | `internal/models/flightrecords.go:119-125`, `internal/models/persons.go:49,159,204` |
| Copy with errors | Errors from `uuid.NewRandom` and `AddPersonToLog` are discarded | `internal/models/persons.go:228-230` |

## 9. Integration Points

| System | What crosses the boundary |
|---|---|
| [ARCHITECTURE_APPLICATION.md](ARCHITECTURE_APPLICATION.md) | `/api/person` sub-router (`app/routes.go:105-118`), `writeJSON` / `handleError` (`app/helpers.go:16,53`), server `ErrorLog` receives panic traces (`app/main.go:55`) |
| [ARCHITECTURE_AUTH.md](ARCHITECTURE_AUTH.md) | All person routes behind `app.Auth` (`app/routes.go:27`, `app/handlers_auth.go:112`); UI sends the bearer token (`app/ui/src/util/auth.jsx:13`); 401 → `/signin` (`app/ui/src/util/http/http.jsx:6-11`) |
| [ARCHITECTURE_DATABASE.md](ARCHITECTURE_DATABASE.md) | DDL for `persons`, `person_to_log`, `logbook_view`; `schemaVersion`; `validateDB` table list (`internal/driver/driver.go:60-64`); `ContextWithDefaultTimeout` |
| [ARCHITECTURE_LOGBOOK.md](ARCHITECTURE_LOGBOOK.md) | `log_uuid` = `logbook.uuid`; reads `logbook_view` columns `uuid, date, departure_place, arrival_place, total_time, aircraft_model, reg_name, sim_type` (`internal/models/persons.go:156-161`); flight page embeds `FlightRecordPersons` (`app/ui/src/components/FlightRecord/FlightRecord.jsx:82`); Return flight → `copy_persons` (`app/ui/src/components/FlightRecord/ReturnFlightRecordButton.jsx:32`, `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:32-34`); flight delete does not touch links (`app/handlers_flightrecord.go:52-70`) |
| [ARCHITECTURE_IMPORT.md](ARCHITECTURE_IMPORT.md) | Options `create_persons`, `create_person_format`, `create_person_from` (`app/handlers_import.go:68-70`); calls `GetPersons`, `AddPerson`, `AddPersonToLog` (`app/handlers_import.go:159,272,300`); `parseName` (`app/handlers_import.go:366`) |
| [ARCHITECTURE_SETTINGS.md](ARCHITECTURE_SETTINGS.md) | `timeFieldsFormat`, `dateFieldsFormat` from `useSettings` (`app/ui/src/components/Persons/PersonViewFlightsTable.jsx:21`); `SelfPICLabel` used by import (`app/handlers_import.go:144`) |
| [ARCHITECTURE_FRONTEND.md](ARCHITECTURE_FRONTEND.md) | Routes in `app/ui/src/main.jsx:62-67`, nav item (`app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:47`), `XDataGrid`, `CSVExportButton`, `useDialogs`, `useAppNotifications`, `queryClient`, `handleFetch`, `API_URL` |

## 10. Testing

| Area | Existing tests | How to run |
|---|---|---|
| `app/handlers_person.go`, `internal/models/persons.go` | None | — |
| Import name parsing used when creating persons | `TestParseName` `app/handlers_import_test.go:7` | `make test` (`Makefile:32-33`, runs `go fmt` then `go test -v ./... -coverpkg=./...`; needs `make build_ui` first because of the UI embed) |
| `app/ui/src/components/Persons/*`, `app/ui/src/util/http/person.jsx` | None (UI tests exist only for hooks and Currency helpers) | `cd app/ui && npm run test:run` (`app/ui/package.json:12`, vitest) |

Gaps worth covering first: `GetPersonById` with an unknown UUID; `AddPerson`/`AddPersonToLog` duplicate paths; `DeletePerson` removing links; `CopyPersonsForLog` with an existing link at the target; `GetFlightRecordsForPerson` ordering and `total_time` type on both SQLite and MySQL.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | `GetPersonById` indexes `persons[0]` without a length check. Unknown UUID → `fetchPersons` returns `[]Person{}` (`internal/models/persons.go:20`); query error → `nil` (`internal/models/persons.go:16`). Both panic with index out of range before the error is returned. No recover middleware in the router, so `net/http` drops the connection and the UI gets a network error instead of a JSON 500. Reachable via a stale `/persons/{uuid}` URL or a person deleted in another tab. The missing recovery middleware is the shared root cause, owned by [ARCHITECTURE_APPLICATION.md](ARCHITECTURE_APPLICATION.md) §11 #19 | `internal/models/persons.go:39-43`, `app/routes.go:9-22` | Confirmed: code path read end to end | MAJOR | 2026-10-14 |
| 2 | Deleting a flight record leaves its `person_to_log` rows. They are hidden from the persons/flights reads by INNER JOINs but still appear in `/roles` and accumulate (same issue: [ARCHITECTURE_DATABASE.md](ARCHITECTURE_DATABASE.md) §11 #16, [ARCHITECTURE_LOGBOOK.md](ARCHITECTURE_LOGBOOK.md) §11 #5) | `app/handlers_flightrecord.go:52-70`, `internal/models/flightrecords.go:119-125`, `internal/models/persons.go:204` | Confirmed: no delete of `person_to_log` anywhere except `DeletePerson`/`DeletePersonToLog` | MINOR | 2026-10-14 |
| 3 | Saving "Add person to flight" without selecting a person sends no `person_uuid` (`''.id` is `undefined`). The server has no validation and inserts a link with `person_uuid = ''`. The link is invisible (INNER JOIN), but its role pollutes `/roles`, and a retry fails with "already exists" | `app/ui/src/components/Persons/AddFlightrecordPersonButton.jsx:15`, `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx:38`, `app/handlers_person.go:79-101`, `internal/models/persons.go:108-130` | Confirmed: traced payload → decode → INSERT; `NOT NULL` accepts `''` | MINOR | 2026-10-14 |
| 4 | Person view flights grid stays stale after a flight is saved, deleted or created with copied persons: those mutations never invalidate `["persons", ...]`, and the query has a 1 h `staleTime` with `refetchOnWindowFocus: false`; the logbook bulk edit has the same gap. The Return save's copy (`app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:32-34`) also leaves `["persons","roles"]` un-invalidated, but that list cannot change on a copy because each copied role is taken from an existing link (`internal/models/persons.go:223,229`). Same gap from the logbook side: [ARCHITECTURE_LOGBOOK.md](ARCHITECTURE_LOGBOOK.md) §11 #5 | `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:41-47`, `app/ui/src/components/FlightRecord/DeleteFlightRecordButton.jsx:21-22`, `app/ui/src/components/Logbook/BulkEditButtons.jsx:47-53`, `app/ui/src/components/Persons/PersonView.jsx:35-41` | Confirmed: invalidation lists read | MINOR | 2026-10-14 |
| 5 | `CopyPersonsForLog` discards every `AddPersonToLog` and `uuid.NewRandom` error (the comment says only duplicates). The endpoint reports "Persons copied" even if every insert failed | `internal/models/persons.go:222-233`, `app/handlers_person.go:197-202` | Confirmed: `id, _ := uuid.NewRandom()` and `_ = m.AddPersonToLog(ptl)` at `internal/models/persons.go:228-230`; the handler writes "Persons copied" unconditionally at `app/handlers_person.go:202` | MINOR | 2026-10-14 |
| 6 | `DeletePerson` runs two statements without a transaction and replaces the first statement's error with a generic message (original `err` dropped) | `internal/models/persons.go:186-196` | Confirmed: two `ExecContext` calls with no `BeginTx`; `internal/models/persons.go:191` returns `fmt.Errorf` without the original `err` | MINOR | 2026-10-14 |
| 7 | `FlightRecordForPerson.TotalTime` is `string` while `logbook.total_time` has been integer minutes since v5, so the API returns `"total_time":"90"`. Consequence: `formatTimeField("0")` renders `00:00` instead of empty (strict `=== 0`). This is a pre-v5 leftover (`8b2fa8d` changed the query but not the type). Sorting the Total column of the person view is likely lexicographic (`"120"` before `"90"`): the value is a string, the column has no `valueGetter` or `sortComparator`, and `type: 'time'` is not a built-in DataGrid type (Suspected: confirm by sorting Total for a person with 90- and 120-minute flights). The footer sum is unaffected because it uses `parseFloat` (`app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:166-172`) | `internal/models/structs.go:131`, `internal/driver/db_structure.go:35`, `app/ui/src/util/helpers.jsx:6`, `app/ui/src/components/Persons/PersonViewFlightsTable.jsx:64-74` | Confirmed (type mismatch): `string` field at `internal/models/structs.go:131` vs `SmallInt` column at `internal/driver/db_structure.go:35`; `git show 8b2fa8d -- internal/models/persons.go internal/models/structs.go` removes `m_date` but keeps `TotalTime string`. Sort order: Suspected, see issue text | MINOR | 2026-10-14 |
| 8 | Uniqueness of person names and of (person, log) pairs is only check-then-insert. There is no UNIQUE constraint and no index on `person_to_log.person_uuid` / `log_uuid`, so every per-flight or per-person read scans the table | `internal/driver/db_structure.go:147-166`, `internal/models/persons.go:73-78,112-117` | Suspected: performance impact unmeasured; confirm by timing `GET /api/person/persons-for-log/{uuid}` on a large logbook | MINOR | 2026-10-14 |
| 9 | Duplicate-name check depends on the engine: `=` is case-sensitive in SQLite, while MySQL compares with the column collation, which the code never sets | `internal/models/persons.go:74` | Suspected: confirm by adding "john doe" after "John Doe" on MySQL | MINOR | 2026-10-14 |
| 10 | `UpdatePerson` skips the duplicate-name check that `AddPerson` enforces. Update/unlink of an unknown UUID returns success | `internal/models/persons.go:95-105,133-150` | Confirmed: `UpdatePerson` runs no duplicate SELECT; the `sql.Result` of each `ExecContext` is discarded, so affected rows are never checked (`internal/models/persons.go:100,138,148`) | MINOR | 2026-10-14 |
| 11 | Misleading doc comments: `HandlerApiPersonToLogDelete` and `HandlerApiPersonDelete` are documented as "HandlerApiPersonsForLog"; `DeletePersonToLog` and `DeletePerson` as "UpdatePersonToLog"; `fetchPersons` mentions a non-existent scan-function parameter | `app/handlers_person.go:121,164`, `internal/models/persons.go:9,142,181` | Confirmed: comment text at the cited lines vs the function names on the next line | MINOR | 2026-10-14 |
| 12 | CSV export of persons contains only the three name columns (no phone/email/remarks). The person-flights CSV has no total time | `app/ui/src/components/UIElements/CSVExportButton.jsx:135-149` | Suspected: may be intentional; confirm with owner | MINOR | 2026-10-14 |
| 13 | Six of the seven mutation handlers answer with a bare JSON string ("Person updated", "Person added", "Person-to-log deleted", "Person deleted", "Persons copied") instead of `writeOkResponse`; only `HandlerApiPersonNew` returns a structured body (the created `Person`). Project-wide deviation, see `docs/rules/RULE_DEVELOPMENT.md` §13 #10 (`docs/rules/RULE_DEVELOPMENT.md:71`). The UI never reads these string bodies and shows its own success texts (e.g. `app/ui/src/components/Persons/SavePersonButton.jsx:29`) | `app/handlers_person.go:75,100,118,136,173,202`, `app/helpers.go:45-51` | Confirmed: `app.writeJSON(w, http.StatusOK, "<string>")` at each cited line | MINOR | 2026-10-14 |
| 14 | Import "Create Persons" can link the wrong person. The PIC last-name fallback matches any existing person with the same last name ("John Smith" is linked to an existing "Jane Smith"), and `lastNameCache` keeps only the last person seen per last name. The wrong links then show up in `/persons/{uuid}` and on the flight's Persons card. Owned by import, see [ARCHITECTURE_IMPORT.md](ARCHITECTURE_IMPORT.md) §11 #1 | `app/handlers_import.go:247-254`, `app/handlers_import.go:164`, `app/handlers_import.go:281` | Confirmed: the fallback condition is only `role == "PIC" && lastName != ""` (`app/handlers_import.go:248`); first and middle names are never compared | MAJOR | 2026-10-14 |

## 12. Rules for Future Development

### 12.1 Add a field to Person (e.g. `license_number`)

1. `internal/driver/db_structure.go:147-155`: add `{Name: "...", Type: SmallText, Properties: "NOT NULL DEFAULT ''"}`. A default is required because existing rows get the column through `ALTER TABLE ADD COLUMN` (`internal/driver/db_operations.go:32,167-172`).
2. `internal/driver/db_structure.go:4`: bump `schemaVersion`, otherwise `validateDB` skips table checks (`internal/driver/driver.go:56`).
3. `internal/models/structs.go:103-111`: add the field with a snake_case `json` tag.
4. `internal/models/persons.go`: keep the SELECT list and the Scan order identical in **all three** readers: `fetchPersons` Scan `internal/models/persons.go:23-24` + queries `internal/models/persons.go:35`, `internal/models/persons.go:40`; `GetPersonsForLog` query `internal/models/persons.go:49` + Scan `internal/models/persons.go:58-59`. Also update the `AddPerson` INSERT `internal/models/persons.go:80-85` and the `UpdatePerson` UPDATE `internal/models/persons.go:99-103`.
5. UI: `app/ui/src/components/Persons/AddEditPersonModal.jsx` (TextField), `app/ui/src/components/Persons/PersonDataCard.jsx` (TextField with `?? ''`), `app/ui/src/components/Persons/Persons.jsx:44-49` (column), `app/ui/src/components/Persons/AddPersonButton.jsx:15` (initial payload), and optionally `app/ui/src/components/UIElements/CSVExportButton.jsx:135-139`.
6. Import (if the field can be derived): `app/handlers_import.go:265-270`.

### 12.2 Add a field to the person-to-flight link (e.g. `seat`)

1. `internal/driver/db_structure.go:161-166` (with DEFAULT) + bump `schemaVersion`.
2. `internal/models/structs.go`: `PersonToLog` (`internal/models/structs.go:113-118`), plus `PersonForLog` (`internal/models/structs.go:120-123`) and/or `FlightRecordForPerson` (`internal/models/structs.go:125-137`) if it must be returned.
3. `internal/models/persons.go`: `AddPersonToLog` INSERT `internal/models/persons.go:119-123`, `UpdatePersonToLog` `internal/models/persons.go:137-138` (currently role only), `GetPersonsForLog` `internal/models/persons.go:49,58-59`, `GetFlightRecordsForPerson` `internal/models/persons.go:156-172`, and **`CopyPersonsForLog` `internal/models/persons.go:229`** so the Return flight copies it too.
4. UI: `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx` (state, `SaveButton` payload `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx:37-41`, field), `app/ui/src/components/Persons/AddFlightrecordPersonButton.jsx:15` (initial payload of a new link, e.g. `seat: ''`; without it the input starts uncontrolled), `app/ui/src/components/Persons/EditFlightRecordPersonButton.jsx:15` (pre-fill), `app/ui/src/components/Persons/PersonForLog.jsx:26` (display), `app/ui/src/components/Persons/PersonViewFlightsTable.jsx` (column), `app/ui/src/components/UIElements/CSVExportButton.jsx:141-149`.
5. Import: `app/handlers_import.go:293-298`.

### 12.3 Add an endpoint

1. Handler `HandlerApi<Entity><Action>` in `app/handlers_person.go`: decode → DBModel call. Follow every `app.handleError(w, err)` immediately with `return`, because the helper does not stop the handler (`app/helpers.go:53-63`). Reads answer with `app.writeJSON(w, http.StatusOK, data)`; mutations answer with `app.writeOkResponse(w, "...")` (`app/helpers.go:45-51`). Do not copy the bare-string responses of the existing person handlers (§11 #13, `docs/rules/RULE_DEVELOPMENT.md:71`). Lowercase URL UUID params as the other handlers do (`app/handlers_person.go:25,141,153,166`). Wrap a large GET in `r.With(middleware.Compress(5))` like `/list` (`app/routes.go:106`). Persons have no server-side `sync.Map` cache (the only ones are in `internal/models/auth.go:11`, `internal/models/airports.go:13`, `internal/models/helpers.go:26`), so nothing needs evicting.
2. Register it in the `/person` sub-router (`app/routes.go:105-118`). It is then automatically under `app.Auth`. Static segments may sit next to `/{uuid}`; avoid adding a GET `/{something}` that collides with `/list`, `/roles`.
3. DBModel method in `internal/models/persons.go` with `ContextWithDefaultTimeout`; initialize slices (`[]T{}`) if the UI expects `[]` rather than `null`.
4. Fetch function in `app/ui/src/util/http/person.jsx` with the bearer header and `handleFetch`.
5. Query key under the `["persons", ...]` prefix so existing `["persons"]` invalidations refresh it; add invalidations to every mutation that changes its data.

### 12.4 Make deleting a flight also delete its person links (fix for §11 #2)

Add a `DeletePersonsForLog(logUuid)` model method (`DELETE FROM person_to_log WHERE log_uuid = ?`) and call it in `HandlerApiFlightRecordDelete` next to `DeleteAttachmentsForFlightRecord` (`app/handlers_flightrecord.go:61-64`). Invalidate `["persons"]` in `app/ui/src/components/FlightRecord/DeleteFlightRecordButton.jsx:21-22`. Optionally add a one-off cleanup of existing orphans (rows whose `log_uuid` is not in `logbook`). That needs an explicit migration step; `validateDB` cannot do it (see [ARCHITECTURE_DATABASE.md](ARCHITECTURE_DATABASE.md)).

### 12.5 Show persons elsewhere (logbook grid, PDF, CSV)

Persons are not part of `FlightRecord` or `logbook_view`. Either join `person_to_log`/`persons` in the consumer's query (see [ARCHITECTURE_LOGBOOK.md](ARCHITECTURE_LOGBOOK.md), [ARCHITECTURE_PDF_EXPORT.md](ARCHITECTURE_PDF_EXPORT.md)) or add a batch endpoint. Do not call `/persons-for-log` per row.

### 12.6 Cross-check list (every Persons change)

- [ ] SQL valid on **both** SQLite and MySQL (no engine-specific functions in `internal/models/persons.go`; DDL via `ColumnType` pairs).
- [ ] `schemaVersion` bumped when any table/column/index/view changes; new NOT NULL columns have a DEFAULT.
- [ ] SELECT column order == `rows.Scan` order in every reader touched.
- [ ] Route registered inside the `/api` group (under `app.Auth`), not next to `/api/login`.
- [ ] Every `handleError` is followed by `return`; new mutations answer with `writeOkResponse`.
- [ ] UI query keys under `["persons", ...]`; mutations invalidate the right keys (include `["persons","flights"]` and `["persons","roles"]` when links change).
- [ ] `null` vs `[]` responses handled in the UI.
- [ ] Return-flight copy (`CopyPersonsForLog`) and import (`app/handlers_import.go:227-334`) still consistent with the change.
- [ ] Display formats via `useSettings` (`timeFieldsFormat`, `dateFieldsFormat`), never hardcoded.
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:` / `- Update:` / `- Fix:`) **and** the copy of that section in `README.md`; update the "Persons" feature list (`README.md:228-231`) if behaviour changes.
- [ ] This document updated (sections 4, 5, 11).

## 13. AI Notes

### Mental Model

Two tables and one join. `persons` is a flat address book. `person_to_log` is a many-to-many link to `logbook.uuid`, carrying a free-text role. Its own `uuid` is decorative: everything addresses a link by `(log_uuid, person_uuid)`. Integrity (no duplicates, cascade on person delete) lives entirely in `internal/models/persons.go`; the DB has no constraints. The UI treats `["persons"]` as the root query key and relies on prefix invalidation.

### Gotchas

- `GET /api/person/{uuid}` panics for an unknown UUID (§11 #1). Do not copy the `persons[0]` pattern.
- `DELETE /api/person/person-to-log` takes a JSON **body**, not URL params (`app/ui/src/util/http/person.jsx:85-93`).
- `POST`/`PUT` persons go to `/api/person` (no `/new`, no `/{uuid}`), unlike most other entities (`app/routes.go:109-110`).
- `total_time` in `/logs-for-person` is a JSON string, unlike everywhere else (§11 #7).
- Several endpoints return `null` for empty lists. `app/ui/src/components/Persons/FlightRecordPersons.jsx:30` uses `(data && data.length) && ...`, which would render a literal `0` if the backend ever returned `[]`.
- No Persons hook exists in `app/ui/src/hooks/queries/`; each component calls `useQuery` inline with duplicated options, and `app/ui/src/util/http/person.jsx` is not re-exported from `app/ui/src/util/http/index.js`.
- `printPerson` yields a double space when `middle_name` is empty (`app/ui/src/util/helpers.jsx:271`). Import and `AddPerson` treat `""` as a real middle name for duplicate detection.
- Only "Return flight" copies persons. "New" and "Copy" flight actions do not (`app/ui/src/components/FlightRecord/ReturnFlightRecordButton.jsx:32`; no `copy_persons` elsewhere).
- The import's duplicate cache is case-insensitive and falls back to last-name-only matching for PIC (`app/handlers_import.go:244-254`), which can link a different person with the same last name (§11 #14). That differs from `AddPerson`'s exact match.

### File Quick Reference

| Need | File |
|---|---|
| Routes | `app/routes.go:104-118` |
| Handlers | `app/handlers_person.go` |
| SQL | `internal/models/persons.go` |
| Structs | `internal/models/structs.go:102-137` |
| DDL | `internal/driver/db_structure.go:147-166` |
| HTTP client | `app/ui/src/util/http/person.jsx` |
| List page | `app/ui/src/components/Persons/Persons.jsx` |
| Person page | `app/ui/src/components/Persons/PersonView.jsx`, `app/ui/src/components/Persons/PersonViewFlightsTable.jsx` |
| Flight card | `app/ui/src/components/Persons/FlightRecordPersons.jsx`, `app/ui/src/components/Persons/AddEditFlightrecordPersonModal.jsx` |
| Selectors | `app/ui/src/components/UIElements/PersonSelect.jsx`, `app/ui/src/components/UIElements/PersonRole.jsx` |
| Import integration | `app/handlers_import.go:156-334` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
