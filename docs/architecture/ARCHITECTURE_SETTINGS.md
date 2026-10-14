# Settings — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — §11 #3, #7 confirmed; cross-links to PDF_EXPORT, APPLICATION, AIRCRAFT_AIRPORTS (TASK_AGENT_WORKFLOW_SETUP)

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

Settings holds every per-installation preference of the logbook: owner data printed on the PDF title page, the signature image, authentication credentials, PDF layout per paper format, the airport DB source, interface preferences (pagination, totals view, time and date display formats, custom names for standard fields), license-expiration warnings and the pilot's previous flight experience. Everything is stored as **one JSON document in one row** (`settings2`, `id = 0`). `GetSettings` / `UpdateSettings` in `internal/models/settings.go:11-68` read and write it.

The HTTP layer is `app/handlers_settings.go` (7 handlers under `/api/settings`, routed in `app/routes.go:82-90`). First-run defaults come from `internal/models/models_defaults.go`. The UI is the `/settings` page (`app/ui/src/main.jsx:90` → `app/ui/src/pages/SettingsPage.jsx` → `app/ui/src/components/Settings/Settings.jsx`). Read access goes through the `useSettings` hook (`app/ui/src/hooks/useSettings.jsx:81-139`), which about 30 components across the SPA use. Several settings are written through their own endpoints: the PDF export pages (`export_a4`/`export_a5`), the Airports page (`airports_db_source`/`no_icao_filter`) and the signature card on the Settings page (`signature_image`).

## 2. Key Concepts

| Concept | Definition / invariant | Evidence |
|---|---|---|
| Single settings document | One row `id = 0` in table `settings2`, column `settings` holds `json.Marshal(models.Settings)` | `internal/models/settings.go:17`, `internal/models/settings.go:54-60`, `internal/driver/db_structure.go:77-80` |
| Read-modify-write | Every writer does `GetSettings` → change fields → `UpdateSettings(whole struct)`. A zero value in the struct overwrites the stored value | `app/handlers_settings.go:53-75`, `internal/models/models_defaults.go:155-190` |
| Full replace on general save | `PUT /api/settings/general` stores the client's whole object, except `export_a4`, `export_a5` and `signature_image`, which it copies back from the DB. `auth_enabled`, `login` and `secret_key` therefore come from the client; only `hash` survives a blank password | `app/handlers_settings.go:36-40`, `internal/models/settings.go:45-52` |
| Password → hash | A non-blank `password` is bcrypt-hashed into `hash` and cleared. A blank one keeps the old hash | `internal/models/settings.go:35-52` |
| Hash never leaves server | `GET /settings/list` blanks `hash` before responding (`secret_key` is **not** blanked) | `app/handlers_settings.go:18` |
| Auth cache invalidation | Every `UpdateSettings` clears the in-memory `authCache` | `internal/models/settings.go:65`, `internal/models/auth.go:11` |
| Time stored as minutes | All time values (previous experience, flight times) are integer minutes. The format setting only changes how they are **displayed** | `internal/models/structs.go:255-271`, `app/ui/src/util/helpers.jsx:4-23` |
| Time format code | `time_fields_auto_format` byte: `0` legacy, `1` HH:MM, `2` H:MM, `3` FAA decimal | `app/helpers.go:115-140`, `app/ui/src/components/Settings/GeneralSettings/OtherSettings.jsx:59-61` |
| Two time-format settings | Global `Settings.TimeFieldsAutoFormat` (UI + import log) and a separate one per PDF format, `ExportPDF.TimeFieldsAutoFormat` | `internal/models/structs.go:241`, `internal/models/structs.go:215`, `internal/pdfexport/pdfexport.go:511-519` |
| Date format is display-only | `date_fields_format` is read only by the UI. Dates are always stored as `YYYY-MM-DD` | `app/ui/src/components/UIElements/DatePicker.jsx:10`, `app/ui/src/components/UIElements/DatePicker.jsx:22`; no Go reader besides `internal/models/structs.go:242` |
| Defaults are code constants | PDF defaults and standard headers are Go package vars. They are served without a DB read | `internal/models/settings.go:70-85`, `internal/models/models_defaults.go:4-147` |
| Custom field names | When `enable_custom_names` is true the UI shows `standard_fields_headers[id]`. Otherwise it uses hardcoded UI defaults | `app/ui/src/hooks/useSettings.jsx:107-125` |

## 3. How It Works

| Step | What happens | Evidence |
|---|---|---|
| 1. First DB open | `validateDB` → `checkSettingsTable` inserts row `id=0` with only `owner_name` / `signature_text` set, when the table is empty (only when the schema version changed or is unknown) | `internal/driver/driver.go:56-91`, `internal/driver/driver.go:129-158` |
| 2. App start | `CheckDefaultValues` replaces a whole PDF A4/A5 block when its `logbook_rows` is 0, fills an empty airport source, and replaces the standard headers when `Date` is empty, then saves | `app/main.go:163-168`, `internal/models/models_defaults.go:151-197` |
| 3. App start | Global time format is cached in `app.timeFieldsAutoFormat` | `app/main.go:193-199`, `app/main.go:47` |
| 4. Pilot opens `/settings` | `Settings` copies `useSettings().data` into local state. All cards edit that local copy through `handleChange(key, value)`, where `key` may be a dot-path such as `previous_experience.se_time` | `app/ui/src/components/Settings/Settings.jsx:14-44` |
| 5. Pilot clicks a Save icon on the General, Previous Experience or Standard Fields card | All three use the same `SaveSettingsButton`, which PUTs the **whole local object** to `/api/settings/general` | `app/ui/src/components/Settings/SaveSettingsButton.jsx:12-19`, `app/ui/src/components/Settings/PreviousExperience/PreviousExperience.jsx:17-22`, `app/ui/src/components/Settings/StandardFields/StandardFields.jsx:109-115` |
| 6. Pilot draws or uploads a signature | Stored in local state on stroke end or file load. Persisted **only** by the signature card's own Save (`PUT /api/settings/signature`) | `app/ui/src/components/Settings/Signature/LogbookSignature.jsx:27-33`, `app/ui/src/components/Settings/Signature/SaveSignatureButton.jsx:11-17` |
| 7. "Restore defaults" on Standard Fields | GET `/api/settings/standard-fields`, then writes each header into local state (still needs Save) | `app/ui/src/components/Settings/StandardFields/RestoreDefaultsButton.jsx:12-22` |
| 8. After save | UI invalidates query key `['settings']` (and `['auth-enabled']` for general save). Every `useSettings` consumer re-renders | `app/ui/src/components/Settings/SaveSettingsButton.jsx:15-18` |
| 9. Elsewhere | The PDF Export pages save `export_a4` / `export_a5`. The Airports page autosaves `airports_db_source` / `no_icao_filter` | `app/ui/src/components/PdfExport/SaveSettingsButton.jsx:32-49`, `app/ui/src/components/Airports/AirportsDB.jsx:33-46` |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/handlers_settings.go` | 7 HTTP handlers: list, general update, signature, airports, PDF defaults, PDF update, standard-field defaults |
| `internal/models/settings.go` | `GetSettings`, `UpdateSettings` (bcrypt, JSON, cache clear), `GetPdfDefaults`, `GetStandardFieldsHeaders` |
| `internal/models/models_defaults.go` | Default PDF headers, standard field headers, A4/A5 column widths and page params; `CheckDefaultValues` |
| `internal/models/structs.go:139-272` | `ColumnsWidth`, `ColumnsHeader`, `ExportPDF`, `Settings` types (JSON contract) |
| `app/helpers.go:115-140` | `formatTimeField`: server-side time display using `app.timeFieldsAutoFormat` |
| `app/main.go:47`, `app/main.go:163-199` | In-memory `timeFieldsAutoFormat`; startup `CheckDefaultValues` and settings load |
| `internal/driver/driver.go:129-158` | `checkSettingsTable`: initial row insert |
| `app/ui/src/pages/SettingsPage.jsx` | Route element; renders `Settings` |
| `app/ui/src/components/Settings/Settings.jsx` | Page layout, local editable copy, dot-path `handleChange` |
| `app/ui/src/components/Settings/SaveSettingsButton.jsx` | Shared mutation → `PUT /settings/general` |
| `app/ui/src/components/Settings/GeneralSettings/*` | Owner info, other settings (formats, pagination, totals view, self-PIC label), licenses expiration, auth fields, help, DB actions menu |
| `app/ui/src/components/Settings/Signature/*` | Signature pad (`signature_pad` lib), upload PNG, clear, pen color, save |
| `app/ui/src/components/Settings/PreviousExperience/*` | Previous-experience time and landing inputs |
| `app/ui/src/components/Settings/StandardFields/*` | Custom header names for standard fields, restore defaults |
| `app/ui/src/components/Settings/CustomFields/*` | Custom fields table hosted on this page. Documented in `ARCHITECTURE_LOGBOOK.md` |
| `app/ui/src/hooks/useSettings.jsx` | Query hook for `['settings']`; `fieldName`/`fieldNameF`, `paginationOptions`, `timeFieldsFormat`, `dateFieldsFormat` |
| `app/ui/src/util/http/settings.jsx` | Fetch functions for all `/settings/*` endpoints (plus `/version`, `/auth-enabled`, GitHub latest release) |
| `app/ui/src/util/helpers.jsx:4-47` | UI `formatTimeField` / `parseTimeToMinutes` |
| `app/ui/src/hooks/useSettings.test.jsx` | Vitest tests for `useSettings` |

### 4.2 API Endpoints

All routes are inside the `/api` group, which uses the `app.Auth` middleware (`app/routes.go:26-27`). No settings route is wrapped in `middleware.Compress(5)` (`app/routes.go:82-90`), although `GET /settings/list` can be large (base64 signature and both export blocks).

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/settings/list` | `HandlerApiSettingsList` `app/handlers_settings.go:11` | Full `Settings` JSON. `hash` is blanked (`:18`); `secret_key`, `signature_image` and both export blocks are included |
| PUT | `/api/settings/general` | `HandlerApiSettingsUpdate` `app/handlers_settings.go:22` | Body = whole `Settings`. Keeps `ExportA4`/`ExportA5`/`SignatureImage` from the DB (`:36-40`) and refreshes `app.timeFieldsAutoFormat` (`:48`). Returns `{ok:true,message:"Settings updated"}` |
| PUT | `/api/settings/signature` | `HandlerApiSettingsSignature` `app/handlers_settings.go:53` | Takes only `signature_image` from the body (`:67`) |
| PUT | `/api/settings/airports` | `HandlerApiSettingsAirports` `app/handlers_settings.go:77` | Takes only `airports_db_source`, `no_icao_filter` (`:91-92`) |
| GET | `/api/settings/export/defaults/{format}` | `HandlerApiSettingsExportDefaults` `app/handlers_settings.go:102` | `A4`/`A5` defaults from constants. Any other format → zero values plus default headers (`internal/models/settings.go:70-81`) |
| PUT | `/api/settings/export/{format}` | `HandlerApiSettingsExportUpdate` `app/handlers_settings.go:108` | Body = `ExportPDF`. Copies 14 listed fields into `ExportA4` or `ExportA5` (`:132-145`); `page_breaks` is **not** copied |
| GET | `/api/settings/standard-fields` | `HandlerApiSettingsFieldsDefaults` `app/handlers_settings.go:156` | Returns `standardFieldsHeaders` constant |

### 4.3 Data Access

| File | Method | Purpose | Tables |
|---|---|---|---|
| `internal/models/settings.go` | `GetSettings` `:11-28` | `SELECT settings FROM settings2 WHERE id=0` + `json.Unmarshal` | `settings2` |
| `internal/models/settings.go` | `UpdateSettings` `:31-68` | Hash password (bcrypt cost 12) or keep old hash (extra `GetSettings`), marshal, `UPDATE settings2 SET settings = ? WHERE id = 0`, `authCache.Clear()` | `settings2` |
| `internal/models/settings.go` | `GetPdfDefaults` `:70-81` | Build default `ExportPDF` for `A4`/`A5` | none |
| `internal/models/settings.go` | `GetStandardFieldsHeaders` `:83-85` | Return default `ColumnsHeader` | none |
| `internal/models/models_defaults.go` | `CheckDefaultValues` `:151-197` | Startup backfill of zero-valued groups | `settings2` |
| `internal/models/auth.go` | `GetSecretKey` `:13-26`, `IsAuthEnabled` `:28-41`, `Authenticate` `:78-96`, `DisableAuthorization` `:125-139` | Auth consumers of the settings document (see `ARCHITECTURE_AUTH.md`) | `settings2` |
| `internal/models/export.go` | `UpdateDefaults` `:6-42` | Resets parts of export blocks to defaults. **No callers** in `app/` or `internal/` | `settings2` |
| `internal/driver/driver.go` | `checkSettingsTable` `:129-158` | `INSERT INTO settings2 (id, settings) VALUES (0, ?)` on empty table | `settings2` |
| `internal/driver/data_overhaul.go` | `migratePreviousExperience` `:245-309` | v5 migration: previous-experience `"H:MM"` strings → integer minutes | `settings2` |

### 4.4 UI

| Item | Role | Evidence |
|---|---|---|
| Route `/settings` | `SettingsPage`; nav entry "Settings" | `app/ui/src/main.jsx:90`, `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:68` |
| `Settings` | Two-column grid: General + Signature, then Previous Experience + Standard Fields + Custom Fields | `app/ui/src/components/Settings/Settings.jsx:49-60` |
| `GeneralSettings` | Card header actions: Help, DB actions menu, Save | `app/ui/src/components/Settings/GeneralSettings/GeneralSettings.jsx:15-36` |
| `OwnerInfoFields` | `owner_name`, `license_number`, `address`, `signature_text` | `app/ui/src/components/Settings/GeneralSettings/OwnerInfoFields.jsx:7-34` |
| `OtherSettings` | Pagination CSV, self-PIC label, time format toggle, date format toggle, totals view toggle | `app/ui/src/components/Settings/GeneralSettings/OtherSettings.jsx:30-107` |
| `LicensesExpiration` | `licenses_expiration.warning_period/show_warning/show_expired` | `app/ui/src/components/Settings/GeneralSettings/LicensesExpiration.jsx:19-41` |
| `AuthSettings` | Toggle; switching on generates a 32-byte base64 `secret_key` in the browser; login/password/secret fields | `app/ui/src/components/Settings/GeneralSettings/AuthSettings.jsx:11-62` |
| `DBActionsMenu` | Upload/download DB (backend in `ARCHITECTURE_APPLICATION.md`) | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBActionsMenu.jsx:11-34` |
| `LogbookSignature` | Canvas pad; `endStroke` → `signature_image` data URL; reloads from stored data URL | `app/ui/src/components/Settings/Signature/LogbookSignature.jsx:22-74` |
| `UploadSignatureButton` | Accepts only `image/png`, reads as data URL, no size check | `app/ui/src/components/Settings/Signature/UploadSignatureButton.jsx:9-18` |
| `PreviousExperience` | 13 `TimeField`s (minutes, shown in `timeFieldsFormat`) + 2 landing fields | `app/ui/src/components/Settings/PreviousExperience/PreviousExperience.jsx:27-71` |
| `StandardFields` | Enable custom names + 32 header inputs (`HEADERS_CONFIG`) | `app/ui/src/components/Settings/StandardFields/StandardFields.jsx:16-107`, `:130-152` |
| `useSettings` | `useQuery(['settings'])`, `staleTime`/`gcTime` 1 h, no refetch on focus | `app/ui/src/hooks/useSettings.jsx:83-89` |
| `useSettings` returns | `settings`, `data`, `isLoading`, `fieldName`, `fieldNameF`, `paginationOptions`, `timeFieldsFormat` (default 1), `dateFieldsFormat` (default `DD/MM/YYYY`) | `app/ui/src/hooks/useSettings.jsx:129-138` |

## 5. Data Model & Persistence

**Table** `settings2` (`internal/driver/db_structure.go:77-80`): `id` `SmallInt` (SQLite `INTEGER`, MySQL `SMALLINT`, `:11`), `settings` `FullText` (SQLite `TEXT`, MySQL `TEXT`, `:10`). Only row `id = 0` is ever read or written. The table is part of the declarative schema; adding JSON keys needs **no** DDL change.

**JSON document** (`models.Settings`, `internal/models/structs.go:221-272`):

| Group | JSON keys | Go type | Writer endpoint | Main readers |
|---|---|---|---|---|
| Owner | `owner_name`, `license_number`, `address`, `signature_text` | string | general | PDF title page `app/handlers_export.go:144-146`; `Authenticate` returns `owner_name` `internal/models/auth.go:95` |
| Signature | `signature_image` | string (data URL) | signature | PDF `app/handlers_export.go:146`, used only if `include_signature` `internal/pdfexport/pdfexport.go:155-157` |
| Legacy | `aircraft_classes` | `map[string]string` | general (pass-through) | Not found in code |
| Auth | `auth_enabled`, `login`, `password` (cleared when non-blank), `hash`, `secret_key` | bool/string | general | `internal/models/auth.go:13-96` |
| PDF | `export_a4`, `export_a5` (`ExportPDF`, `structs.go:200-218`) | object | export/{format}; startup defaults | `app/handlers_export.go:116-122` |
| Interface | `logbook_pagination` (CSV string), `self_pic_label`, `logbook_totals_view` (0 standard / 1 paper), `time_fields_auto_format` (0–3), `date_fields_format`, `enable_custom_names`, `standard_fields_headers` (`ColumnsHeader`) | mixed | general | `useSettings` consumers; `self_pic_label` also `app/handlers_import.go:141-146` |
| Licenses | `licenses_expiration.{show_expired,show_warning,warning_period}` | bool/int | general | `app/ui/src/components/Licensing/LicensingNavTitle.jsx:16`, `app/ui/src/components/Licensing/LicensingTable.jsx:22` |
| Airports | `airports_db_source`, `no_icao_filter` | string/bool | airports | `HandlerApiAirportDBUpdate` `app/handlers_airport.go:195-208` |
| Previous experience | `previous_experience.{total_time,se_time,me_time,mcc_time,night_time,ifr_time,pic_time,co_pilot_time,dual_time,instructor_time,me_total_time,cc_time,sim_time}` (minutes), `landings_day`, `landings_night` | int | general | PDF `app/handlers_export.go:124-137` (all except `me_total_time`, `cc_time`); logbook totals `app/ui/src/components/Logbook/LogbookTable.jsx:314`; dashboard `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:32-34` |

`ExportPDF.CustomTitleBlob` (`internal/models/structs.go:217`) has no JSON tag. It is only filled transiently at export time (`app/handlers_export.go:142`); the custom title PDF itself lives in the attachments table under id `custom_title_a4|a5` (`app/handlers_export.go:140-141`).

**In-memory state:**

| State | Where | Refreshed by |
|---|---|---|
| `app.timeFieldsAutoFormat` | `app/main.go:47` | startup `app/main.go:199`; `PUT /settings/general` `app/handlers_settings.go:48` |
| `authCache` (`secretKey`, `isAuthEnabled`, `token`) | `internal/models/auth.go:11` | cleared by every `UpdateSettings` `internal/models/settings.go:65` |
| React Query `['settings']` | `app/ui/src/hooks/useSettings.jsx:84`; same key also used by `app/ui/src/components/PdfExport/PdfExport.jsx:24-27` (no staleTime) | invalidated after every settings mutation |

## 6. Data Flow

| Operation | Path |
|---|---|
| Load | `useSettings` → `fetchSettings` `app/ui/src/util/http/settings.jsx:5-13` → `GET /api/settings/list` → `Auth` → `HandlerApiSettingsList` → `GetSettings` → `SELECT … settings2 WHERE id=0` → `json.Unmarshal` → blank `hash` → `writeJSON` |
| General save | `SaveSettingsButton` → `updateSettings` `app/ui/src/util/http/settings.jsx:15-26` (coerces `warning_period`, `landings_day/night` to int) → `PUT /api/settings/general` → `HandlerApiSettingsUpdate`: `GetSettings` (old) → decode body → restore export/signature → `UpdateSettings` (bcrypt or keep hash → marshal → `UPDATE` → `authCache.Clear`) → set `app.timeFieldsAutoFormat` → `writeOkResponse` → UI invalidates `['settings']`, `['auth-enabled']` |
| Signature save | `SaveSignatureButton` → `updateSignature` `app/ui/src/util/http/settings.jsx:28-36` (sends the whole local object) → `HandlerApiSettingsSignature` → old settings + new `SignatureImage` → `UpdateSettings` → invalidate `['settings']` |
| Airports source | `AirportsDB.handleChange` → `updateAirportsDBSettings` `app/ui/src/util/http/settings.jsx:38-46` → `HandlerApiSettingsAirports` → old settings + 2 fields → `UpdateSettings` |
| PDF layout save | `PdfExport/SaveSettingsButton` (parses `INT_FIELDS`, 23 columns) → `updatePdfSettings` `app/ui/src/util/http/settings.jsx:58-66` → `HandlerApiSettingsExportUpdate` → copy 14 fields into `ExportA4`/`ExportA5` → `UpdateSettings` |
| Defaults | `fetchStandardFields` → `GetStandardFieldsHeaders`; `fetchPdfDefaults` → `GetPdfDefaults` (constants, no DB) |
| Time display (UI) | `useSettings().timeFieldsFormat` (`data.time_fields_auto_format || 1`) → `formatTimeField(minutes, format)` `app/ui/src/util/helpers.jsx:4-23` in tables, `TimeField` inputs parse back with `parseTimeToMinutes` `app/ui/src/util/helpers.jsx:26-47` |
| Time display (server) | `app.formatTimeField` `app/helpers.go:115-140`, used only in the import log `app/handlers_import.go:204`; PDF uses its own `formatTimeFieldOptions` with the per-format code `internal/pdfexport/pdfexport.go:502-531` |
| Date display (UI) | `useSettings().dateFieldsFormat` → `dayjs(value).format(fmt)` in tables (`app/ui/src/components/Logbook/helpers.jsx:44`) and `format` prop of the MUI DatePicker (`app/ui/src/components/UIElements/DatePicker.jsx:22`); storage stays `YYYY-MM-DD` (`:10`) |

## 7. Config & Constants

| Constant | Value | Where | Kind |
|---|---|---|---|
| Settings row id | `0` | `internal/models/settings.go:17`, `:59` | hardcoded |
| DB query timeout | 60 s (`DefaultTimeout`) | `internal/models/helpers.go:14` | hardcoded |
| bcrypt cost | 12 | `internal/models/settings.go:38` | hardcoded |
| Initial owner / signature text | `"Owner Name"`, `"I certify that the entries in this log are true."` | `internal/driver/driver.go:19-20` | hardcoded (editable afterwards) |
| Default airport DB source | `https://github.com/vsimakhin/Airports/raw/master/airports.json`, `no_icao_filter=false` | `internal/models/models_defaults.go:178-182` | hardcoded (default; the setting is user-editable on the Airports page) |
| Airport source options (UI) | vsimakhin, mwgg JSON, ourairports CSV | `app/ui/src/components/Airports/AirportsDB.jsx:16-20` | hardcoded |
| A4 defaults | rows 23, fill 3, left 10.0, top 30.0, body 5.0, footer 6.0 | `internal/models/models_defaults.go:129-136` | hardcoded (default; the setting is user-editable on the PDF Export page) |
| A5 defaults | rows 20, fill 3, left A 6.0, left B 14.0, top 9.0, body 5.0, footer 5.0 | `internal/models/models_defaults.go:139-147` | hardcoded (default; the setting is user-editable on the PDF Export page) |
| Column widths | 23 columns A4 / A5 | `internal/models/models_defaults.go:75-126` | hardcoded (default; the setting is user-editable on the PDF Export page) |
| PDF / table header defaults | `pdfDefaultHeaders` (31 keys), `standardFieldsHeaders` (32 keys incl. `Tags`) | `internal/models/models_defaults.go:4-36`, `:39-72` | hardcoded (default; the settings are user-editable on the PDF Export page / Standard Fields card) |
| UI field-name defaults | `defaultFieldNames.table` / `.flightRecord` (incl. `cc: "XC Time"`) | `app/ui/src/hooks/useSettings.jsx:6-77` | hardcoded |
| Pagination default | `[5, 10, 15, 20, 25, 30, 50, 100]` | `app/ui/src/hooks/useSettings.jsx:79` | hardcoded (fallback; `logbook_pagination` is user-editable) |
| Time format default (UI read) | `1` (HH:MM) when stored 0 | `app/ui/src/hooks/useSettings.jsx:136` | hardcoded (fallback; the setting is user-editable) |
| Time format default (toggle display) | `2` (H:MM) when stored 0 | `app/ui/src/components/Settings/GeneralSettings/OtherSettings.jsx:55` | hardcoded (fallback; the setting is user-editable) |
| Date formats | `DD/MM/YYYY` (default), `YYYY-MM-DD`, `MM/DD/YYYY` | `app/ui/src/components/Settings/GeneralSettings/OtherSettings.jsx:75-81`, `app/ui/src/hooks/useSettings.jsx:137` | hardcoded (option list and fallback; the choice is user-editable) |
| Self PIC label default | `"Self"` | `app/ui/src/components/Settings/GeneralSettings/OtherSettings.jsx:45`, `app/handlers_import.go:141` | hardcoded (fallback; the setting is user-editable) |
| License warning period default | 90 days | `app/ui/src/components/Settings/GeneralSettings/LicensesExpiration.jsx:23`, `app/ui/src/util/http/settings.jsx:17` | hardcoded (fallback; the setting is user-editable) |
| Secret key generation | 32 random bytes, base64, in browser | `app/ui/src/components/Settings/GeneralSettings/AuthSettings.jsx:15-19` | hardcoded |
| Settings query cache | `staleTime`/`gcTime` 3 600 000 ms, `refetchOnWindowFocus: false` | `app/ui/src/hooks/useSettings.jsx:86-88` | hardcoded |
| Signature pen color / canvas height | `#000000` / 150 px | `app/ui/src/components/Settings/Signature/LogbookSignature.jsx:25`, `:85` | hardcoded (color pickable) |
| Previous-experience input max length | 9 chars | `app/ui/src/components/Settings/PreviousExperience/PreviousExperience.jsx:63` | hardcoded |
| MySQL `settings` column | `TEXT` (64 KB limit is a MySQL property) | `internal/driver/db_structure.go:10` | hardcoded |

**Time format codes:**

| Code | UI label | Go `app/helpers.go` | Go PDF `internal/pdfexport/pdfexport.go` | UI `app/ui/src/util/helpers.jsx` |
|---|---|---|---|---|
| 0 | (legacy, never offered) | H:MM `:132-136` | H:MM `:523-527` | H:MM `:19-21`, but `useSettings` maps 0 → 1 first |
| 1 | HH:MM | `%02d:%02d` `:129-131` | `:520-522` | `:16-18` |
| 2 | H:MM | `%d:%02d` `:132-136` | `:523-527` | `:19-21` |
| 3 | FAA | `%.1f` hours `:120-123` | `:511-514` | `toFixed(1)` `:8-11` |

Zero handling differs: `app.formatTimeField` never blanks 0 (it prints `0:00`, `00:00` or `0.0` depending on the code, `app/helpers.go:115-140`). The UI returns `""` unless `formatZero` (`app/ui/src/util/helpers.jsx:6`). The PDF returns `""` except in totals rows (`internal/pdfexport/pdfexport.go:507-509`).

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| DB / JSON error in any handler | `handleError` → HTTP 500 `{ok:false,message}` and an error log with caller file:line | `app/helpers.go:53-63` |
| Stored JSON no longer unmarshals into `Settings` | `GetSettings` errors. `Auth` middleware calls `IsAuthEnabled` → `GetSettings` on a cold cache, so every `/api` call returns 500 | `internal/models/settings.go:23-25`, `app/handlers_auth.go:115-119`, `internal/models/auth.go:28-41` |
| Body field has the wrong JSON type (e.g. `"5"` for an int) | `json.Decode` fails → 500. This is why the UI coerces ints before PUT | `app/handlers_settings.go:30-34`, `app/ui/src/util/http/settings.jsx:17-19`, `app/ui/src/components/PdfExport/SaveSettingsButton.jsx:11-30` |
| `null` for a string (cleared signature) | Decodes to `""`, so the signature is removed | `app/ui/src/components/Settings/Signature/ClearSignatureButton.jsx:10`, `app/handlers_settings.go:67` |
| Deselecting an exclusive toggle | MUI passes `null`; `parseInt(null)` → `NaN` → JSON `null` → stored `0` / `""`, so the next load falls back to defaults | `app/ui/src/components/Settings/GeneralSettings/OtherSettings.jsx:18-28` |
| Blank password on save | Old hash is kept (requires a second `GetSettings`) | `internal/models/settings.go:45-52` |
| Password with surrounding spaces | Trimmed before hashing; login compares untrimmed input | `internal/models/settings.go:36`, `internal/models/auth.go:88` |
| `PUT /settings/export/{format}` with format ≠ `A4`/`A5` | `targetExport` stays nil → nil-pointer panic at `:132`; no chi `Recoverer` in `app/routes.go:12-22` | `app/handlers_settings.go:124-132` |
| `GET /settings/export/defaults/{format}` unknown format | 200 with zeroed page params + default headers | `internal/models/settings.go:70-81` |
| `CheckDefaultValues` fails at startup | Logged; app continues | `app/main.go:164-168` |
| Settings load fails at startup | Logged; `main` returns (server never starts) | `app/main.go:194-198` |
| Saving general settings while a signature is drawn but unsaved | Server discards `signature_image` from this endpoint. The refetch can replace the local copy and lose the drawing | `app/handlers_settings.go:40`, `app/ui/src/components/Settings/Settings.jsx:17-22` |
| Saving the signature while other cards have unsaved edits | The server takes only `signature_image`; the `['settings']` refetch then replaces the local copy (`Settings.jsx:17-22`), discarding the unsaved General, Previous Experience and Standard Fields edits | `app/handlers_settings.go:67`, `app/ui/src/components/Settings/Signature/SaveSignatureButton.jsx:14-16`, `app/ui/src/components/Settings/Settings.jsx:17-22` |
| `updateSettings` mutates its argument | Coercion writes into the React state object in place | `app/ui/src/util/http/settings.jsx:17-19` |

## 9. Integration Points

| System | What crosses the boundary |
|---|---|
| `ARCHITECTURE_AUTH.md` | `auth_enabled`, `login`, `hash`, `secret_key` live in this document. `UpdateSettings` clears `authCache`. `GetSecretKey`/`IsAuthEnabled`/`Authenticate`/`DisableAuthorization` read or write it (`internal/models/auth.go:13-139`). General save invalidates `['auth-enabled']` (`app/ui/src/components/Settings/SaveSettingsButton.jsx:17`). `-disable-authentication` runs before `CheckDefaultValues` (`app/main.go:153-168`) |
| `ARCHITECTURE_PDF_EXPORT.md` | `export_a4`/`export_a5` blocks, defaults endpoint, per-format time format; owner info, signature and previous experience passed to `NewPDFExporter` (`app/handlers_export.go:102-147`). UI: `app/ui/src/components/PdfExport/PdfExport.jsx:24-35`, `SaveSettingsButton.jsx`, `RestoreDefaultsButton.jsx`. PDF prints `record.Date` as stored and ignores `date_fields_format` (`internal/pdfexport/pdfexport_a4.go:140`) |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `airports_db_source`/`no_icao_filter` written from `app/ui/src/components/Airports/AirportsDB.jsx:33-46`, read by `HandlerApiAirportDBUpdate` (`app/handlers_airport.go:195-208`). `AircraftsTable`/`CategoriesTable` format totals with `timeFieldsFormat` |
| `ARCHITECTURE_LOGBOOK.md` | `fieldName`, `paginationOptions`, `timeFieldsFormat`, `dateFieldsFormat`, `logbook_totals_view`, `previous_experience` in `app/ui/src/components/Logbook/LogbookTable.jsx:33`, `:313-314`; `self_pic_label` in `app/ui/src/components/FlightRecord/PICNameField.jsx:22`; Custom Fields card rendered on this page (`app/ui/src/components/Settings/Settings.jsx:58`). `CustomFieldModal` stores a custom field's `category` as the header **display text** from `fieldName()` (`app/ui/src/components/Settings/CustomFields/CustomFieldModal.jsx:81-94`), and the logbook matches columns by that text (`app/ui/src/components/Logbook/helpers.jsx:109`). A change to `standard_fields_headers` or `enable_custom_names` that changes the display text therefore leaves existing custom fields in no column group (see `ARCHITECTURE_LOGBOOK.md` §11 #7) |
| `ARCHITECTURE_IMPORT.md` | `self_pic_label` (`app/handlers_import.go:140-146`); `app.formatTimeField` for night-time change log (`app/handlers_import.go:204`) |
| `ARCHITECTURE_STATS_AND_MAP.md` | `previous_experience` added to dashboard totals (`app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:30-38`); `timeFieldsFormat` in `app/ui/src/components/Map/SummaryStats.jsx:10-11` |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | `licenses_expiration` (nav badges, table colors); `dateFieldsFormat` in `LicensingTable`, `AttachmentsTable`, `CurrencyTable`; `fieldNameF("cc")` (`app/ui/src/components/Currency/CurrencyTable.jsx:168`) |
| `ARCHITECTURE_PERSONS.md` | `timeFieldsFormat`/`dateFieldsFormat` in `app/ui/src/components/Persons/PersonViewFlightsTable.jsx:21` |
| `ARCHITECTURE_DATABASE.md` | `settings2` DDL, `checkSettingsTable`, `migratePreviousExperience`, `DefaultTimeout`, schema version |
| `ARCHITECTURE_APPLICATION.md` | Startup order (`app/main.go:153-206`), routes, `writeJSON`/`handleError`, DB upload/download (UI hosted in this page's `DBActionsMenu`; backend `HandlerApiUploadDB` `app/handlers_db.go:16-61`, `HandlerApiDownloadDB` `app/handlers_db.go:63-88`) |
| `ARCHITECTURE_FRONTEND.md` | `queryClient`/`handleFetch` (`app/ui/src/util/http/http.jsx:4-31`), `API_URL` (`app/ui/src/constants/constants.jsx:9-12`), `TextField`/`TimeField`/`DatePicker` UI elements |

## 10. Testing

| Area | Tests | How to run |
|---|---|---|
| Go handlers / models for settings | None. The only Go tests are `app/handlers_import_test.go` and `internal/nighttime/nighttime_test.go` | `make test` (`Makefile:32-33`; requires `make build_ui` first) |
| `useSettings` | `app/ui/src/hooks/useSettings.test.jsx`: pagination parsing, `fieldName` fallbacks, return shape | `cd app/ui && npm run test:run` (`app/ui/package.json:12`) |
| CI | `.github/workflows/go.yml:21-31` runs `make npm_install build_ui` (= `npm run build` = `npm run test:run && vite build`, `Makefile:26-28`, `app/ui/package.json:8`), so Vitest runs in CI and a failing UI test fails the job. It then runs `go vet`, `make test` and the backend build. ESLint is not run in CI | — |

Gaps: no test covers the protected-field logic of `HandlerApiSettingsUpdate`, password hashing/keep-hash, `CheckDefaultValues`, the export-field copy list, or `formatTimeField` (Go or UI). Several `useSettings` assertions are not enforced (issue #15).

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | `page_breaks` is editable on the PDF Export page and sent in the PUT body, but `HandlerApiSettingsExportUpdate` copies 14 fields and omits `PageBreaks`, so it is never saved. The exporter reads it from the stored settings. Same issue: `ARCHITECTURE_PDF_EXPORT.md` §11 #1. | `app/handlers_settings.go:132-145`; UI `app/ui/src/components/PdfExport/PageSettings.jsx:19`; reader `internal/pdfexport/pdfexport.go:153` | Confirmed: no `PageBreaks` assignment in the handler, and the general save restores export blocks from the DB (`:37-38`), so no endpoint can persist it | MAJOR | ✓ |
| 2 | Auth can be enabled with an empty login/password. There is no server or UI validation, the old (empty) hash is kept and every request then requires a token that cannot be obtained. Recovery requires shell access to run the binary with `-disable-authentication`, so the pilot is locked out of all data until then. Same issue: `ARCHITECTURE_AUTH.md` §11 #10. | `app/handlers_settings.go:22-51`, `internal/models/settings.go:45-52`, `internal/models/auth.go:84-93`, `app/ui/src/components/Settings/GeneralSettings/AuthSettings.jsx:11-21`, `app/main.go:154-161` | Confirmed: code path has no check; `bcrypt.CompareHashAndPassword` against an empty hash returns an error | MAJOR | ✓ |
| 3 | Airports DB settings autosave sends the **previous** value. `handleChange` calls `setSettings` and then immediately `saveSettings()`, whose `mutationFn` closes over `settings` from the last render. Same issue: `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` §11 #3. | `app/ui/src/components/Airports/AirportsDB.jsx:34-46` | Confirmed: deterministic. The `mutationFn` (`app/ui/src/components/Airports/AirportsDB.jsx:35`) captures the render's `settings`, and `handleChange` (`:44-45`) calls `saveSettings()` before React re-renders with the new state | MAJOR | ✓ |
| 4 | On MySQL the whole document (including the base64 `signature_image`) must fit in `TEXT` (64 KB). Uploaded PNGs have no size check. | `internal/driver/db_structure.go:10`, `:77-80`; `app/ui/src/components/Settings/Signature/UploadSignatureButton.jsx:9-18` | Suspected: confirm by uploading a PNG over ~45 KB on MySQL (strict mode → save error; non-strict → truncated JSON → `GetSettings` fails app-wide) | MAJOR | ✓ |
| 5 | Settings-derived in-memory state is not refreshed after DB upload. `app.timeFieldsAutoFormat` and `authCache` (auth on/off, secret key) keep the old DB's values until restart or the next settings save, and `CheckDefaultValues` is not run for the uploaded DB. | `app/handlers_db.go:53-58`, `internal/models/auth.go:28-41`, `app/main.go:164`, `:199` | Confirmed: the upload handler only swaps `app.db`, and `authCache.Clear()` is called only from `UpdateSettings` | MAJOR | ✓ |
| 6 | Default time format diverges when stored value is 0 (fresh DB; never set by defaults): tables use HH:MM (`|| 1`), the Settings toggle highlights H:MM (`|| 2`), server/PDF use H:MM. | `app/ui/src/hooks/useSettings.jsx:136`, `app/ui/src/components/Settings/GeneralSettings/OtherSettings.jsx:55`, `app/helpers.go:132`, `internal/models/models_defaults.go:151-197` | Confirmed: three different fallbacks for the same value | MINOR | ✓ |
| 7 | FAA decimal rounding differs: Go `fmt.Sprintf("%.1f")` (round-half-even on exact ties) vs JS `toFixed(1)` (ties go up). E.g. 15 min → UI `0.3`, PDF `0.2`. | `app/helpers.go:122`, `internal/pdfexport/pdfexport.go:513`, `app/ui/src/util/helpers.jsx:10` | Confirmed: language semantics. Go `%.1f` formats through `strconv`'s exact-decimal path, which rounds exact halves to even; ECMAScript `toFixed` picks the larger value on ties. 15 min = 0.25 h is an exact binary tie, so x.25 h differs (x.75 h does not) | MINOR | ✓ |
| 8 | Unknown `{format}` in `PUT /settings/export/{format}` dereferences a nil pointer (panic, connection dropped) instead of returning 400. Same issue: `ARCHITECTURE_PDF_EXPORT.md` §11 #8; shared root cause (no `Recoverer`): `ARCHITECTURE_APPLICATION.md` §11 #19. | `app/handlers_settings.go:124-132` | Confirmed: `targetExport` is nil outside `A4`/`A5` | MINOR | ✓ |
| 9 | Password is trimmed before hashing but not at login. A password set with leading/trailing spaces is rejected when typed the same way; only the trimmed form logs in. Same issue: `ARCHITECTURE_AUTH.md` §11 #9. | `internal/models/settings.go:36-38`, `internal/models/auth.go:88`, `app/ui/src/components/UIElements/TextField.jsx:7-9`, `app/ui/src/components/SignIn.jsx:36` | Confirmed: `UpdateSettings` hashes `strings.TrimSpace(password)`, `Authenticate` compares the raw input, and neither `TextField` nor `SignIn` trims | MINOR | ✓ |
| 10 | `GET /settings/list` returns `secret_key` (the JWT signing key) to the browser; only `hash` is blanked. | `app/handlers_settings.go:18`, `internal/models/structs.go:233`, `app/ui/src/components/Settings/GeneralSettings/AuthSettings.jsx:54-62` | Confirmed: by design for UI round-trip; exposure limited to authenticated clients | MINOR | ✓ |
| 11 | General save is a full-document replace from the client copy, with read-modify-write and no locking. Fields owned by other screens (`airports_db_source`, `no_icao_filter`) are overwritten by whatever the Settings tab holds. | `app/handlers_settings.go:22-46` | Confirmed: only export blocks and signature are protected (`:36-40`) | MINOR | ✓ |
| 12 | No `cc` key in `ColumnsHeader` / the Standard Fields form. With custom names enabled, `fieldNameF("cc")` returns `"cc"` and logs a warning. | `internal/models/structs.go:165-198`, `app/ui/src/hooks/useSettings.jsx:118-124`, `app/ui/src/components/Currency/CurrencyTable.jsx:168`, `app/ui/src/components/Currency/CurrencyModal.jsx:92` | Confirmed | MINOR | ✓ |
| 13 | `CheckDefaultValues` backfills `standard_fields_headers` only when `Date` is empty. Headers added later (e.g. `Tags`, PR #436) stay empty on older DBs and show the raw id when custom names are on. | `internal/models/models_defaults.go:184-187`, `app/ui/src/hooks/useSettings.jsx:118-124`, `app/ui/src/components/Logbook/LogbookTable.jsx:153` | Confirmed (logic); actual occurrence depends on the user's DB history | MINOR | ✓ |
| 14 | `app.timeFieldsAutoFormat` is written by a request goroutine and read by others without synchronization (data race). | `app/handlers_settings.go:48`, `app/helpers.go:120`, `:128` | Confirmed: plain field, no mutex; impact negligible (single byte) | MINOR | ✓ |
| 15 | `useSettings.test.jsx` imports `defaultFieldNames`, which is not exported (it is `undefined`), and wraps assertions in non-awaited `waitFor`. The tests do run in CI (via `npm run build`), but a failing assertion inside a non-awaited `waitFor` does not fail its test, because the test returns before the `waitFor` promise settles. | `app/ui/src/hooks/useSettings.test.jsx:3`, `:57`, `:69`, `:92`, `:107`, `:122`, `:143`; `app/ui/src/hooks/useSettings.jsx:6` | Confirmed (non-export, no `await`) | MINOR | ✓ |
| 16 | Airports DB settings error notification never shows: the hook receives `isSaveError`/`saveError` but reads `isError`/`error`. | `app/ui/src/components/Airports/AirportsDB.jsx:40`, `app/ui/src/hooks/useAppNotifications.jsx:4` | Confirmed | MINOR | ✓ |
| 17 | If the initial settings load fails, `useSettings` returns a new default object every render. `Settings.jsx` then calls `setSettings(data)` in an effect on every render, which can loop. | `app/ui/src/hooks/useSettings.jsx:83`, `app/ui/src/components/Settings/Settings.jsx:17-22` | Suspected: confirm by making `/api/settings/list` fail on first load and watching for React's "Maximum update depth" warning | MINOR | ✓ |
| 18 | Dead code: `Settings.AircraftClasses` has no readers. `UpdateDefaults` has no callers. `ExportPDF.CustomTitle` (`custom_title`) is never read or written; the custom title lives in the attachments table and reaches the exporter only as `CustomTitleBlob` (also `ARCHITECTURE_PDF_EXPORT.md` §11 #15). | `internal/models/structs.go:227`, `internal/models/export.go:6-42`, `internal/models/structs.go:216`, `app/handlers_export.go:140-142` | Confirmed (grep over `app/`, `internal/`, `app/ui/src`; the UI's `custom_title_a4/a5` strings are attachment ids, not this field) | MINOR | ✓ |

## 12. Rules for Future Development

**Recipe A: add a general setting (e.g. a new interface preference)**

1. Add the field to `Settings` in `internal/models/structs.go:221-272` with a snake_case JSON tag. Do not change the type of an existing key (see Recipe F).
2. If it needs a non-zero default, backfill it in `CheckDefaultValues` (`internal/models/models_defaults.go:151-197`) behind its own zero-value check. Do not hang it off an existing group check (issue #13).
3. If the backend needs it per request, read it with `GetSettings` inside the handler. If you cache it like `timeFieldsAutoFormat` (`app/main.go:47`, `:199`, `app/handlers_settings.go:48`), also refresh it after DB upload (`app/handlers_db.go:58`).
4. UI input goes in the matching card under `app/ui/src/components/Settings/GeneralSettings/` and uses `handleChange("<key or dot.path>", value)`. Numeric values must reach the server as numbers: coerce them in the input or in `updateSettings` (`app/ui/src/util/http/settings.jsx:15-26`).
5. Expose a read helper with the **same default as the backend** in `useSettings` (`app/ui/src/hooks/useSettings.jsx:129-138`). Do not add a third fallback (issue #6).
6. Add help text in `app/ui/src/components/Settings/GeneralSettings/HelpButton.jsx:8-46`.

**Recipe B: a setting edited outside the Settings page**

1. Add a partial-update handler modelled on `HandlerApiSettingsSignature` (`app/handlers_settings.go:53-75`): `GetSettings` → copy only the owned fields → `UpdateSettings`. Follow every `app.handleError(w, err)` with `return`, because the helper only writes the 500 response (`app/helpers.go:53-63`). Answer with `app.writeOkResponse` (`app/helpers.go:45`).
2. Register it inside `r.Route("/settings", …)` (`app/routes.go:82-90`), which is under `app.Auth` (`app/routes.go:27`).
3. Protect the field from the general save by restoring it from `oldsettings` in `HandlerApiSettingsUpdate` (`app/handlers_settings.go:36-40`).
4. Add a fetch function in `app/ui/src/util/http/settings.jsx`. Its mutation must `invalidateQueries({ queryKey: ['settings'] })`. Pass the new value to `mutate(vars)` instead of relying on a closure (issue #3).

**Recipe C: add a PDF export option**

1. Add the field to `ExportPDF` (`internal/models/structs.go:200-218`) and a default in `pdfA4Defaults`/`pdfA5Defaults` (`internal/models/models_defaults.go:129-147`). These defaults reach only DBs whose block has `logbook_rows == 0`, because `CheckDefaultValues` then replaces the whole block (`internal/models/models_defaults.go:163-176`). For existing DBs, backfill the new field in `CheckDefaultValues` behind its own zero-value check (or make the zero value the safe default).
2. **Add the copy line** in `HandlerApiSettingsExportUpdate` (`app/handlers_settings.go:132-145`). Without it the value is silently dropped (issue #1).
3. UI: the input goes in `app/ui/src/components/PdfExport/*`. If it is an integer, add it to `INT_FIELDS` (`app/ui/src/components/PdfExport/SaveSettingsButton.jsx:11-14`). Parse float (mm) values with `parseFloat`, because `INT_FIELDS` goes through `parseInt` (`:45`) and truncates them (see `ARCHITECTURE_PDF_EXPORT.md` §11 #5). If it should restore, add it to `PageSettingsFields` (`app/ui/src/components/PdfExport/RestoreDefaultsButton.jsx:18-21`).
4. Consume it in `internal/pdfexport` through `p.Export.<Field>`; the exporter reads only the stored block (for example `internal/pdfexport/pdfexport.go:147-163`). Full steps: `ARCHITECTURE_PDF_EXPORT.md` §12 Recipe A.

**Recipe D: add a standard field header**

1. `ColumnsHeader` (`internal/models/structs.go:165-198`), `standardFieldsHeaders` (`internal/models/models_defaults.go:39-72`), and `pdfDefaultHeaders` (`:4-36`) if it appears in the PDF.
2. `defaultFieldNames.table` and `.flightRecord` (`app/ui/src/hooks/useSettings.jsx:6-77`), and `HEADERS_CONFIG` (`app/ui/src/components/Settings/StandardFields/StandardFields.jsx:16-107`).
3. Backfill the new key for existing DBs in `CheckDefaultValues`. The current check only fires on an empty `Date` (`internal/models/models_defaults.go:184`).
4. If it appears in the PDF: add it to the PDF header editor `HEADERS_CONFIG` (`app/ui/src/components/PdfExport/PageSettings.jsx:48-135`), print it in `initHeaders` (`internal/pdfexport/pdfexport.go:166-189`), and backfill the key into `export_a4.headers`/`export_a5.headers` in `CheckDefaultValues`, because the block reset (`internal/models/models_defaults.go:163-176`) does not fire for existing DBs. A new PDF column also needs widths and index shifts: `ARCHITECTURE_PDF_EXPORT.md` §12 Recipe B.

**Recipe E: add a time or date display format**

- Time: change all four formatters together: `app/helpers.go:115-140`, `internal/pdfexport/pdfexport.go:502-531`, `app/ui/src/util/helpers.jsx:4-23`, and `parseTimeToMinutes` (`:26-47`). Also update the `TimeField` input masks (`app/ui/src/components/UIElements/TimeField.jsx:17-53`) and both toggles (`app/ui/src/components/Settings/GeneralSettings/OtherSettings.jsx:59-61`, `app/ui/src/components/PdfExport/OtherSettings.jsx:52-53`). Use identical rounding (issue #7).
- Date: add a toggle in `OtherSettings.jsx:79-81`. The string must be a valid dayjs format, because it is passed to the MUI DatePicker `format` prop (`app/ui/src/components/UIElements/DatePicker.jsx:22`). Storage stays `YYYY-MM-DD` (`:10`). Import date recognition is separate (`convertToDate` `app/ui/src/components/Import/helpers.jsx:6-19`).

**Recipe F: change the type or meaning of an existing key**

`json.Unmarshal` failure breaks `GetSettings`, and with it every `/api` call. Write a migration that rewrites the JSON in `settings2`, modelled on `migratePreviousExperience` (`internal/driver/data_overhaul.go:245-309`). Bump `schemaVersion` (`internal/driver/db_structure.go:4`) and call the migration from `validateDB` behind a version check, as `dataOverhaulMigration` is called for versions below 100 (`internal/driver/driver.go:47-54`). See `ARCHITECTURE_DATABASE.md`.

**Cross-check list (every settings change)**

- [ ] Both engines: the MySQL `settings` column is `TEXT` (`internal/driver/db_structure.go:10`). Keep blobs out of the document (use the attachments table, as the custom title does).
- [ ] `schemaVersion` (`internal/driver/db_structure.go:4`): bump only for DDL or data migrations, not for new JSON keys.
- [ ] Route under the `/api` group (Auth) in `app/routes.go`; `hash` stays blanked in `HandlerApiSettingsList`.
- [ ] Never call `UpdateSettings` with a partially filled `Settings`; always `GetSettings` first.
- [ ] Every `app.handleError(w, err)` is followed by `return` (`app/helpers.go:53-63`); mutations answer with `app.writeOkResponse`.
- [ ] UI invalidates `['settings']` (and `['auth-enabled']` for auth fields) after the mutation.
- [ ] Backend and UI defaults match (fresh DB stores zero values).
- [ ] `useSettings` consumers (about 30 files) still work if the new key is missing (older DB).
- [ ] Tests: extend `app/ui/src/hooks/useSettings.test.jsx` with awaited assertions; add Go tests for new handler logic; run `make test` and `cd app/ui && npm run test:run`.
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:` / `- Update:` / `- Fix:`) and the same bullet in the README copy (`README.md:66`); update the README Settings feature list (`README.md:272-278`) if user-visible.

## 13. AI Notes

### Mental Model

One JSON document in one DB row, written by four HTTP endpoints, each owning a slice. The general save replaces everything except the PDF blocks and the signature. The signature, airports and per-format PDF endpoints patch only their own fields onto a fresh `GetSettings`. Reads are cached in the browser for an hour under `['settings']`. On the server, only the global time format and the auth values are cached in memory.

### Gotchas

- The three Save icons on the Settings page (General, Previous Experience, Standard Fields) are the same component and save **all** cards at once. The Signature card has its own endpoint, and a general save does not persist a drawn signature. A signature save, in turn, refetches `['settings']` and discards unsaved edits on the other cards (§8).
- Custom fields store their `category` as the standard header's **display text** (`app/ui/src/components/Settings/CustomFields/CustomFieldModal.jsx:81-94`). Renaming a header in `standard_fields_headers`, or toggling `enable_custom_names` when the custom and default names differ, drops those fields out of their logbook column group (`app/ui/src/components/Logbook/helpers.jsx:109`; `ARCHITECTURE_LOGBOOK.md` §11 #7).
- `time_fields_auto_format` exists twice: globally (UI tables, import log) and inside `export_a4`/`export_a5` (PDF only).
- `date_fields_format` is UI-only. Go never reads it, and the PDF prints ISO dates.
- `app.formatTimeField` is used only by the import log. UI formatting is in `app/ui/src/util/helpers.jsx`, PDF formatting in `internal/pdfexport/pdfexport.go`.
- `checkSettingsTable` runs only when the schema version changes. `CheckDefaultValues` runs only at startup, not after DB upload.
- `PdfExport.jsx` uses the same `['settings']` key without `staleTime`, so it refetches on mount.
- `penColor` lives only in local UI state. It is sent with saves but ignored by Go (no struct field).

### File Quick Reference

| Need | File |
|---|---|
| Endpoints | `app/handlers_settings.go`, routes `app/routes.go:82-90` |
| Persistence / hashing | `internal/models/settings.go` |
| Defaults / startup backfill | `internal/models/models_defaults.go` |
| JSON contract | `internal/models/structs.go:139-272` |
| Server time formatting | `app/helpers.go:115-140` |
| Page + local state | `app/ui/src/components/Settings/Settings.jsx` |
| Read hook | `app/ui/src/hooks/useSettings.jsx` |
| HTTP client | `app/ui/src/util/http/settings.jsx` |
| UI time/date formatting | `app/ui/src/util/helpers.jsx:4-47`, `app/ui/src/components/UIElements/DatePicker.jsx` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
