# Code Style Rules

Derived from the code as of 2026-10-14; every rule cites a real example. Where the code is inconsistent, the rule says so and names the pattern to follow (the dominant one). When editing an existing file, its local style wins over this document for purely cosmetic choices (quotes, comment wording).

Related: `docs/rules/RULE_DEVELOPMENT.md` (how things fit together), `docs/rules/RULE_GIT.md` (staging and commit proposals).

---

## 1. Tooling

| Area | Tool / setting | Where | Notes |
|---|---|---|---|
| Go formatting | `gofmt` via `go fmt ./...` | `Makefile:17-18`; `make test` depends on `fmt` (`Makefile:32`) | `gofmt -l app internal` must print nothing |
| Go static checks | `go vet ./...` | `.github/workflows/go.yml:25` | needs `app/ui/dist` to exist (embed) |
| Go linters (golangci-lint, staticcheck) | — | Not found in code | do not add linter configs unasked |
| JS lint | ESLint flat config: `js.configs.recommended`, `reactHooks.configs.flat.recommended`, `reactRefresh.configs.vite` | `app/ui/eslint.config.js:7-21`; `npm run lint` (`app/ui/package.json:9`) | lints `**/*.{js,jsx}` only; not run in CI |
| JS formatting (Prettier, EditorConfig) | — | Not found in code | 2-space indent; statements end with `;` (almost every import line does) |
| Node version | `v22.19.0` | `app/ui/.nvmrc` | |

---

## 2. Go

### 2.1 Package layout and file naming

| What | Pattern | Example |
|---|---|---|
| HTTP handlers | `app/handlers_<domain>.go`, `package main` | `app/handlers_currency.go`, `app/handlers_custom_fields.go` |
| Handler tests | `app/handlers_<domain>_test.go` | `app/handlers_import_test.go` |
| Response helpers, shared app logic | `app/helpers.go` | `writeJSON` (`app/helpers.go:16`) |
| Routes | `app/routes.go` only | `routes` (`app/routes.go:9`) |
| DB access | `internal/models/<domain>.go`, methods on `*DBModel` | `internal/models/currency.go` |
| Shared structs (API + DB) | `internal/models/structs.go` — all 18 model types live here; no other model file declares a type | `Currency` (`internal/models/structs.go:327`) |
| Defaults | `internal/models/models_defaults.go` | `CheckDefaultValues` (`internal/models/models_defaults.go:151`) |
| Schema and migrations | `internal/driver/` | `internal/driver/db_structure.go`, `internal/driver/data_overhaul.go` |
| Pure helper packages | `internal/<pkg>/` | `internal/nighttime`, `internal/utils`, `internal/pdfexport` |

Domain file names mix singular and plural (`app/handlers_person.go` vs `internal/models/persons.go`, `app/handlers_attachments.go`). For an existing domain use its existing files; for a new domain use the singular for the handler file (majority: aircraft, airport, currency, person, flightrecord, licensing).

### 2.2 Naming

| Item | Pattern (follow this) | Examples | Deviations (do not copy) |
|---|---|---|---|
| HTTP handler | `HandlerApi<Entity><Action>` on `(app *application)`; Action = `List`, `Get` / `ByID`, `New`, `Update`, `Delete` | `HandlerApiCurrencyNew` (`app/handlers_currency.go:31`), `HandlerApiPersonList` (`app/handlers_person.go:14`), `HandlerApiFlightRecordByID` (`app/handlers_flightrecord.go:16`) | verb-first `HandlerApiGetLicensingRecords` (`app/handlers_licensing.go:15`), `HandlerApiNewLicensingRecord` (`app/handlers_licensing.go:78`); typo `HandlerApiCurrencytList` (`app/handlers_currency.go:12`) |
| Auth / aux handler | `Handler<Name>` without `Api` | `HandlerLogin` (`app/handlers_auth.go:164`), `HandlerVersion` (`app/handlers_aux.go:32`) | — |
| Middleware | method on `*application` returning `http.Handler` | `Auth` (`app/handlers_auth.go:112`) | — |
| DBModel method | `Get<Entities>` (list), `Get<Entity>` / `Get<Entity>ByID`, `Insert<Entity>`, `Update<Entity>`, `Delete<Entity>` on `(m *DBModel)` | `GetCurrencies`, `GetCurrency`, `UpdateCurrency`, `InsertCurrency`, `DeleteCurrency` (`internal/models/currency.go:3-79`); `GetFlightRecordByID` (`internal/models/flightrecords.go:27`) | `AddPerson` (`internal/models/persons.go:69`), `AddCustomAirport` (`internal/models/airports.go:143`), `RemoveCustomAirport` (`internal/models/airports.go:178`), `GetPersonById` (`internal/models/persons.go:39`) |
| Private row scanner | `fetch<Entities>(query, params...)` | `fetchPersons` (`internal/models/persons.go:10`), `fetchAirports` (`internal/models/airports.go:102`) | — |
| Local variables | camelCase | `flightRecord` (`app/handlers_flightrecord.go:74`) | snake_case `departure_place` (`app/helpers.go:73`) |
| Constants | unexported camelCase, grouped `const (...)` | `infoLogPrefix` in the `const (...)` block `app/main.go:17-23` | ungrouped single-line `const exportA4 = "A4"` / `const exportA5 = "A5"` (`app/handlers_export.go:17-18`) |

### 2.3 Structs, JSON tags, IDs

- Every API field has a **snake_case** JSON tag: `Reg string \`json:"reg_name"\`` (`internal/models/structs.go:38`). No camelCase tag exists in the codebase. Exception: `ExportPDF.CustomTitleBlob` (`internal/models/structs.go:217`) has no tag, so it is serialized as `CustomTitleBlob` inside `export_a4` / `export_a5` — in the `GET /api/settings/list` response (`HandlerApiSettingsList`, `app/handlers_settings.go:11-19`) and in the stored settings blob (`UpdateSettings`, `internal/models/settings.go:54`). Tag every new field; use `json:"-"` for internal-only fields.
- Group related fields in nested anonymous structs that mirror the JSON: `FlightRecord.Departure/Arrival/Aircraft/Time/Landings/SIM` (`internal/models/structs.go:28-62`), `Settings.LicensesExpiration` (`internal/models/structs.go:246-250`).
- Fields computed at read time (not stored) sit under a `// calculated` comment (`internal/models/structs.go:52-53`, `internal/models/structs.go:73-78`).
- `omitempty` only on optional response fields (`JSONResponse` `internal/models/structs.go:17-22`, `CrossCountry` `internal/models/structs.go:53`).
- IDs are `UUID string \`json:"uuid"\``, generated in the **handler** with `uuid.NewRandom()` before the `Insert…` call (`HandlerApiCurrencyNew` `app/handlers_currency.go:39-44`). Handlers name the result `uuid`, shadowing the package; harmless only because the package is not used again in that function.
- Durations are `int` minutes (`internal/models/structs.go:40-51`); dates are `string` `YYYY-MM-DD`. See `docs/rules/RULE_DEVELOPMENT.md` §8.
- JSON stored in a column stays a `string` field (`CustomFields` `internal/models/structs.go:69`; `Currency.Filters`, `SubMetrics` `internal/models/structs.go:338-339`).
- One-off request payloads are inline anonymous structs in the handler (`HandlerApiCopyPersonsFlightRecord` `app/handlers_person.go:188-191`, `HandlerLogin` `app/handlers_auth.go:179-182`).

### 2.4 Errors

- DBModel methods return the driver error unchanged — `return err` — the dominant pattern (`UpdateCurrency` `internal/models/currency.go:57`, `UpdateFlightRecord` `internal/models/flightrecords.go:83`).
- When adding context, wrap with `%w`: `fmt.Errorf("updating flight record %s: %w", record.uuid, err)` (`internal/driver/data_overhaul.go:238`). All 11 `%w` uses are in `internal/driver`; older code formats with `- %s` (`app/helpers.go:75`) — do not copy that.
- Static errors: `errors.New("invalid credentials")` (`internal/models/auth.go:85`).
- Messages: lowercase, no trailing period. They reach the pilot verbatim (`handleError` → JSON `message` → UI notification). Deviations: `"Person %s %s %s already exists"` (`internal/models/persons.go:77`), `errors.New("No files selected")` (`app/handlers_attachments.go:133`).
- In handlers: `app.handleError(w, err)` then `return` — see `docs/rules/RULE_DEVELOPMENT.md` §3.

### 2.5 Logging

- Only `package main` logs, through `app.infoLog`, `app.errorLog` (adds `Lshortfile`) and `app.warningLog`, created by `setupLogger` (`app/main.go:97-109`); output goes to stdout and `weblogbook-output.log`.
- Style: `app.errorLog.Printf("error checking airport db - %s\n", err)` (`app/main.go:173`), lowercase message.
- `handleError` already logs the caller's `file:line` (`app/helpers.go:53-63`). Do not log the same error again right before calling it (as `app/handlers_attachments.go:72-73` does).
- `internal/models` never logs (no `log`/`fmt.Print` in the package) — return errors instead.
- `internal/driver` prints startup and migration progress with `fmt.Println`/`fmt.Printf` because it has no access to the app loggers (`internal/driver/driver.go:57`, `internal/driver/data_overhaul.go:438`). Keep that style inside the driver only.

### 2.6 Comments

- English only. Exported functions get a `// Name does …` doc comment (dominant: `app/handlers_person.go:13`, `internal/models/helpers.go:21`).
- Several doc comments name the wrong function (`app/handlers_flightrecord.go:15`, `app/handlers_person.go:121`, `app/handlers_person.go:164`); correct the comment when you touch the function.
- Explain back-compat decisions inline (`internal/driver/db_structure.go:67`).

### 2.7 Other Go idioms in use

- First lines of every DBModel method that hits the DB: `ctx, cancel := m.ContextWithDefaultTimeout()` / `defer cancel()` (`internal/models/currency.go:4-5`).
- Named results on getters: `(currencies []Currency, err error)` (`internal/models/currency.go:3`).
- The module targets `go 1.26.9` (`go.mod:3`); modern features are in use and fine: range over int (`app/handlers_flightrecord.go:138`), `sync.Map.Clear` (`internal/models/helpers.go:111`).

---

## 3. JavaScript / React (`app/ui/src`)

### 3.1 Language

- **JSX only.** `.jsx` for components, pages, hooks, helpers and HTTP modules (253 `.jsx` vs 12 `.js` files); `.js` for query hooks (`app/ui/src/hooks/queries/*.js`), barrels (`app/ui/src/util/http/index.js`) and `app/ui/src/util/navigation.js`.
- TypeScript exists only in the vendored `app/ui/src/hooks/useLocalStorageState/` (copied from toolpad-core, licence file `LICENSE.toolpad-core` in that folder). Do not add `.ts`/`.tsx`; ESLint does not lint them (`app/ui/eslint.config.js:10`).
- No PropTypes (Not found in code). No path aliases in `app/ui/vite.config.js` — use relative imports.

### 3.2 Files and folders

| What | Pattern | Example |
|---|---|---|
| Route page | `src/pages/<Name>Page.jsx`, thin wrapper around one component | `app/ui/src/pages/CurrencyPage.jsx:1-9` |
| Route table | `createBrowserRouter` in `app/ui/src/main.jsx` | `app/ui/src/main.jsx:35-97` |
| Domain components | `src/components/<Domain>/<Name>.jsx`, PascalCase; entry component named like the folder | `app/ui/src/components/Currency/Currency.jsx` |
| Action components | `<Verb><Entity>Button.jsx`, `<Entity>Modal.jsx`, `AddEdit<Entity>Modal.jsx` | `app/ui/src/components/Currency/DeleteCurrencyButton.jsx`, `app/ui/src/components/Currency/CurrencyModal.jsx`, `app/ui/src/components/Persons/AddEditPersonModal.jsx` |
| Domain pure helpers + tests | `components/<Domain>/helpers.jsx` + `components/<Domain>/helpers.test.jsx` | `app/ui/src/components/Currency/helpers.test.jsx` |
| Shared UI building blocks | `src/components/UIElements/` | `app/ui/src/components/UIElements/TimeField.jsx`, `app/ui/src/components/UIElements/XDataGrid/` |
| Hooks | `src/hooks/use<Name>.jsx` | `app/ui/src/hooks/useSettings.jsx`, `app/ui/src/hooks/useCustomFields.jsx` |
| Shared query hooks | `src/hooks/queries/use<Entity>Query.js`, re-exported from `app/ui/src/hooks/queries/index.js` | `app/ui/src/hooks/queries/useLogbookQuery.js`, `app/ui/src/hooks/queries/index.js:1-6` |
| API calls | `src/util/http/<domain>.jsx` | `app/ui/src/util/http/currency.jsx` |
| Constants | `app/ui/src/constants/constants.jsx` | `API_URL` (`app/ui/src/constants/constants.jsx:9-12`) |
| Theme | `app/ui/src/theme/getMPTheme.jsx`, `app/ui/src/theme/customizations/` | `getMPTheme` (`app/ui/src/theme/getMPTheme.jsx:7`) |

### 3.3 Components

- Named arrow component plus default export at the bottom: `export const Currency = () => { … }` / `export default Currency;` (`app/ui/src/components/Currency/Currency.jsx:11`, `:37`). There are no `function` components in `components/` or `pages/`; `App` (`app/ui/src/App.jsx:28`) is the only exception.
- Callbacks passed down are wrapped in `useCallback`, derived values in `useMemo` (`app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:53-60`).
- Loading state: `if (isLoading) return <LinearProgress />;` (`app/ui/src/components/Currency/Currency.jsx:26`) or an inline `{isLoading && <LinearProgress />}` (`app/ui/src/components/Logbook/Logbook.jsx`).
- Confirmations via `useDialogs().confirm(...)` (`app/ui/src/components/Currency/DeleteCurrencyButton.jsx:27-31`); feedback via `useErrorNotification` / `useSuccessNotification` (`app/ui/src/hooks/useAppNotifications.jsx:4-31`). Pass the exact prop names `{ isError, error, fallbackMessage }`.

### 3.4 Imports

Group order with a comment line per group (`app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:1-14`):

1. React, react-router, TanStack Query (no comment)
2. `// MUI UI elements` — deep default imports: `import Tooltip from "@mui/material/Tooltip";`
3. `// MUI Icons` — deep default imports: `import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';`
4. `// Custom` — project modules, relative paths

- Deviations (do not copy): `app/ui/src/components/Currency/DeleteCurrencyButton.jsx:3-12` puts `// MUI Icons` before `// MUI UI elements`, uses `// Custom components and libraries` and has an MUI X import (`@mui/x-data-grid`) in the custom group. The comment wording varies across `app/ui/src`: `// MUI UI elements` 95, `// MUI Icons` 95, `// Custom` 86, but also `// MUI` 39, `// Custom components and libraries` 25, `// Custom components` 20 (counted with `grep -rhE '^\s*// (MUI|Custom)'`). In new files use the four groups above; in an existing file keep its wording.
- Deep MUI imports are the rule (about 500 deep imports vs 2 barrel imports: `app/ui/src/components/Persons/AddPersonButton.jsx:8`, `app/ui/src/components/UIElements/XDataGrid/XToolbar.jsx:12`). Icons are never imported from the barrel.
- Quotes are mixed (about 1060 single-quoted vs 730 double-quoted import lines) — follow the file you edit; use single quotes in new files only if nothing else guides you.

### 3.5 Styling

- MUI components with the `sx` prop (about 255 uses). No `.css`/`.scss` files (Not found in code).
- `styled()` from `@mui/material/styles` only inside shared UI (`app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:14`, `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:3`). Emotion is used only as MUI's engine — no direct `@emotion/*` imports (Not found in code).
- Global colours and component overrides belong in `src/theme/`; light/dark mode comes from `ColorModeContext` (`app/ui/src/App.jsx:33-44`).
- Grid v2 API: `<Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>` (`app/ui/src/components/Currency/Currency.jsx:30`).

### 3.6 TanStack Query conventions

- One `QueryClient`: import `queryClient` from `app/ui/src/util/http/http.jsx:4`; never create another.
- HTTP function shape (`fetchCurrency`, `app/ui/src/util/http/currency.jsx:5-13`):

  ```js
  export const fetchCurrency = async ({ signal }) => {
    const url = `${API_URL}/currency/list`;
    const options = {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      signal: signal,
    };
    return await handleFetch(url, options, 'Cannot fetch currencies');
  }
  ```

  Names: `fetch*`, `create*`, `update*`, `delete*`, `upload*`, `download*`; one object argument; pass `false` as the 4th `handleFetch` argument for blob responses (`app/ui/src/util/http/export.jsx:11`).
- Shared query hook shape (`app/ui/src/hooks/queries/useLogbookQuery.js:4-18`): export `<entity>QueryOptions` built with `queryOptions(...)` — a function `(id) => queryOptions(...)` for keyed data (`app/ui/src/hooks/queries/useFlightQuery.js:4-11`) — and `use<Entity>Query(options = {})` that spreads overrides. Defaults: `staleTime: 3600000`, `gcTime: 3600000`, `refetchOnWindowFocus: false`, `select: (data) => data || []` for lists.
- Where queries live: data needed by more than one component goes to `src/hooks/queries/` (introduced in `8b2fa8d`, 42 call sites). One-off inline `useQuery` in the owning component is still common (21 files) and acceptable (`app/ui/src/components/Currency/Currency.jsx:16-21`).
- Query keys: array; first element is the kebab-case entity, then scope/id: `['logbook']`, `['logbook', 'map']`, `['flight', id]`, `['persons', 'log', logUuid]`, `['models-categories']`, `['custom-fields']`. Reuse the existing key of an endpoint — grep `queryKey` before inventing one.
- Mutations: `useMutation({ mutationFn, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [...] }) } })` followed by both notification hooks (`app/ui/src/components/Currency/DeleteCurrencyButton.jsx:17-24`). Which keys to invalidate: `docs/rules/RULE_DEVELOPMENT.md` §9.

### 3.7 Tests

- Vitest + Testing Library, `globals: true`, `environment: "jsdom"`, setup `app/ui/src/setupTests.js` (`app/ui/vite.config.js:28-32`).
- Test file next to its source as `<name>.test.jsx`; import `describe`, `it`, `expect`, `vi` explicitly from `vitest` (`app/ui/src/components/Currency/helpers.test.jsx:1`, `app/ui/src/hooks/useSettings.test.jsx:2`).
- Mock modules with `vi.mock(...)` (`app/ui/src/hooks/useSettings.test.jsx:8-22`).
- Always `await waitFor(...)`; an un-awaited `waitFor` does not enforce its assertions (`app/ui/src/hooks/useSettings.test.jsx:92-94` — do not copy).

---

## 4. Pre-staging checklist

- [ ] `gofmt -l app internal` prints nothing.
- [ ] New handlers and DBModel methods follow §2.2; new JSON tags are snake_case.
- [ ] Errors returned or wrapped with `%w`; no logging inside `internal/models`.
- [ ] No new `.ts`/`.tsx`, `.css` or barrel MUI imports; components are named arrow functions with a default export.
- [ ] New shared queries live in `src/hooks/queries/` and reuse existing query keys.
- [ ] `npm run lint` is clean for touched files (when `app/ui/node_modules` is installed).
