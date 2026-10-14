# Frontend (SPA Infrastructure) — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP)

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

The pilot uses the logbook through a single-page app: React 19, MUI 9 / MUI X 9, TanStack Query 5 and react-router 7 (`app/ui/package.json:14-35`), built with Vite 8 and tested with Vitest 5 (`app/ui/package.json:36-49`). This document covers the app shell and the shared plumbing, not the domain pages: the router tree, the provider stack, the dashboard layout, the HTTP layer (`util/http`), the query-hook pattern, browser persistence, the theme and the reusable `components/UIElements` (form fields, `XDataGrid`, `Filters`, CSV export).

The production build (`app/ui/dist`) is embedded in the Go binary with `//go:embed ui/dist/*` (`app/handlers_aux.go:12-13`). `HandlerUI` serves it at `/*` with an SPA fallback to the built index.html (`app/handlers_aux.go:15-30`, `app/routes.go:165`). In development, `npm run dev` (`app/ui/package.json:7`) runs the Vite dev server, and every API call goes cross-origin to `http://localhost:4000/api` (`app/ui/src/constants/constants.jsx:9-12`).

## 2. Key Concepts

| Concept | Definition / invariant | Evidence |
|---|---|---|
| Embedded SPA | `app/ui/dist` is git-ignored and must be built before any `go build`/`go vet`/`go test`, because `//go:embed ui/dist/*` needs files to match | `app/ui/.gitignore:11`, `app/handlers_aux.go:12`, `.github/workflows/go.yml:21-22` |
| `API_URL` | `'/api'` (same origin) in production builds. `'http://localhost:4000/api'` when `import.meta.env.MODE === 'development'` | `app/ui/src/constants/constants.jsx:9-12` |
| Request function | One exported `async` function per endpoint in `util/http/<domain>.jsx`. Each builds the URL from `API_URL`, adds the `Authorization: Bearer <token>` header by hand, and calls `handleFetch` | e.g. `fetchLogbookData` in `app/ui/src/util/http/logbook.jsx:40-53` |
| `handleFetch` | The single fetch wrapper. On a non-2xx response it calls `handle401`, then throws an `Error` with `.code` (HTTP status) and `.info` (parsed JSON body, or a fallback `{message}`). `returnJson=false` returns a `Blob` | `app/ui/src/util/http/http.jsx:13-31` |
| `queryClient` | One module-level `new QueryClient()` with library defaults. It is imported directly by components for `invalidateQueries` | `app/ui/src/util/http/http.jsx:4` |
| Query-hook pattern | `xQueryOptions = queryOptions({queryKey, queryFn, staleTime: 3600000, gcTime: 3600000, refetchOnWindowFocus: false, select})` plus `useXQuery(options = {})`, which spreads caller options over the defaults | `app/ui/src/hooks/queries/useLogbookQuery.js:4-18` |
| Whole-logbook cache | `['logbook']` holds **every** flight record. Stats, currency and the autocomplete options of the `UIElements` selects are computed client-side from it | `app/ui/src/components/UIElements/AircraftReg.jsx:9`, `app/ui/src/components/UIElements/DepartureArrival.jsx:28`, `app/ui/src/components/UIElements/FlightTags.jsx:17` |
| Time values | Time fields are integer **minutes** end to end. `formatTimeField` renders them (format 1 = `HH:MM`, 2/0 = `H:MM`, 3 = decimal hours). `parseTimeToMinutes` parses user input | `app/ui/src/util/helpers.jsx:4-47` |
| Date values | Stored and sent as `YYYY-MM-DD`. They are displayed in the user's `date_fields_format` (default `DD/MM/YYYY`) | `app/ui/src/components/UIElements/DatePicker.jsx:10`, `:22`; `app/ui/src/hooks/useSettings.jsx:137` |
| Form-element contract | `UIElements` inputs take `gsize` (MUI Grid size), `id`, `label`, `tooltip` and `handleChange(id, value)`. They are wrapped in a `<Grid>` unless `disableGrid` is set | `app/ui/src/components/UIElements/TextField.jsx:6-29`, `app/ui/src/components/UIElements/Select.jsx:6-59` |
| No client-side route guard | The root route has `loader: authLoader`, but nothing reads its data. Pages render and fire queries, and only a 401 redirects to `/signin` | `app/ui/src/main.jsx:44`, `app/ui/src/util/auth.jsx:18-22`, `app/ui/src/util/http/http.jsx:6-11` |
| Global navigate | `NavigationSetter` stores react-router's `navigate` in a module variable, so non-React code (`handle401`) can redirect | `app/ui/src/App.jsx:22-26`, `app/ui/src/util/navigation.js:1-11` |

## 3. How It Works

### 3.1 Boot sequence

| Step | What happens | Evidence |
|---|---|---|
| 1 | `app/ui/index.html` mounts `#root` and loads `app/ui/src/main.jsx` as a module script (Vite rewrites this to hashed `/assets/*.js` on build) | `app/ui/index.html:13-14` |
| 2 | Roboto 300/400/500/700 CSS is imported | `app/ui/src/main.jsx:3-6` |
| 3 | `createBrowserRouter` builds the tree. A path-less `App` route wraps `/` (`Root` layout plus all pages), `/signin` and `/logout` | `app/ui/src/main.jsx:35-97` |
| 4 | Rendered inside `<StrictMode>` | `app/ui/src/main.jsx:99-103` |
| 5 | On module load, `App` sets the dayjs week start to Monday. It reads `themeMode` from `localStorage` (default `light`) | `app/ui/src/App.jsx:19-20`, `:29-31` |
| 6 | Provider stack: `ColorModeContext` → `ThemeProvider` { `CssBaseline`, `NavigationSetter` (sibling, wraps nothing), `LocalizationProvider(AdapterDayjs)` → `QueryClientProvider` → `NotificationsProvider` → `DialogsProvider` → `<Outlet/>` } | `app/ui/src/App.jsx:46-62` (children of `ThemeProvider` at `:49-59`) |
| 7 | `Root` renders `DashboardToolbar` (AppBar), `DashboardNavbar` (drawer) and `DashboardPageContent` (`<Outlet/>` for the page) | `app/ui/src/pages/Root.jsx:28-45` |
| 8 | The shell fires its own queries on every page under `/` (whether or not the user is signed in): `['version']`, `['latestRelease']` (GitHub API) and `['auth-enabled']`. While the drawer is expanded (desktop expanded, or the `keepMounted` mobile drawer, which always renders expanded), `LicensingNavTitle` in the Licensing nav item also fires `['settings']` and `['licensing']`. In desktop mini mode the item shows the string `miniTitle`, so `LicensingNavTitle` is not mounted and the nav does not fire these two queries | `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:25-40`, `:64-71`; `app/ui/src/components/Licensing/LicensingNavTitle.jsx:12-13`; `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:43`, `:185-216`, `:273-277`, `:283-285` |

### 3.2 Route table (`app/ui/src/main.jsx`)

| Path | Element | Line |
|---|---|---|
| `/` (index) | `LogbookPage` | `:47` |
| `/logbook`, `/logbook/:id` | `LogbookPage`, `FlightRecordPage` | `:48-53` |
| `/licensing`, `/licensing/:id` | `LicensingPage`, `LicenseRecordPage` | `:54-59` |
| `/map`, `/aircrafts` | `MapPage`, `AircraftsPage` | `:60-61` |
| `/persons`, `/persons/:uuid` | `PersonsPage`, `PersonViewPage` | `:62-67` |
| `/attachments`, `/airports` | `AttachmentsPage`, `AirportsPage` | `:68-69` |
| `/stats` (index), `/stats/dashboard`, `/by-year`, `/by-type`, `/by-category` | `StatsDashboardPage`, `StatsByYearPage`, `StatsByTypePage`, `StatsByCategoryPage` | `:70-78` |
| `/currency` | `CurrencyPage` | `:79` |
| `/export` (index), `/export/a4`, `/export/a5` | `PdfExportA4Page`, `PdfExportA5Page` | `:80-86` |
| `/import`, `/settings` | `ImportPage`, `SettingsPage` | `:87-90` |
| `/signin`, `/logout` (outside `Root`, no dashboard chrome) | `SignInPage`, `LogoutPage` | `:93-94` |
| any unknown path | no catch-all; the router error goes to `App`'s `errorElement` (`ErrorPage`) | `:38` |

### 3.3 Layout behaviour

| State | Behaviour | Evidence |
|---|---|---|
| Desktop (`>= sm`) | Permanent drawer, 180 px expanded / 85 px mini. The expanded flag persists in `localStorage` `dashboard-expanded` | `app/ui/src/pages/Root.jsx:14-24`, `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:71-87`, `:281-287` |
| Mobile (`< sm`) | Temporary drawer (`keepMounted`), toggled from the AppBar menu button | `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:267-279` |
| Nav item with children (Stats, Export) | Expanded: inline `Collapse`. Mini: `Popover` to the right | `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:137-148`, `:221-244` |
| Selected item | `location.pathname.startsWith('/<segment>')`. At `/`, no item is highlighted | `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:133-135` |
| Logout button | Shown only when `/api/auth-enabled` returns `true`. It navigates to `/logout` | `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:61-87` |
| Version chip | Shows `/api/version`. A "New" badge appears when the GitHub `tag_name` is newer (`compareVersions`) | `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:24-58` |
| Theme toggle | `ColorModeContext.toggleColorMode` flips light/dark and writes `themeMode` | `app/ui/src/App.jsx:33-42`, `app/ui/src/components/UIElements/Dashboard/ThemeSwitcher.jsx:12-24` |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/ui/index.html` | HTML shell, favicon, `<title>Logbook</title>`, module entry |
| `app/ui/src/main.jsx` | Router tree, `StrictMode` root |
| `app/ui/src/App.jsx` | Provider stack, theme mode state, dayjs locale tweak, `NavigationSetter` |
| `app/ui/src/pages/Root.jsx` | Dashboard layout (toolbar + drawer + content), drawer state |
| `app/ui/src/pages/ErrorPage.jsx` | Router `errorElement`: shows status/message and the raw error JSON |
| `app/ui/src/pages/*Page.jsx` | Thin wrappers that render one domain component (e.g. `app/ui/src/pages/LogbookPage.jsx:3-7`). Owned by the domain docs |
| `app/ui/src/util/http/http.jsx` | `queryClient`, `handle401`, `handleFetch` |
| `app/ui/src/util/http/{logbook,licensing,aircraft,airport,attachment,currency,db,export,fields,person,settings}.jsx` | Request functions per API area (§4.2) |
| `app/ui/src/util/http/index.js` | Barrel that re-exports **only** `logbook`, `licensing`, `aircraft` (`app/ui/src/util/http/index.js:1-3`) |
| `app/ui/src/util/auth.jsx` | Token/username in `localStorage`, `authLoader` |
| `app/ui/src/util/navigation.js` | `setNavigate` / `globalNavigate` |
| `app/ui/src/util/helpers.jsx` | `formatTimeField`, `parseTimeToMinutes`, `getValue`, stats aggregators (`getStats`, `getTotalsByMonthAndYear`, `getTotalsByAircraft`), `printPerson` |
| `app/ui/src/constants/constants.jsx` | `API_URL`, drawer widths, storage keys, initial form states, input slot props, plus the unused `defaultColumnFilterTextFieldProps` (§11 #20) |
| `app/ui/src/context/ColorModeContext.jsx` | `{ mode, toggleColorMode }` context |
| `app/ui/src/theme/getMPTheme.jsx`, `app/ui/src/theme/themePrimitives.js`, `app/ui/src/theme/customizations/*` | MUI theme: palette, typography, shape, shadows, component overrides |
| `app/ui/src/hooks/queries/*` | Shared query hooks + `useNightTime` mutation hook |
| `app/ui/src/hooks/useSettings.jsx` | Settings query + `fieldName`/`fieldNameF`, pagination options, time/date format |
| `app/ui/src/hooks/useCustomFields.jsx` | Custom-fields query, `getEnroute`, `calculateDistance` |
| `app/ui/src/hooks/useAppNotifications.jsx` | `useErrorNotification`, `useSuccessNotification` |
| `app/ui/src/hooks/useNotifications/useNotifications.jsx` | `NotificationsProvider` (single MUI `Snackbar`) + `useNotifications` |
| `app/ui/src/hooks/useDialogs/useDialogs.jsx` | `DialogsProvider` (promise-based dialog stack) + `useDialogs` |
| `app/ui/src/hooks/useLocalStorageState/*` | `useLocalStorageState` and codecs, copied from MUI Toolpad Core (MIT) (`app/ui/src/hooks/useLocalStorageState/README.md:1-7`) |
| `app/ui/src/components/UIElements/Dashboard/*` | `DashboardToolbar`, `DashboardNavbar` (`NAV_ITEMS`), `DashboardPageContent`, `ThemeSwitcher` |
| `app/ui/src/components/UIElements/XDataGrid/*` | MUI `DataGrid` wrapper: persisted pagination/columns, custom filter drawer, quick filter, aggregation footer |
| `app/ui/src/components/UIElements/{TextField,Select,TimeField,DatePicker,OptionSwitch}.jsx` | Form primitives |
| `app/ui/src/components/UIElements/{AircraftReg,AircraftType,AircraftCategories,DepartureArrival,FlightTags,PersonSelect,PersonRole}.jsx` | Domain-aware selects whose options come from cached queries |
| `app/ui/src/components/UIElements/Filters.jsx` | Date-range/aircraft/tag/place filter panel used by Map and Stats Dashboard |
| `app/ui/src/components/UIElements/CSVExportButton.jsx` | Client-side CSV export of the grid's visible rows, per-`type` mappers |
| `app/ui/src/components/UIElements/{Tile,CardHeader,Label,TableHeader,TableActionHeader,HelpButtonDrawer}.jsx` | Small presentational helpers. `Tile` reads only `title`/`value`/`size` (no tooltip support, §11 #18) |
| `app/ui/vite.config.js` | React plugin, manual vendor chunks, Vitest config |
| `app/ui/eslint.config.js` | Flat ESLint config for `*.js`/`*.jsx` |
| `app/ui/package.json`, `app/ui/.nvmrc` | Scripts and dependencies. Node `v22.19.0` |
| `app/handlers_aux.go` | `go:embed` and `HandlerUI` (SPA serving, owned by `ARCHITECTURE_APPLICATION.md`) |

### 4.2 API Endpoints

Every `/api` route except `POST /api/login` sits under the `Auth` middleware (`app/routes.go:24-27`). The SPA route `/*` (`HandlerUI`, gzip) is also public (`app/routes.go:165`). The only endpoint in this system's scope is that SPA route. The table also lists the two aux endpoints the shell itself calls. Their handlers are documented in `ARCHITECTURE_APPLICATION.md`.

| Method | Path | Handler | Notes |
|---|---|---|---|
| any (`r.Handle`); the browser sends GET | `/*` | `HandlerUI` (`app/handlers_aux.go:15-30`) | `middleware.Compress(5)`, outside `Auth` (`app/routes.go:165`). Rewrites any path that contains neither `assets` nor `favicon.ico` to `/`, so the built index.html is served (`app/handlers_aux.go:24-26`) |
| GET | `/api/version` | `HandlerVersion` (`app/handlers_aux.go:32-34`) | `Auth` (`app/routes.go:160`). Read by `DashboardToolbar` as `['version']` (`app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:25-32`) |
| GET | `/api/auth-enabled` | `HandlerAuthEnabled` (`app/handlers_aux.go:36-39`) | `Auth` (`app/routes.go:161`). Read by `DashboardToolbar` as `['auth-enabled']` (`app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:64-71`) |

**Request modules → owning docs**

| Module | Paths called (prefix `API_URL`) | Owning doc |
|---|---|---|
| `app/ui/src/util/http/logbook.jsx` | `/logbook/data`, `/logbook/{id}` (GET/PUT/DELETE), `/logbook/new`, `/logbook/night`, `/logbook/track/{id}`, `/logbook/{id}/signature` | `ARCHITECTURE_LOGBOOK.md` |
| `app/ui/src/util/http/logbook.jsx` (`fetchLogbookMapData`, `:55`) | `/logbook/mapdata` (feeds the Map) | `ARCHITECTURE_STATS_AND_MAP.md` |
| `app/ui/src/util/http/logbook.jsx` (`fetchDistance`, `:152`) | `/distance/{dep}/{arr}` | `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` (distance cache, `internal/models/helpers.go:26-52`). The handler `HandlerDistance` is in `app/handlers_aux.go:41-46` (`ARCHITECTURE_APPLICATION.md`) |
| `app/ui/src/util/http/licensing.jsx`, `app/ui/src/util/http/attachment.jsx`, `app/ui/src/util/http/currency.jsx` | `/licensing/*`, `/attachment/*`, `/currency/*` | `ARCHITECTURE_CURRENCY_LICENSING.md` |
| `app/ui/src/util/http/aircraft.jsx`, `app/ui/src/util/http/airport.jsx` | `/aircraft/*`, `/airport/*` | `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` |
| `app/ui/src/util/http/person.jsx` | `/person/*` | `ARCHITECTURE_PERSONS.md` |
| `app/ui/src/util/http/settings.jsx` | `/settings/*` | `ARCHITECTURE_SETTINGS.md` |
| `app/ui/src/util/http/settings.jsx` (`fetchVersion`, `fetchAuthEnabled`, `fetchLatestRelease`, `:68-95`) | `/version`, `/auth-enabled`, plus `https://api.github.com/repos/vsimakhin/web-logbook/releases/latest` (no auth header) | `ARCHITECTURE_APPLICATION.md` for the handlers (`app/handlers_aux.go:32-39`, `app/routes.go:160-161`). The toolbar that consumes them is this doc's (§3.3) |
| `app/ui/src/util/http/fields.jsx` | `/custom-fields/*` | `ARCHITECTURE_LOGBOOK.md` (handlers in `app/handlers_custom_fields.go`). The editor UI under `app/ui/src/components/Settings/CustomFields` is in `ARCHITECTURE_SETTINGS.md` |
| `app/ui/src/util/http/export.jsx` | `/export/{format}`, `/export/custom-title` | `ARCHITECTURE_PDF_EXPORT.md` |
| `app/ui/src/util/http/db.jsx` | `/db/filename`, `/db/upload-db`, `/db/download-db` | `ARCHITECTURE_APPLICATION.md` |
| Raw `fetch` (bypasses `handleFetch`) | `POST /login` (`app/ui/src/components/SignIn.jsx:39`), `POST /logout` (`app/ui/src/pages/LogoutPage.jsx:12`), `POST /import/run` streaming NDJSON (`app/ui/src/components/Import/ImportProgressDialog.jsx:54`) | `ARCHITECTURE_AUTH.md`, `ARCHITECTURE_IMPORT.md` |

### 4.3 Data Access

Not applicable — the SPA has no `DBModel` access; it reaches data only through `util/http` (§4.2, end-to-end trace in §6.1).

### 4.4 UI

**Shared query hooks (`app/ui/src/hooks/queries`, barrel `app/ui/src/hooks/queries/index.js:1-6`)**

| Hook / options | Query key | Request fn | Defaults | Evidence |
|---|---|---|---|---|
| `useLogbookQuery` / `logbookQueryOptions` | `['logbook']` | `fetchLogbookData` | 1 h stale/gc, no focus refetch, `select: data \|\| []` | `app/ui/src/hooks/queries/useLogbookQuery.js:4-18` |
| `useFlightQuery(id)` / `flightQueryOptions(id)` | `['flight', id]` | `fetchFlightData` | 1 h, no focus refetch | `app/ui/src/hooks/queries/useFlightQuery.js:4-18` |
| `useLicensingQuery` | `['licensing']` | `fetchLicenses` | 1 h, `select` → array | `app/ui/src/hooks/queries/useLicensingQuery.js:4-18` |
| `useAircraftsQuery` | `['aircrafts']` | `fetchAircrafts` | 1 h, `select` → array | `app/ui/src/hooks/queries/useAircraftsQuery.js:4-18` |
| `useModelsCategoriesQuery` | `['models-categories']` | `fetchAircraftModelsCategories` | 1 h, `select` → array | `app/ui/src/hooks/queries/useModelsCategoriesQuery.js:4-18` |
| `useNightTime` (mutation) | — | `fetchNightTime` (POST) | returns `calculateNightTime(flight)` | `app/ui/src/hooks/queries/useNightTime.js:6-21` |
| `useSettings` | `['settings']` | `fetchSettings` | 1 h, no focus refetch. Default data `{standard_fields_headers:{}}` | `app/ui/src/hooks/useSettings.jsx:83-89` |
| `useCustomFields` | `['custom-fields']` | `fetchCustomFields` | 1 h, **focus refetch on** (not disabled) | `app/ui/src/hooks/useCustomFields.jsx:9-14` |

Most queries (31 `useQuery(` call sites in `app/ui/src`, hooks included) are declared inline in domain components with their own keys, e.g. `['persons']` in `app/ui/src/components/UIElements/PersonSelect.jsx:16-21`.

**Cross-cutting providers and hooks**

| API | Contract | Evidence |
|---|---|---|
| `useErrorNotification({isError, error, fallbackMessage})` | Shows `error.info?.message \|\| error.message \|\| fallbackMessage` as an error snackbar for 3 s, keyed by `fallbackMessage` | `app/ui/src/hooks/useAppNotifications.jsx:4-17` |
| `useSuccessNotification({isSuccess, message})` | Success snackbar for 3 s | `app/ui/src/hooks/useAppNotifications.jsx:19-30` |
| `useNotifications().show(msg, {severity, key, autoHideDuration, anchorOrigin})` | One `Snackbar`. A new `show` replaces the current message (no queue). Clicking away does not close it | `app/ui/src/hooks/useNotifications/useNotifications.jsx:7-47` |
| `useDialogs().confirm(msg, opts)` / `.alert(msg, opts)` | Returns a Promise. `confirm` resolves `true`/`false`. Options: `title`, `okText`, `cancelText`, `severity` | `app/ui/src/hooks/useDialogs/useDialogs.jsx:33-47`, `:73-74` |
| `useDialogs().open(Component, payload)` | Renders `<Component open onClose(result) payload/>`. The Promise resolves with `result` 300 ms after close | `app/ui/src/hooks/useDialogs/useDialogs.jsx:60-75`, `:95-102` |
| `useLocalStorageState(key, initial, {codec})` | `useSyncExternalStore` over `localStorage`, synced across tabs (`storage` event) and within the tab (explicit emit in `setValue`, `useStorageState.tsx:93`; the import-time `setItem` patch, `:39-46`, targets direct writes and may not install, see §11 #12). Codecs: `CODEC_JSON`, `CODE_BOOLEAN`, `CODEC_NUMBER`, `CODEC_STRING`, dates | `app/ui/src/hooks/useLocalStorageState/useStorageState.tsx:39-46`, `:78-94`, `:147-198`; `app/ui/src/hooks/useLocalStorageState/codec.tsx:23-81` |

**`XDataGrid` (`app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx`)**

| Feature | Behaviour | Evidence |
|---|---|---|
| Identity | `tableId` is required. It keys four `localStorage` entries and the grid `key` | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:111-112`, `:246`; `app/ui/src/components/UIElements/XDataGrid/FilterContext.jsx:7-8` |
| Pagination | Persisted `{pageSize, page}`. Default page size 20. Options `[5,10,15,20,25,50,75,100,All]` unless `pageSizeOptions` is passed | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:19-20`, `:111`, `:256-259` |
| Column state | Width/visibility/order/resize events → `apiRef.exportState().columns` → persisted. Restored via `initialState.columns`. `customColumnVisibilityModel` sets hidden-by-default columns | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:117-135`, `:224-236`, `:254` |
| Custom filters | Applied **before** the grid by filtering `rows`. Operators `contains`, `equals` (boolean / `autocomplete` tags), `>=`/`<=` for `number`, `date`, `time`. The type comes from `column.columnType \|\| column.type` | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:143-201` |
| Quick filter | The only use of the DataGrid's own `filterModel` | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:250-251`, `app/ui/src/components/UIElements/XDataGrid/XToolbarQuickFilter.jsx:49-106` |
| Filter drawer | One field per column, grouped by `columnGroupingModel`. `filterable: false` columns are skipped | `app/ui/src/components/UIElements/XDataGrid/XToolbarFilterPanel.jsx:233-263`, `:305-379` |
| Columns drawer | Visibility switches grouped by `columnGroupingModel`. `hideable: false` columns are skipped | `app/ui/src/components/UIElements/XDataGrid/XToolbarColumnsPanel.jsx:134-208` |
| Footer | Page / Previous / Total aggregation rows (`aggregation: 'sum'\|'avg'\|'count'` or `aggregationFn`), `initialValues` (previous experience) added to Previous/Total, not to Page. `sum` = numeric sum (fields whose name contains `_time` as `toFixed(1)` strings). `count` = number of non-empty cells (+1 for a non-zero `initialValues` entry). `avg` = unweighted mean of cell values as a `toFixed(2)` string, with an `initialValues` entry counted as one sample (§11 #19) | `app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:59-247`; aggregation `:127-156`, `:166-204` |
| Toolbar | Title + icon, `customActions`, quick filter, filters, columns, reset widths. Below `md` it collapses into a menu | `app/ui/src/components/UIElements/XDataGrid/XToolbar.jsx:45-165` |
| Callbacks | `onFilteredRowsChange(filteredRows)` | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:203-208` |

## 5. Data Model & Persistence

No server tables are owned here. The browser keeps three kinds of state:

**`localStorage` keys**

| Key | Value | Writer | Evidence |
|---|---|---|---|
| `token`, `username` | JWT and display name | `setAuthData` / `removeAuthData` | `app/ui/src/constants/constants.jsx:6-7`, `app/ui/src/util/auth.jsx:3-11` |
| `themeMode` | `'light' \| 'dark'` | `App` | `app/ui/src/App.jsx:30`, `:38` |
| `dashboard-expanded` | `'true' \| 'false'` | `Root` | `app/ui/src/pages/Root.jsx:16` |
| `<tableId>-pagination`, `<tableId>-columns` | JSON | `XDataGrid` | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:111-112` |
| `<tableId>-filter-model`, `<tableId>-quick-filter-model` | JSON `{items:[...]}` | `FilterProvider` | `app/ui/src/components/UIElements/XDataGrid/FilterContext.jsx:7-8` |
| `flight-record-visibility-key` | JSON | Flight record field visibility | `app/ui/src/constants/constants.jsx:111` |
| `map-advanced-options`, `dashboard-options`, `custom-import-profile` | JSON | Domain components | `app/ui/src/components/FlightMap/helpers.jsx:15`, `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:23`, `app/ui/src/components/Import/MapFieldsDialog.jsx:79` |

Table IDs in use: `logbook`, `licensing`, `aircrafts`, `categories`, `standard-airports`, `custom-airports-2`, `persons`, `person-flights`, `attachments`, `currency`, `custom-fields`, `totals-year`, `totals-type`/`totals-category`. Renaming a `tableId` silently resets the user's saved columns, filters and pagination.

**In-memory state**

| State | Lifetime | Evidence |
|---|---|---|
| TanStack Query cache (`queryClient`) | Page lifetime. Never cleared on logout | `app/ui/src/util/http/http.jsx:4`; `app/ui/src/pages/LogoutPage.jsx:10-24` |
| `navigate` reference | Module variable, set on every `App` render | `app/ui/src/util/navigation.js:1-5`, `app/ui/src/App.jsx:22-26` |
| Same-tab storage listeners | Module `Map` in `app/ui/src/hooks/useLocalStorageState/useStorageState.tsx` | `app/ui/src/hooks/useLocalStorageState/useStorageState.tsx:6` |
| Dialog stack, snackbar message | Provider state | `app/ui/src/hooks/useDialogs/useDialogs.jsx:50`, `app/ui/src/hooks/useNotifications/useNotifications.jsx:8-10` |

## 6. Data Flow

### 6.1 Read: logbook table

| # | Hop | Evidence |
|---|---|---|
| 1 | `/logbook` → `LogbookPage` → `Logbook` → `useLogbookQuery()` | `app/ui/src/main.jsx:50`, `app/ui/src/pages/LogbookPage.jsx:3-7`, `app/ui/src/components/Logbook/Logbook.jsx:9` |
| 2 | `queryFn` → `fetchLogbookData({signal})` → `GET ${API_URL}/logbook/data` with Bearer token | `app/ui/src/hooks/queries/useLogbookQuery.js:6`, `app/ui/src/util/http/logbook.jsx:40-47` |
| 3 | Server: `app/routes.go:34` (gzip) → `HandlerApiLogbookData` → `GetFlightRecords` → `SELECT ... FROM logbook_view` | `app/handlers_logbook.go:8-16`, `internal/models/flightrecords.go:128-140` |
| 4 | Response: each record's `custom_fields` JSON string is parsed into an object | `app/ui/src/util/http/logbook.jsx:49-52` |
| 5 | `select` → array. Cached 1 h. `LogbookTable` renders `XDataGrid` | `app/ui/src/hooks/queries/useLogbookQuery.js:7-10`, `app/ui/src/components/Logbook/LogbookTable.jsx:298` |

### 6.2 Write: mutation + invalidation (pattern)

| # | Step | Evidence (`SaveFlightRecordButton`) |
|---|---|---|
| 1 | `useMutation({ mutationFn, onSuccess })` in a button component. The request fn (`createFlightRecord`/`updateFlightRecord`) serializes the payload | `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:24-28`; `app/ui/src/util/http/logbook.jsx:16-38` |
| 2 | `onSuccess` awaits `queryClient.invalidateQueries` for **every** key derived from the changed data: `['flight', uuid]`, `['logbook']`, `['currency']`, `['aircrafts']`, `['models-categories']` | `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:41-47` |
| 3 | `useErrorNotification` / `useSuccessNotification` report the result | `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:50-51` |
| 4 | Full reset after a DB upload or an import: `queryClient.invalidateQueries()` with no key | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:30`, `app/ui/src/components/Import/RunImportButton.jsx:34` |

### 6.3 Unauthorized request

`handleFetch` sees `!response.ok`. `handle401` calls `globalNavigate('/signin', 401)` (`app/ui/src/util/http/http.jsx:6-11`), then the error is thrown anyway (`:16-27`). The server sends 401 as plain text for a missing header (`app/handlers_auth.go:128-130`), or as `{ok:false,message}` for an invalid token (`app/handlers_auth.go:137`, `app/helpers.go:37-43`). Every SPA request fn sets the header by hand, and it becomes `Bearer null` when logged out (`app/ui/src/util/http/logbook.jsx:44`, `app/ui/src/util/auth.jsx:13-16`, §11 #7). The SPA's `handleFetch` 401s therefore always take the JSON branch. Only clients that send no header get the plain-text body. For a plain-text or other non-JSON error body, `response.json()` fails and `error.info` falls back to `{message: "<errorMessage> - <statusText>"}` (`app/ui/src/util/http/http.jsx:20-26`).

### 6.4 Dev vs production

| Mode | UI served by | API base | Cross-origin | Evidence |
|---|---|---|---|---|
| Production / `make start` | Go binary, embedded `dist`, gzip | `/api` | no | `app/handlers_aux.go:12-30`, `app/routes.go:165`, `Makefile:42-44` |
| `npm run dev` | Vite dev server (port: Vite default, not set in `app/ui/vite.config.js:25-27`) | `http://localhost:4000/api` | yes. Relies on CORS `AllowedOrigins: ["*"]` | `app/ui/src/constants/constants.jsx:10-12`, `app/routes.go:16-22` |
| Backend for dev | `make start_backend` → `-port=4000 -env=dev` (request logger on). It still needs an existing `app/ui/dist` to compile | — | — | `Makefile:1-2`, `:46-48`, `app/routes.go:12-14` |
| `npm run preview` | Vite preview of the production build | `/api` on the preview server. No proxy is configured, so the API calls fail | no | `app/ui/package.json:10`, `app/ui/vite.config.js:5-33` |

## 7. Config & Constants

| Name | Value | Location | Kind |
|---|---|---|---|
| `API_URL` (prod / dev) | `'/api'` / `'http://localhost:4000/api'` | `app/ui/src/constants/constants.jsx:9-12` | hardcoded (dev port does not follow `-port`) |
| Backend port | `4000` | `app/main.go:83`, `Makefile:1` | configurable (`-port`) |
| Query hooks `staleTime` / `gcTime` | `3600000` ms (1 h) | `app/ui/src/hooks/queries/useLogbookQuery.js:7-8` (same in siblings), `app/ui/src/hooks/useSettings.jsx:86-87` | hardcoded |
| `['version']`, `['auth-enabled']` stale/gc | `86400000` ms (24 h) | `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:29-30`, `:68-69` | hardcoded |
| `['latestRelease']` stale/gc | `604800000` ms (7 d) | `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:37-38` | hardcoded |
| Query `retry` | library default (no `defaultOptions`, no `retry` anywhere in `src`) | `app/ui/src/util/http/http.jsx:4` | hardcoded |
| Snackbar auto-hide | `3000` ms, bottom-left | `app/ui/src/hooks/useAppNotifications.jsx:13`, `:27`; `app/ui/src/hooks/useNotifications/useNotifications.jsx:32-34` | hardcoded |
| Dialog resolve delay | `300` ms | `app/ui/src/hooks/useDialogs/useDialogs.jsx:64-70` | hardcoded |
| Drawer widths | `180` / `85` px | `app/ui/src/constants/constants.jsx:3-4` | hardcoded |
| Mobile breakpoints | layout `< sm`; grid toolbar `< md` | `app/ui/src/pages/Root.jsx:14`, `app/ui/src/components/UIElements/XDataGrid/XToolbar.jsx:57` | hardcoded |
| AppBar `zIndex` | `30000` | `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:95` | hardcoded |
| Side drawers offset | `marginTop: 64px` | `app/ui/src/components/UIElements/XDataGrid/XToolbarFilterPanel.jsx:32-38`, `app/ui/src/components/UIElements/XDataGrid/XToolbarColumnsPanel.jsx:19-25`, `app/ui/src/components/UIElements/HelpButtonDrawer.jsx:12-18` | hardcoded |
| Grid defaults | page size `20`, row height `38`, density `compact` | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:19-20`, `:252-253` | hardcoded |
| Logbook pagination options | default `[5,10,15,20,25,30,50,100]`; overridden by setting `logbook_pagination` (CSV) | `app/ui/src/hooks/useSettings.jsx:79`, `:92-99` | configurable (Settings) |
| Time format | `time_fields_auto_format`, default `1` | `app/ui/src/hooks/useSettings.jsx:136` | configurable (Settings) |
| Date display format | `date_fields_format`, default `DD/MM/YYYY` | `app/ui/src/hooks/useSettings.jsx:137` | configurable (Settings) |
| Date picker `minDate` | `1903-12-17` | `app/ui/src/components/UIElements/DatePicker.jsx:25` | hardcoded |
| Week start | Monday (`weekStart: 1`) | `app/ui/src/App.jsx:20` | hardcoded |
| Theme default | `'light'` | `app/ui/src/App.jsx:30` | configurable (toggle) |
| Theme shape | `borderRadius: 8` | `app/ui/src/theme/themePrimitives.js:217-219` | hardcoded |
| Build sourcemaps | `false` | `app/ui/vite.config.js:8` | hardcoded |
| Vendor chunks | `vendor-mui-material`, `-mui-icons`, `-mui-x-data-grid`, `-mui-x-date-pickers`, `vendor-tanstack`, `vendor-react`, `vendor-maps` | `app/ui/vite.config.js:11-21` | hardcoded |
| Vitest | `globals`, `jsdom`, setup file `app/ui/src/setupTests.js` (imports `@testing-library/jest-dom`) | `app/ui/vite.config.js:28-32` | hardcoded |
| Node version | `v22.19.0` | `app/ui/.nvmrc:1` | hardcoded (not used by CI) |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| Non-2xx JSON error | `Error(statusText \|\| errorMessage)` with `.code` and `.info = body`. Surfaced by `useErrorNotification` using `info.message` | `app/ui/src/util/http/http.jsx:16-27`, `app/ui/src/hooks/useAppNotifications.jsx:9` |
| Non-JSON error body | Logs the parse error to the console. `info.message` = `"<errorMessage> - <statusText>"` | `app/ui/src/util/http/http.jsx:23-26` |
| 401 | Redirects to `/signin` and still throws. The second `navigate` argument (`401`) is not a valid options object | `app/ui/src/util/http/http.jsx:6-9` |
| Failed query | Retried by TanStack defaults (3 retries, 1/2/4 s back-off; library default, nothing set in the repo) before `isError` becomes true, so 404/500 errors surface about 7 s late. On a 401 the first failure already redirects to `/signin`, a sibling of `Root`, which unmounts the query observers, and TanStack then cancels the pending retries (§11 #2) | `app/ui/src/util/http/http.jsx:4-9`; `app/ui/src/main.jsx:40-46`, `:93` |
| Failed `mutateAsync` without `catch` | The error notification is shown, and the rejected promise surfaces as an unhandled rejection in the console | `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:59`, `app/ui/src/components/Settings/SaveSettingsButton.jsx:24` |
| Render/loader error inside a page | Root route's `errorElement` replaces the layout with `ErrorPage`. Providers stay mounted | `app/ui/src/main.jsx:45`, `app/ui/src/pages/ErrorPage.jsx:8-43` |
| Unknown URL | App-level `errorElement` → `ErrorPage` with the router's 404. `App` itself is replaced, so this page renders without the theme/query providers (default MUI theme) | `app/ui/src/main.jsx:36-38` |
| Deep link reload (`/logbook/<uuid>`) | The server rewrites any path without `assets`/`favicon.ico` to `/`, so the built index.html is served. Client routing takes over | `app/handlers_aux.go:24-26` |
| `localStorage` unavailable | `useStorageState` swallows read/write errors (`app/ui/src/hooks/useLocalStorageState/useStorageState.tsx:69-75`, `:82-91`). Direct accesses in `app/ui/src/App.jsx:30`, `app/ui/src/util/auth.jsx:3-21` and the module-level `setItem` patch (`app/ui/src/hooks/useLocalStorageState/useStorageState.tsx:39-46`) are unguarded | — |
| Request cancellation | Query GET fns forward TanStack's `signal`. The blob downloads `fetchExport` and `downloadDBFile` take none. Mutations mostly do not | e.g. `app/ui/src/util/http/logbook.jsx:45`, `:133-141`; `app/ui/src/util/http/export.jsx:5-13`; `app/ui/src/util/http/db.jsx:25-31` |
| `StrictMode` in dev | Effects are double-invoked in development (e.g. the `LogoutPage` effect that posts `/logout`) | `app/ui/src/main.jsx:100`, `app/ui/src/pages/LogoutPage.jsx:10-24` |
| Concurrent notifications | Last `show` wins. Only one snackbar exists | `app/ui/src/hooks/useNotifications/useNotifications.jsx:12-16` |
| `Filters` callback | `callbackFunction` is an effect dependency. An unmemoized callback re-runs the filter on every render | `app/ui/src/components/UIElements/Filters.jsx:160-165` |

## 9. Integration Points

| Doc | What crosses the boundary |
|---|---|
| `ARCHITECTURE_APPLICATION.md` | `//go:embed ui/dist/*` + `HandlerUI` SPA fallback (`app/handlers_aux.go:12-30`). `/*` route with gzip (`app/routes.go:165`). CORS for dev mode (`app/routes.go:16-22`). `writeJSON`/`writeErrorResponse` error shape consumed by `handleFetch`. DB upload/download (`app/ui/src/util/http/db.jsx`) |
| `ARCHITECTURE_AUTH.md` | Token storage (`app/ui/src/util/auth.jsx`), Bearer header in every request fn, `handle401` → `/signin`, `SignIn`/`LogoutPage` raw fetches, `['auth-enabled']` controls the logout button |
| `ARCHITECTURE_SETTINGS.md` | `useSettings` (`fieldName`, `paginationOptions`, `timeFieldsFormat`, `dateFieldsFormat`) consumed by `DatePicker`, `CSVExportButton`, `AircraftReg`, `AircraftType`, `DepartureArrival`. `useCustomFields` |
| `ARCHITECTURE_LOGBOOK.md` | `['logbook']` / `['flight', id]` hooks, `FLIGHT_INITIAL_STATE`, `TimeField`, `useNightTime`, `XDataGrid` grouping/aggregation, flight invalidation set |
| `ARCHITECTURE_STATS_AND_MAP.md` | `Filters`, `XFooter` aggregation, `Tile`, `CardHeader`, stats helpers in `app/ui/src/util/helpers.jsx:120-267`, `totals-*` CSV mappers |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | Routes `/licensing`, `/currency`, `/attachments`; `LicensingNavTitle` in `NAV_ITEMS` (`app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:43`); `useLicensingQuery`; `CURRENCY_INITIAL_STATE`, `LICENSE_INITIAL_STATE` |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `useAircraftsQuery`, `useModelsCategoriesQuery`, `AircraftCategories`/`AircraftReg`/`AircraftType` selects, `fetchDistance` |
| `ARCHITECTURE_PERSONS.md` | `PersonSelect`, `PersonRole`, `printPerson`, `persons`/`person-flights` CSV mappers |
| `ARCHITECTURE_PDF_EXPORT.md` | `app/ui/src/util/http/export.jsx` (blob downloads), `CSVExportButton` (client CSV) |
| `ARCHITECTURE_IMPORT.md` | Streaming `POST /import/run` via raw `fetch`, global `invalidateQueries()` after an import |
| `ARCHITECTURE_DATABASE.md` | None directly. Server-side time/date types decide what `formatTimeField`/`DatePicker` receive |

## 10. Testing

| Test file | Covers |
|---|---|
| `app/ui/src/hooks/useSettings.test.jsx` | `paginationOptions`, `fieldName`/`fieldNameF` (mocks `useQuery`) |
| `app/ui/src/hooks/useCustomFields.test.jsx` | `getEnroute` parsing, returned shape |
| `app/ui/src/hooks/useAppNotifications.test.jsx` | Error/success notification hooks |
| `app/ui/src/hooks/useLocalStorageState/useStorageState.test.tsx` | Storage hook basics, complex types |
| `app/ui/src/components/Currency/helpers.test.jsx` | Currency helpers (domain, see `ARCHITECTURE_CURRENCY_LICENSING.md`) |

- **Run:** `cd app/ui && npm run test:run` (or `npm test` for watch mode), after `npm install` (`app/ui/package.json:11-12`). Lint: `npm run lint` (`:9`).
- **In CI:** UI tests do run in CI. `npm run build` is `npm run test:run && vite build` (`app/ui/package.json:8`), `make build_ui` calls it (`Makefile:26-28`), and CI runs `make npm_install build_ui` (`.github/workflows/go.yml:21-22`). A failing UI test therefore fails CI, `make start` and `make build_all` (`Makefile:99`). ESLint is **not** run by the Makefile or CI.
- **Gaps:** `handleFetch`/`handle401` (`app/ui/src/util/http/http.jsx`), `formatTimeField`/`parseTimeToMinutes` (pure, `app/ui/src/util/helpers.jsx:4-47`), `XDataGrid` row filtering (`app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:143-201`), `XFooter` totals, `CSVExportButton` mappers, `useDialogs` promise flow. No component/route smoke tests.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | Stats CSV exports write "Co-Pilot" as `NaN:NaN` (or `NaN` in decimal mode). The mappers read `row.time.copilot_time`, but the totals objects use `co_pilot_time`, and `formatTimeField(undefined)` does not hit any guard (also `ARCHITECTURE_STATS_AND_MAP.md` #3) | `app/ui/src/components/UIElements/CSVExportButton.jsx:107`, `:125`; `app/ui/src/util/helpers.jsx:53-66`, `:5-6` | Confirmed: key mismatch traced from `createInitialTotals` to the mapper | MAJOR | 2026-10-14 |
| 2 | `QueryClient` uses library defaults (no `defaultOptions`/`retry` in `app/ui/src`), so a failed query is retried up to 3 times (1/2/4 s back-off) before `isError` and the error snackbar appear: 404/500 errors surface about 7 s late. On a 401 the first failure redirects to `/signin`, which unmounts every observer under `Root`, and TanStack then cancels the pending retries (the queryFns consume `signal`) | `app/ui/src/util/http/http.jsx:4-9`; `app/ui/src/main.jsx:40-46`, `:93` | Confirmed (no retry config, grep). The retry count/timing and the cancel-on-unmount are TanStack Query v5 library defaults, not checkable in the repo (`app/ui/node_modules` absent) | MINOR | 2026-10-14 |
| 3 | `XDataGrid` mutates the caller's `pageSizeOptions` array during render (`push` + numeric `sort`). For the logbook this is the memoized/module-level array from `useSettings` | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:218-222`; `app/ui/src/hooks/useSettings.jsx:79`, `:92-99`; `app/ui/src/components/Logbook/LogbookTable.jsx:307` | Confirmed (in-place mutation visible) | MINOR | 2026-10-14 |
| 4 | `{...props}` is spread **after** the computed props, so a caller's `sx` replaces the internal cell/header padding (`app/ui/src/components/Stats/ByAircraft/TotalsByAircraftTable.jsx:36`, `app/ui/src/components/Stats/ByYear/TotalsByYear.jsx:89`). A caller's `initialState` would drop the persisted column state. All custom props (`customSx`, `footer*`, `showAggregationFooter`, …) are also forwarded to MUI `DataGrid` | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:240-286` | Confirmed for `sx`/`initialState` override. Suspected for the forwarded props: confirm via dev-console unknown-prop warnings | MINOR | 2026-10-14 |
| 5 | Nested filter groups lose `timeFieldFormat` (the recursive `FilterGroup` call does not pass it), so time filters inside a nested group parse with format 1. Latent: the logbook grouping is flat today | `app/ui/src/components/UIElements/XDataGrid/XToolbarFilterPanel.jsx:289-297`; `app/ui/src/components/Logbook/LogbookTable.jsx:159-282` | Confirmed (latent) | MINOR | 2026-10-14 |
| 6 | Three call sites bypass `handleFetch` with raw `fetch`, so they get no 401 redirect and no `.info` error shape (also see `ARCHITECTURE_AUTH.md`, `ARCHITECTURE_IMPORT.md`) | `app/ui/src/components/SignIn.jsx:39`, `app/ui/src/pages/LogoutPage.jsx:12`, `app/ui/src/components/Import/ImportProgressDialog.jsx:54` | Confirmed | MINOR | 2026-10-14 |
| 7 | HTTP layer duplication: about 70 request fns repeat URL, header and `signal` boilerplate by hand (`Bearer null` is sent when logged out). The barrel exports only 3 of 11 modules | `app/ui/src/util/http/*.jsx`; `app/ui/src/util/http/index.js:1-3` | Confirmed | MINOR | 2026-10-14 |
| 8 | `authLoader` data is never read, and `handle401` passes `401` as `navigate`'s options. There is no client-side auth guard (also `ARCHITECTURE_AUTH.md` #14) | `app/ui/src/main.jsx:43-44`; `app/ui/src/util/auth.jsx:18-22`; `app/ui/src/util/http/http.jsx:8` | Confirmed (no `useLoaderData`/`useRouteLoaderData` in `src`) | MINOR | 2026-10-14 |
| 9 | `mutateAsync` is called without `await`/`catch` in handlers, so a failed mutation also logs "Uncaught (in promise)" | e.g. `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:59`, `app/ui/src/components/Settings/SaveSettingsButton.jsx:24` | Confirmed (`mutateAsync` rejects on error) | MINOR | 2026-10-14 |
| 10 | `app/ui/src/hooks/useSettings.test.jsx` imports `defaultFieldNames`, which is not exported, and does not `await` six `waitFor` calls, so those assertions are not enforced (also `ARCHITECTURE_SETTINGS.md` #15; note that UI tests **do** run in CI, §10) | `app/ui/src/hooks/useSettings.test.jsx:3`, `:57`, `:69`, `:92`, `:107`, `:122`, `:143`; `app/ui/src/hooks/useSettings.jsx:6` | Confirmed | MINOR | 2026-10-14 |
| 11 | ESLint matches only `**/*.{js,jsx}`, so the `.ts`/`.tsx` files under `app/ui/src/hooks/useLocalStorageState/` are neither linted nor type-checked (no `tsconfig`). Lint is not run by the Makefile or CI | `app/ui/eslint.config.js:10`; `Makefile:20-28`; `.github/workflows/go.yml:21-31` | Confirmed | MINOR | 2026-10-14 |
| 12 | `useStorageState` assigns `window.localStorage.setItem` at import, to emit same-tab events for direct writes. Whether this installs depends on the browser engine: under WebIDL `[[Set]]` on `Storage` (named property setter), the assignment may instead store an item named `"setItem"` (a no-op patch plus a junk key). Where the patch does install, hook writes notify twice (`setValue` emits again at `:93`). Unguarded `localStorage` access in `app/ui/src/App.jsx` and `app/ui/src/util/auth.jsx`, and the import-time access at `:40`, could crash the app when storage is blocked | `app/ui/src/hooks/useLocalStorageState/useStorageState.tsx:39-46`, `:93`; `app/ui/src/App.jsx:30`, `:38`; `app/ui/src/util/auth.jsx:3-21` | Suspected (patch/double emit): in devtools after load, check `Object.hasOwn(localStorage, "setItem")` and `localStorage.getItem("setItem")`. Suspected (crash): load with site storage blocked | MINOR | 2026-10-14 |
| 13 | `DialogsProvider` builds a new `api` object on each render, so every `useDialogs` consumer re-renders on any dialog change. `close` runs `dismiss` (side effects) inside a `setStack` updater | `app/ui/src/hooks/useDialogs/useDialogs.jsx:77-90` | Confirmed | MINOR | 2026-10-14 |
| 14 | `Filters` default `quickSelect="This Year"` matches no option label (`This Year - YYYY`). The date range is still right thanks to the initial state (also `ARCHITECTURE_STATS_AND_MAP.md` #8) | `app/ui/src/components/UIElements/Filters.jsx:135`, `:141`, `:152-158` | Confirmed | MINOR | 2026-10-14 |
| 15 | `server.sourcemap` is not a Vite dev-server option, so the setting is a no-op | `app/ui/vite.config.js:25-27` | Suspected: confirm against the Vite 8 config reference | MINOR | 2026-10-14 |
| 16 | CI does not install a pinned Node, so `.nvmrc` (`v22.19.0`) is only advisory and the runner's default Node builds the UI | `.github/workflows/go.yml:14-22`; `app/ui/.nvmrc:1` | Suspected: confirm the Node version in CI logs | MINOR | 2026-10-14 |
| 17 | `Filters` mutates its state: `filterData` assigns dayjs objects to `filter.start_date`/`end_date` of the `useState` object, so the `YYYY-MM-DD` strings set through `DatePicker` are replaced in place, and `callbackFunction` receives the mutated object (also `ARCHITECTURE_STATS_AND_MAP.md` #13) | `app/ui/src/components/UIElements/Filters.jsx:83-84`, `:144`, `:163-164`; `app/ui/src/components/UIElements/DatePicker.jsx:10` | Confirmed (direct property assignment on the state object) | MINOR | 2026-10-14 |
| 18 | `Tile` ignores the `tooltip` prop (only `title`/`value`/`size` are read), so the `field.description` tooltip that `CustomFieldsTiles` passes is never shown (also `ARCHITECTURE_STATS_AND_MAP.md` #7) | `app/ui/src/components/UIElements/Tile.jsx:6`; `app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx:90` | Confirmed | MINOR | 2026-10-14 |
| 19 | `XFooter` `count`/`avg` aggregate cell values, not the underlying records. On Stats custom-field columns, whose cells are already per-group counts/averages, the Total shows the number of groups or an average of averages. A duration average string (`"75.50"`) renders as `01:15.5` through `formatTimeField` in `HH:MM` mode. Only columns with `aggregation` `count`/`avg` are affected, and today those are only the Stats custom-field columns (also `ARCHITECTURE_STATS_AND_MAP.md` #4) | `app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:186-203`, `:30-32`; `app/ui/src/components/Stats/helpers.jsx:38-49`; `app/ui/src/util/helpers.jsx:13-21` | Confirmed (no other `count`/`avg` column in `app/ui/src`, grep) | MINOR | 2026-10-14 |
| 20 | Dead export `defaultColumnFilterTextFieldProps`, a leftover from `material-react-table` (removed in `f28eddf`) that reads `column.columnDef` | `app/ui/src/constants/constants.jsx:74-82` | Confirmed (no importer, grep) | SUGGESTION | 2026-10-14 |

## 12. Rules for Future Development

### R1 — Add a page / route
1. Create `app/ui/src/components/<Domain>/<Thing>.jsx` and a thin `app/ui/src/pages/<Thing>Page.jsx` wrapper (pattern: `app/ui/src/pages/LogbookPage.jsx:3-7`).
2. Register it under the `Root` children in `app/ui/src/main.jsx:46-91`. Use `/:id` children for detail pages with `"new"` as the create sentinel (`app/ui/src/components/FlightRecord/FlightRecord.jsx:22`).
3. Add a `NAV_ITEMS` entry (`segment` = path segment) in `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:41-69`. Provide `miniTitle` if `title` is JSX.
4. Do not put `assets` or `favicon.ico` in a client path: `HandlerUI` would not rewrite it to the built index.html (`app/handlers_aux.go:24`). No Go change is needed for a new client route.

### R2 — Call a new API endpoint
1. Backend: register the route inside `r.Route("/api", ...)` after `r.Use(app.Auth)` (`app/routes.go:26-27`), not next to `/api/login`. Put the handler `HandlerApi<Entity><Action>` in `app/handlers_<domain>.go`. Follow every `app.handleError(w, err)` with `return`, because the helper does not stop the handler (`app/helpers.go:53-63`). Answer mutations with `writeOkResponse` (`app/helpers.go:45-51`). Wrap large GETs in `r.With(middleware.Compress(5))` (`app/routes.go:34`). Evict `authCache`/`airportCache`/`distanceCache` on writes that change cached data (`internal/models/auth.go:11`, `internal/models/airports.go:13`, `internal/models/helpers.go:26`). See the owning domain doc.
2. Add a request fn to `app/ui/src/util/http/<domain>.jsx`: `${API_URL}/...`, `Authorization: Bearer ${getAuthToken()}`, forward `signal` for GETs, `'Content-Type': 'application/json'` for JSON bodies, and `handleFetch(url, options, '<user-facing message>', returnJson)`. Use `returnJson=false` for blobs or non-JSON responses (`app/ui/src/util/http/db.jsx:15-31`).
3. Never call `fetch` directly (§11 #6). If you import through `app/ui/src/util/http/index.js`, add the module there.

### R3 — Add a shared query hook
1. Create `app/ui/src/hooks/queries/use<X>Query.js` following `app/ui/src/hooks/queries/useLogbookQuery.js:4-18`: export `<x>QueryOptions` (or a factory taking an id), `staleTime`/`gcTime: 3600000`, `refetchOnWindowFocus: false`, `select` defaulting to `[]` for lists.
2. Re-export from `app/ui/src/hooks/queries/index.js`.
3. Pick a key root that existing invalidations already cover, or update every mutation that changes the data (R4).

### R4 — Add a mutation
1. `useMutation({ mutationFn, onSuccess: async () => { await queryClient.invalidateQueries({queryKey: [...]}) } })`, importing `queryClient` from `app/ui/src/util/http/http.jsx`.
2. Invalidate **every** derived key. For anything that touches flight records: `['flight', uuid]`, `['logbook']` (prefix match, so it also covers `['logbook','map']`), `['currency']`, `['aircrafts']`, `['models-categories']` (`app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:41-47`), and `['persons','flights']`, which `PersonView` caches for 1 h with no focus refetch (`app/ui/src/components/Persons/PersonView.jsx:35-41`). Do not copy the existing buttons as-is: `SaveFlightRecordButton` omits `['persons','flights']`, and `DeleteFlightRecordButton` invalidates only `['logbook']` and `['aircrafts']` (`app/ui/src/components/FlightRecord/DeleteFlightRecordButton.jsx:21-22`). Add `['attachments', id]` for attachments and tracks. After bulk DB changes, use `invalidateQueries()` with no key.
3. Report with `useErrorNotification` + `useSuccessNotification`. Gate destructive actions with `await dialogs.confirm(...)` (`app/ui/src/hooks/useDialogs/useDialogs.jsx:74`).

### R5 — Add a data table
1. Use `XDataGrid` with a **new unique** `tableId` (never reuse or rename one: §5). Pass `apiRef`, `rows`, `columns`, `getRowId`, `title`, `icon`.
2. Declare `type`/`columnType` (`number`, `date`, `time`, `boolean`, `autocomplete`) so the filter drawer picks the right field (`app/ui/src/components/UIElements/XDataGrid/XToolbarFilterPanel.jsx:233-263`). Set `filterable:false`/`hideable:false` where needed. Use `aggregation`/`aggregationFn` and `showAggregationFooter` for totals.
3. Style with `customSx`, not `sx` (§11 #4). Pass a fresh array as `pageSizeOptions` (§11 #3).
4. For CSV, add a mapper to `exportMappers` in `app/ui/src/components/UIElements/CSVExportButton.jsx:29-150`, using the exact row keys (§11 #1).

### R6 — Add or change a form element in `UIElements`
1. Keep the contract: `gsize`, `id`, `label`, `tooltip`, `handleChange(id, value)`, `disableGrid` (`app/ui/src/components/UIElements/TextField.jsx:6-29`).
2. Times are integer minutes: use `TimeField` plus `formatTimeField`/`parseTimeToMinutes` with the user's `timeFieldsFormat` (`app/ui/src/hooks/useSettings.jsx:136`). Dates are `YYYY-MM-DD` strings: use `DatePicker`, which displays `dateFieldsFormat`.
3. Multi-selects emit a `", "`-joined string (`app/ui/src/components/UIElements/Select.jsx:34`). Consumers split on `,`.

### R7 — Persist a UI preference
Use `useLocalStorageState('<unique-key>', initial, { codec: CODEC_JSON | CODE_BOOLEAN })` from `app/ui/src/hooks/useLocalStorageState`. Never store server data there, and list the new key in §5.

### R8 — Theme change
Edit tokens in `app/ui/src/theme/themePrimitives.js:72-222` (always handle both `mode === 'dark'` branches) or component overrides in `app/ui/src/theme/customizations/*.jsx` (exported via `app/ui/src/theme/customizations/index.js`, merged in `app/ui/src/theme/getMPTheme.jsx:7-15`).

### R9 — Dependency / toolchain bump
1. Propose the branch name `dependabot-YYYYMMDD` to the owner (never create it, `docs/rules/RULE_GIT.md` §3). Update `app/ui/package.json` + `app/ui/package-lock.json` together. Keep MUI X majors aligned with `@mui/material` (`app/ui/package.json:19-22`).
2. Check `manualChunks` still matches the module paths (`app/ui/vite.config.js:11-21`), and whether `.nvmrc` needs bumping.
3. Verify with `npm run lint` and `npm run build` (runs tests), then `make build_ui` for the Go embed.
4. Add the same `- Update:` bullet (e.g. `- Update: Golang and npm packages/security patches.`) under `## [Unreleased]` in `CHANGELOG.md` and in the `README.md` copy (`README.md:66`), as the dependency refreshes `948ac96` and `2b1f410` did.

### R10 — Change API base / dev setup
`API_URL` lives only in `app/ui/src/constants/constants.jsx:9-12`. A different backend port in dev requires editing it, because Vite has no proxy. Cross-origin access depends on `app/routes.go:16-22`.

### Cross-check list (every frontend change)
- [ ] Route added under `Root` in `app/ui/src/main.jsx` **and** in `NAV_ITEMS`, if it is navigable.
- [ ] Backend route is inside `app.Auth` (`app/routes.go:26-27`). Every `handleError` is followed by `return` (`app/helpers.go:53`), and caches are evicted on writes. If the schema changes: SQLite + MySQL variants and a `schemaVersion` bump (`internal/driver/db_structure.go:4`) per `ARCHITECTURE_DATABASE.md`.
- [ ] Every mutation invalidates all dependent query keys (R4). New queries use keys that existing invalidations cover.
- [ ] Errors go through `handleFetch` and are surfaced with `useErrorNotification`.
- [ ] Times are minutes and dates are `YYYY-MM-DD` on the wire. Display uses the Settings formats.
- [ ] New `localStorage` keys and `tableId`s are unique and documented in §5.
- [ ] `cd app/ui && npm run lint && npm run build` passes (the build runs Vitest). `app/ui/dist` is rebuilt before `go vet`/`make test`.
- [ ] Works in light **and** dark mode, and below the `sm`/`md` breakpoints.
- [ ] User-visible change: `CHANGELOG.md` `[Unreleased]` bullet (`- New:`/`- Update:`/`- Fix:`) **and** the same bullet in the changelog copy in `README.md` (`README.md:66`).
- [ ] This document is updated (§4, §5, §7, §11).

## 13. AI Notes

### Mental Model
A thin React shell (`app/ui/src/main.jsx` → `App` providers → `Root` layout) around domain components. All server state lives in one TanStack Query cache, keyed by short arrays. `['logbook']` is the full dataset, and most screens derive their numbers from it client-side. Writes are `useMutation` + manual `invalidateQueries`; there are no optimistic updates. Every HTTP call is a hand-written fn in `app/ui/src/util/http/*.jsx` that ends in `handleFetch`. UI preferences live in `localStorage` through `useLocalStorageState`. In production the SPA is a static bundle inside the Go binary. In dev it is Vite on its own port talking to the backend on port 4000.

### Gotchas
- `go build`, `go vet` and `make test` fail without `app/ui/dist`, so run `make build_ui` first. `npm run build` also runs the Vitest suite.
- `API_URL` switches only on `MODE === 'development'`. `npm run preview` and a dev backend on a port other than 4000 both break API calls.
- There is no route guard: protected pages render, fire queries, and get bounced by the first 401.
- `XDataGrid` filters rows **before** MUI sees them. Only the quick filter uses MUI's `filterModel`. CSV export uses the visible rows from `apiRef`.
- `XFooter` treats "no sort" as descending when computing "Previous" totals (`app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:95-96`), matching the newest-first logbook order.
- `formatTimeField(0)` returns `""` unless `formatZero` is set (`app/ui/src/util/helpers.jsx:6`). An unknown format value returns `undefined`.
- Renaming a `tableId` or a storage key silently drops users' saved state.
- The shared hooks (`app/ui/src/hooks/queries/*`, `useSettings`) and many inline queries disable focus refetch. Inline queries that omit `refetchOnWindowFocus` keep TanStack's default focus refetch. 13 files declare `useQuery` without it, e.g. `useCustomFields`, `PersonSelect`, `PersonRole`, `Currency` (`['currency']`, `app/ui/src/components/Currency/Currency.jsx:16-21`), `SummaryFlightMap` (`['logbook','map']`) and `FlightRecordPersons` (`app/ui/src/components/Persons/FlightRecordPersons.jsx:14-20`).
- The toolbar calls the public GitHub API on load (`app/ui/src/util/http/settings.jsx:88-95`). On offline installs it fails silently.
- All pages are imported eagerly (`app/ui/src/main.jsx:11-33`). There is no `React.lazy`, so the vendor chunks are only a caching split, not lazy loading.

### File Quick Reference
| Need | File |
|---|---|
| Add/change a route | `app/ui/src/main.jsx` |
| Sidebar entries | `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx` |
| Fetch wrapper / query client | `app/ui/src/util/http/http.jsx` |
| Request functions | `app/ui/src/util/http/<domain>.jsx` |
| Shared query hooks | `app/ui/src/hooks/queries/` |
| Settings-driven labels/formats | `app/ui/src/hooks/useSettings.jsx` |
| Notifications / dialogs | `app/ui/src/hooks/useAppNotifications.jsx`, `app/ui/src/hooks/useDialogs/useDialogs.jsx` |
| Table component | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx` |
| Time/date helpers | `app/ui/src/util/helpers.jsx`, `app/ui/src/components/UIElements/TimeField.jsx`, `app/ui/src/components/UIElements/DatePicker.jsx` |
| Constants / API base | `app/ui/src/constants/constants.jsx` |
| Theme | `app/ui/src/theme/` |
| Build / lint / test config | `app/ui/vite.config.js`, `app/ui/eslint.config.js`, `app/ui/package.json` |
| SPA serving in Go | `app/handlers_aux.go`, `app/routes.go:165` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
