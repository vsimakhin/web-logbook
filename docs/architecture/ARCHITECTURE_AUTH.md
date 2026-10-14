# Authentication — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — cross-links to APPLICATION §11 #8, #19 and SETTINGS §11 #2 (consistency pass)

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

Authentication is an **optional, single-user** login that protects every `/api/*` endpoint except `POST /api/login`. Pilots who expose their logbook to the internet turn it on from the Settings page (`README.md:275`, help text in `app/ui/src/components/Settings/GeneralSettings/HelpButton.jsx:35-39`). When it is off (the default for a new database: `checkSettingsTable` in `internal/driver/driver.go:129-158` inserts zero-valued settings, so `auth_enabled` is `false`), the `Auth` middleware passes every request through unchanged.

The backend part is `app/handlers_auth.go` (JWT creation/validation, `Auth` middleware, login with brute-force throttling, logout) plus `internal/models/auth.go` (credential check, token table access, in-memory auth cache). The UI part is the `/signin` and `/logout` routes (`app/ui/src/main.jsx:93-94`), `app/ui/src/util/auth.jsx` (token in `localStorage`) and the `Authorization: Bearer <token>` header that every request function calling `API_URL` in `app/ui/src/util/http/*.jsx` adds by hand (the only function without it is `fetchLatestRelease`, `app/ui/src/util/http/settings.jsx:88`, which calls api.github.com). A CLI flag, `-disable-authentication` (`app/main.go:88`), is the recovery path for forgotten credentials.

## 2. Key Concepts

| Concept | Definition / invariant | Evidence |
|---|---|---|
| Single user | Credentials are the one `login` + bcrypt `hash` pair stored in the settings JSON blob. There is no users table. | `Authenticate` in `internal/models/auth.go:78-96`; fields `internal/models/structs.go:229-233` |
| Auth flag | `Settings.AuthEnabled` (`auth_enabled`). It is read through the cache by `IsAuthEnabled` on **every** `/api/*` request. | `internal/models/auth.go:28-41`, `app/handlers_auth.go:115` |
| JWT | HS256, claims `username` (the **login**, not the display name) and `exp` = now + 24h. Signed with `Settings.SecretKey`. | `createToken` in `app/handlers_auth.go:31-49` |
| Secret key | 32 random bytes, base64. **Generated in the browser** each time the auth switch is turned on, then saved with the settings. Go code never generates it. | `onAuthToggle` in `app/ui/src/components/Settings/GeneralSettings/AuthSettings.jsx:11-21` |
| Server-side token allow-list | A JWT is accepted only if it is also a row in the `tokens` table (or is the single cached token). Logout deletes the row. | `VerifyToken` in `internal/models/auth.go:43-75`, `DeleteToken` `:111-122` |
| `authCache` | Package-level `sync.Map` with keys `secretKey`, `isAuthEnabled`, `token` (the last verified token). Cleared **only** by `UpdateSettings`. | `internal/models/auth.go:11`, `internal/models/settings.go:65` |
| Login throttling | In-memory map keyed by client IP. After 5 failures, requests are refused until a growing back-off expires. Not persisted. | `loginAttempts` in `app/handlers_auth.go:29`, `:165-200` |
| Token storage (UI) | `localStorage` keys `token` and `username`. Every API call reads the token synchronously. | `app/ui/src/constants/constants.jsx:6-7`, `app/ui/src/util/auth.jsx:8-16` |
| `username` in login response | Holds `Settings.OwnerName` (the display name), **not** the login. | `Authenticate` returns `settings.OwnerName` at `internal/models/auth.go:95`; `LoginResponse.Name` json `username` at `app/handlers_auth.go:19-22` |
| No client-side route guard | Protected pages render and fire queries. A 401 from the API is the only thing that redirects to `/signin`. | `handle401` in `app/ui/src/util/http/http.jsx:6-11` |

## 3. How It Works

### 3.1 Enabling authentication (Settings page)

| Step | What happens | Evidence |
|---|---|---|
| 1 | Pilot turns on "Enable Authentication". `onAuthToggle` sets `auth_enabled=true` and generates a new `secret_key`. | `AuthSettings.jsx:11-21`, `:25-33` |
| 2 | Pilot fills in Login and Password. Both fields are disabled while auth is off. | `AuthSettings.jsx:35-53` |
| 3 | Save sends the **whole** settings object via `PUT /api/settings/general`. | `updateSettings` in `app/ui/src/util/http/settings.jsx:15-26` |
| 4 | `HandlerApiSettingsUpdate` decodes into a fresh `Settings` and keeps only the export and signature fields from the old record. | `app/handlers_settings.go:22-51` |
| 5 | `UpdateSettings`: if the trimmed password is non-empty, it is bcrypt-hashed (cost 12) into `Hash` and `Password` is cleared. Otherwise the old hash is kept. The JSON is written to `settings2` and `authCache.Clear()` runs. | `internal/models/settings.go:31-68` |
| 6 | UI invalidates `['settings']` and `['auth-enabled']`. The refetch has no valid token, gets a 401, and `handle401` navigates to `/signin`. | `app/ui/src/components/Settings/SaveSettingsButton.jsx:15-18`, `app/ui/src/util/http/http.jsx:6-11` |

### 3.2 Sign-in

| Step | What happens | Evidence |
|---|---|---|
| 1 | `SignIn` checks that both fields are non-empty, then `POST {API_URL}/login` with `{login, password}` (no Authorization header). | `app/ui/src/components/SignIn.jsx:26-43` |
| 2 | `HandlerLogin` takes the client IP from `RemoteAddr`. If the IP already has ≥5 failures and is still inside its back-off window, it returns 403 "Too many failed login attempts". | `app/handlers_auth.go:165-177` |
| 3 | `Authenticate`: compares the login exactly, then `bcrypt.CompareHashAndPassword`. On success it returns `OwnerName`. | `internal/models/auth.go:78-96` |
| 4 | On failure: `failedAttempts+1`, `nextAttempt = now + previousFailures*10s`, then 403 with the error text. | `app/handlers_auth.go:190-200` |
| 5 | On success: counter reset, `createToken(login)`, `AddToken(token, login)`, then 200 `{"token","username"}`. | `app/handlers_auth.go:202-221` |
| 6 | UI stores the token and username in `localStorage` and navigates to `/`. | `SignIn.jsx:52-54`, `setAuthData` in `app/ui/src/util/auth.jsx:8-11` |

### 3.3 Authenticated request (`Auth` middleware, `app/handlers_auth.go:112-161`)

| # | Check | On failure |
|---|---|---|
| 1 | `IsAuthEnabled()` (cached) | DB error → 500 via `handleError` (`:115-119`) |
| 2 | Auth disabled → set ctx `auth=false`, call next | — (`:120-124`) |
| 3 | `Authorization` header present | 401 plain text "Missing authorization header" (`:127-131`) |
| 4 | Strip the first 7 chars (`"Bearer "`) | no prefix check (`:132`) |
| 5 | `verifyToken`: `jwt.Parse` (golang-jwt v5, `go.mod:10`) checks the signature with the secret key and the `exp`/`nbf` claims; the extra code then requires `exp` to be present. Its own "token has expired" branch (`:71-72`) is unreachable, because `jwt.Parse` already rejects an expired token. | 401 JSON with the error message (`:134-139`, `:51-82`) |
| 6 | `extractUsernameFromToken`: HMAC method enforced, `username` claim | 401 JSON (`:141-146`, `:84-110`) |
| 7 | `db.VerifyToken(token, username)`: cache hit, or a row in `tokens` | 401 JSON (`:148-154`, `internal/models/auth.go:43-75`) |
| 8 | Put `user` and `token` into the request context, call next | — (`:156-159`) |

### 3.4 Logout

| Step | What happens | Evidence |
|---|---|---|
| 1 | The toolbar shows the logout button only when `['auth-enabled']` is true. A click navigates to `/logout`. | `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:64-83` |
| 2 | `LogoutPage` fires `POST /api/logout` with the token (not awaited), clears `localStorage`, and navigates to `/signin`. | `app/ui/src/pages/LogoutPage.jsx:10-24` |
| 3 | `HandlerLogout` reads the token from the context, `DeleteToken`, then `303` redirect to `/signin` (the UI ignores the response). | `app/handlers_auth.go:225-233` |

### 3.5 Forgotten credentials: `-disable-authentication`

| Step | What happens | Evidence |
|---|---|---|
| 1 | Run the binary with `-disable-authentication` (plus the usual `-engine`/`-dsn`). | `app/main.go:88` |
| 2 | The DB is opened (schema validated), then `DisableAuthorization()` sets `AuthEnabled=false` via `UpdateSettings`. Login and hash are kept, because the stored password is empty. | `app/main.go:138-142`, `:154-156`; `internal/models/auth.go:125-139` |
| 3 | A warning is logged and the process **exits with code 0**. It never serves. Start the app again without the flag. | `app/main.go:159-160` |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/handlers_auth.go` | JWT create/verify/parse, `Auth` middleware, `HandlerLogin` (+ IP throttling), `HandlerLogout`, context keys |
| `internal/models/auth.go` | `authCache`; `GetSecretKey`, `IsAuthEnabled`, `VerifyToken`, `Authenticate`, `AddToken`, `DeleteToken`, `DisableAuthorization` |
| `app/routes.go` | Public `POST /api/login` (`:24`); `/api` sub-router with `r.Use(app.Auth)` (`:26-27`); `/logout` (`:30`, `:157`); `/auth-enabled` (`:161`); CORS (`:16-22`) |
| `app/main.go` | `-disable-authentication` flag (`:88`) and its handling (`:154-161`) |
| `app/handlers_aux.go` | `HandlerAuthEnabled` (`:36-39`); `HandlerUI` serves `index.html` for `/signin` and `/logout` (`:15-30`) |
| `internal/models/settings.go` | `UpdateSettings` hashes the password and clears `authCache` (`:31-68`) — owned by SETTINGS |
| `app/handlers_settings.go` | `HandlerApiSettingsList` strips `Hash` (`:18`); `HandlerApiSettingsUpdate` writes the auth fields (`:22-51`) — owned by SETTINGS |
| `internal/driver/db_structure.go` | `tokensTable` definition (`:102-107`) — owned by DATABASE |
| `app/ui/src/components/SignIn.jsx` | Sign-in form, `POST /login`, stores the token |
| `app/ui/src/pages/SignInPage.jsx` | Thin wrapper around `SignIn` |
| `app/ui/src/pages/LogoutPage.jsx` | Calls `/logout`, clears storage, redirects (renders nothing) |
| `app/ui/src/util/auth.jsx` | `setAuthData`, `removeAuthData`, `getAuthToken`, `authLoader` |
| `app/ui/src/util/http/http.jsx` | `queryClient`, `handleFetch`, `handle401` → `/signin` |
| `app/ui/src/util/navigation.js` | `setNavigate` / `globalNavigate`, so non-component code can redirect |
| `app/ui/src/util/http/*.jsx` | Per-domain API functions. Each one that calls `API_URL` adds `Authorization: Bearer ${getAuthToken()}` inline. The only exception is `fetchLatestRelease` (`app/ui/src/util/http/settings.jsx:88`), which calls api.github.com. |
| `app/ui/src/components/Settings/GeneralSettings/AuthSettings.jsx` | Auth switch, login/password/secret fields, client-side secret generation |
| `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx` | `['auth-enabled']` query and the logout button |
| `app/ui/src/constants/constants.jsx` | `TOKEN_KEY`, `USERNAME_KEY`, `API_URL` |

### 4.2 API Endpoints

| Method | Path | Handler | Notes |
|---|---|---|---|
| POST | `/api/login` | `HandlerLogin` (`app/handlers_auth.go:164`) | **Public** (`app/routes.go:24`). Body `{login, password}` → 200 `{token, username}` / 403 `{ok:false, message}`. Documented for scripts in `README.md:321-331`. |
| POST | `/api/logout` | `HandlerLogout` (`app/handlers_auth.go:225`) | Behind `Auth`. Registered twice (`app/routes.go:30`, `:157`). Responds `303 → /signin`. |
| GET | `/api/auth-enabled` | `HandlerAuthEnabled` (`app/handlers_aux.go:36`) | Behind `Auth`, so with auth on it needs a valid token. Returns a JSON boolean; ignores DB errors (`:37`). |
| GET | `/api/settings/list` | `HandlerApiSettingsList` (`app/handlers_settings.go:11`) | Returns `auth_enabled`, `login`, `secret_key`. `hash` is blanked (`:18`). SETTINGS owns it. |
| PUT | `/api/settings/general` | `HandlerApiSettingsUpdate` (`app/handlers_settings.go:22`) | The only UI path that changes the auth fields. SETTINGS owns it. |
| * | every other `/api/*` | various | Guarded by `r.Use(app.Auth)` (`app/routes.go:27`). |
| * (`r.Handle`) | `/*` | `HandlerUI` (`app/handlers_aux.go:15`) | Registered at `app/routes.go:165` behind `middleware.Compress(5)`. **Not** guarded by `Auth`. Any path that does not contain `assets` or `favicon.ico`, including `/signin` and `/logout`, serves `index.html` (`app/handlers_aux.go:24-26`). |

### 4.3 Data Access

**`internal/models/auth.go`** (all methods on `DBModel`):

| Method | Purpose | Tables / storage |
|---|---|---|
| `GetSecretKey` (`:13-26`) | Secret key from the cache or `GetSettings` | `settings2` (JSON), `authCache["secretKey"]` |
| `IsAuthEnabled` (`:28-41`) | Auth flag from the cache or `GetSettings` | `settings2`, `authCache["isAuthEnabled"]` |
| `VerifyToken` (`:43-75`) | Cache hit, else `SELECT token FROM tokens WHERE username = ?` and compare each row | `tokens`, `authCache["token"]` |
| `Authenticate` (`:78-96`) | Compare the login, then the bcrypt hash; return `OwnerName` | `settings2` |
| `AddToken` (`:98-109`) | `INSERT INTO tokens (token, username, created_at)` | `tokens` |
| `DeleteToken` (`:111-122`) | `DELETE FROM tokens WHERE token = ?` (does not touch the cache) | `tokens` |
| `DisableAuthorization` (`:125-139`) | `AuthEnabled=false` via `UpdateSettings` | `settings2` |

**`internal/models/settings.go`** (owned by SETTINGS, used here): `GetSettings` (`:11-28`, `SELECT settings FROM settings2 WHERE id=0`); `UpdateSettings` (`:31-68`, password hashing + `authCache.Clear()`).

All queries use `ContextWithDefaultTimeout` (60s, `internal/models/helpers.go:14`, `:22-24`).

### 4.4 UI

| Item | Kind | Notes |
|---|---|---|
| `/signin` → `SignInPage` → `SignIn` | route outside `Root` (`app/ui/src/main.jsx:93`) | No toolbar or queries; raw `fetch`, not `handleFetch` (`SignIn.jsx:39`) |
| `/logout` → `LogoutPage` | route outside `Root` (`main.jsx:94`) | Raw `fetch` (`LogoutPage.jsx:12`), returns no JSX |
| `Root` route `loader: authLoader` | loader (`main.jsx:44`) | Returns `{token, username}` from `localStorage`. **Nothing reads it** (no `useLoaderData`/`useRouteLoaderData` in `app/ui/src`). |
| `['auth-enabled']` query | inline `useQuery` in `ToolbarActions` (`DashboardToolbar.jsx:64-71`) | `placeholderData: false`, stale/gc 24h; invalidated by `SaveSettingsButton.jsx:17` and by the global `invalidateQueries()` after a DB upload (`app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:30`). The server answers that refetch from the stale `authCache` (§11 #8). |
| `['settings']` query | `useSettings` (`app/ui/src/hooks/useSettings.jsx:81-89`) | Carries `auth_enabled`/`login`/`secret_key` into `AuthSettings` |
| `NavigationSetter` | `app/ui/src/App.jsx:22-26` | Registers React Router's `navigate` for `globalNavigate` |
| Token injection | `getAuthToken()` in every function of `app/ui/src/util/http/*.jsx` that calls `API_URL` (not in `fetchLatestRelease`, `app/ui/src/util/http/settings.jsx:88`, which calls api.github.com), plus `ImportProgressDialog.jsx:54-62` | There is no shared wrapper. Each call builds its own headers. |

No hook in `app/ui/src/hooks/` is dedicated to auth.

## 5. Data Model & Persistence

**Table `tokens`** (`internal/driver/db_structure.go:102-107`, created in `validateDB` list `internal/driver/driver.go:61`):

| Column | SQLite | MySQL | Notes |
|---|---|---|---|
| `id` (PK) | `INTEGER` | `INT UNSIGNED AUTO_INCREMENT` | `:102` |
| `username` | `TEXT` | `VARCHAR(36)` (`UUID` type, `:6`) | `NOT NULL`, indexed (`:104`). Stores the **login**. |
| `token` | `TEXT` | `VARCHAR(512)` (`BigText`, `:9`) | `NOT NULL` (`:105`) |
| `created_at` | `TEXT` | `VARCHAR(32)` (`DateTime`, `:7`) | `NOT NULL` (`:106`). Written as `2006-01-02 15:04:05` local time (`internal/models/auth.go:103`). Never read. |

**Settings blob** `settings2.settings` (id 0, `internal/driver/db_structure.go:77-80`). The auth fields are JSON keys, not columns (`internal/models/structs.go:229-233`):

| JSON key | Stored value |
|---|---|
| `auth_enabled` | bool |
| `login` | plain login string |
| `password` | Cleared to `""` when a non-blank password is hashed (`internal/models/settings.go:43-44`). A whitespace-only value trims to `""`, takes the keep-old-hash branch and is stored as sent (`internal/models/settings.go:45-52`, `:54-60`); `GET /api/settings/list` returns it, because only `hash` is blanked (`app/handlers_settings.go:18`). |
| `hash` | bcrypt hash. Blanked in the GET response (`app/handlers_settings.go:18`). |
| `secret_key` | base64 HMAC key, returned to the UI in plain text |

Adding an auth **setting** needs no DDL and no `schemaVersion` bump. Changing the `tokens` table does (see §12).

**Non-persistent state:**

| State | Where | Lifetime |
|---|---|---|
| `authCache` (`secretKey`, `isAuthEnabled`, `token`) | `internal/models/auth.go:11` | Process. Cleared only by `UpdateSettings` (`internal/models/settings.go:65`). |
| `loginAttempts` | `app/handlers_auth.go:29` | Process. Never pruned. |
| `localStorage.token` / `localStorage.username` | browser (`app/ui/src/util/auth.jsx`) | Until logout or overwrite |
| `['auth-enabled']` query cache | TanStack Query `queryClient` (`app/ui/src/util/http/http.jsx:4`) | 24h stale/gc, or until invalidated |

## 6. Data Flow

**Login**
```
SignIn.handleSubmit (app/ui/src/components/SignIn.jsx:26)
 → POST /api/login (app/routes.go:24, no Auth)
 → HandlerLogin (app/handlers_auth.go:164)
   → DBModel.Authenticate (internal/models/auth.go:78) → GetSettings → settings2
   → createToken (app/handlers_auth.go:31) → GetSecretKey (cache | settings2)
   → DBModel.AddToken (internal/models/auth.go:98) → INSERT tokens
 ← 200 {token, username}
 → setAuthData → localStorage (app/ui/src/util/auth.jsx:8) → navigate('/')
```

**Any protected call** (example: settings list)
```
useSettings (app/ui/src/hooks/useSettings.jsx:81) → fetchSettings (app/ui/src/util/http/settings.jsx:5)
 → handleFetch (app/ui/src/util/http/http.jsx:13) with Authorization: Bearer <localStorage.token>
 → Auth (app/handlers_auth.go:112): IsAuthEnabled → verifyToken → extractUsernameFromToken → DBModel.VerifyToken (cache | SELECT tokens)
 → HandlerApiSettingsList (app/handlers_settings.go:11)
 ← 200 JSON   |   ← 401 → handle401 → globalNavigate('/signin') (app/ui/src/util/http/http.jsx:6-11)
```

**Logout**
```
DashboardToolbar handleLogout (DashboardToolbar.jsx:73) → /logout route → LogoutPage (app/ui/src/pages/LogoutPage.jsx:6)
 → POST /api/logout → Auth → HandlerLogout (app/handlers_auth.go:225) → DBModel.DeleteToken → DELETE tokens
 (in parallel) removeAuthData → navigate('/signin')
```

**Enable/disable** — see §3.1 (UI → `PUT /api/settings/general` → `UpdateSettings` → `settings2` + `authCache.Clear()`) and §3.5 (CLI → `DisableAuthorization`).

## 7. Config & Constants

| Name | Value | Where | Kind |
|---|---|---|---|
| Auth on/off | `auth_enabled` in the settings blob, default `false` | `internal/models/structs.go:229`, `internal/driver/driver.go:143-153` | (configurable) Settings UI |
| `-disable-authentication` | bool, default `false` | `app/main.go:88` | (configurable) CLI |
| JWT algorithm | HS256 | `app/handlers_auth.go:32` | (hardcoded) |
| JWT lifetime | 24h (`time.Hour * 24`) | `app/handlers_auth.go:35` | (hardcoded) |
| Secret key | 32 random bytes → base64, generated in the browser | `AuthSettings.jsx:15-19` | (configurable) editable field |
| bcrypt cost | 12 | `internal/models/settings.go:38` | (hardcoded) |
| Lockout threshold | 5 failed attempts per IP | `app/handlers_auth.go:171` | (hardcoded) |
| Back-off | `previousFailures * 10` seconds (40s at the 5th failure, +10s per later failure) | `app/handlers_auth.go:194` | (hardcoded) |
| Bearer prefix length | `len("Bearer ")` = 7 | `app/handlers_auth.go:132` | (hardcoded) |
| DB query timeout | 60s | `internal/models/helpers.go:14` | (hardcoded) |
| `tokens.created_at` format | `2006-01-02 15:04:05` | `internal/models/auth.go:103` | (hardcoded) |
| CORS | origins `*`, headers incl. `Authorization`, credentials `true`, MaxAge 300 | `app/routes.go:16-22` | (hardcoded) |
| `TOKEN_KEY` / `USERNAME_KEY` | `'token'` / `'username'` | `app/ui/src/constants/constants.jsx:6-7` | (hardcoded) |
| `API_URL` | `/api`; `http://localhost:4000/api` in Vite dev mode | `app/ui/src/constants/constants.jsx:9-12` | (hardcoded) per build mode |
| `['auth-enabled']` staleTime / gcTime | 86400000 ms (24h) | `DashboardToolbar.jsx:68-69` | (hardcoded) |

## 8. Error Handling & Edge Cases

| Situation | Server response | UI behaviour | Evidence |
|---|---|---|---|
| No `Authorization` header (scripts only; the UI always sends one) | 401 **plain text** | `handleFetch` JSON parse fails, falls back to a generic message | `app/handlers_auth.go:129`, `app/ui/src/util/http/http.jsx:20-26` |
| No token in `localStorage` | Header is `Bearer null` → JWT parse error → 401 JSON | `handle401` → `/signin` | `app/ui/src/util/auth.jsx:13-16`, `app/handlers_auth.go:134-139` |
| Expired token | 401 JSON `"token has invalid claims: token is expired"`, raised by `jwt.Parse` (golang-jwt v5 validates `exp` by default, `go.mod:10`). The custom `"token has expired"` branch is never reached. | redirect to `/signin` | `app/handlers_auth.go:57-62`, `:71-72` |
| Token signed with another key | 401 JSON with the jwt signature error (`"token signature is invalid: ..."`) | redirect to `/signin` | `app/handlers_auth.go:57-62` |
| Token without an `exp` claim | 401 JSON `"exp claim is missing in token"` (v5 does not require `exp` by default, so only this custom check catches it) | redirect to `/signin` | `app/handlers_auth.go:74-76` |
| Token valid but not in `tokens` | 401 JSON `"no valid token found"` | redirect | `internal/models/auth.go:74` |
| DB error inside `VerifyToken` (query or scan) | 401 JSON `"invalid token"`, not 500 | redirect to `/signin`, so a DB outage logs the pilot out | `internal/models/auth.go:56-59`, `:64-66` |
| Header shorter than 7 bytes | Slice out of range → panic, recovered by `net/http`, connection dropped | fetch rejects | `app/handlers_auth.go:132` |
| Wrong login/password | 403 `"invalid credentials"`, counted as a failure | `SignIn` shows `message` | `internal/models/auth.go:84-90`, `SignIn.jsx:45-50` |
| Login when no hash was ever set | `bcrypt` returns a non-mismatch error, which is passed through as 403 and counted | message shown | `internal/models/auth.go:88-92` |
| Malformed login JSON | 500 via `handleError`, **not** counted | message shown | `app/handlers_auth.go:184-188` |
| Throttled IP | 403 `"Too many failed login attempts"` | message shown | `app/handlers_auth.go:171-176` |
| `createToken`/`AddToken` fails | Execution **continues** (missing `return`): status stays 500 (the later `WriteHeader(200)` is ignored as superfluous), body = error JSON + `LoginResponse` JSON. If `createToken` failed, `AddToken` still inserts a row with an empty token. | JSON parse error shown | `app/handlers_auth.go:206-213`, `:220-221`; `app/helpers.go:29-31` |
| `/api/logout` with auth disabled | No `token` in context → type-assertion panic, recovered by `net/http` | `LogoutPage` ignores it (the fetch promise rejects unhandled) | `app/handlers_auth.go:121`, `:227` |
| `IsAuthEnabled` DB error | 500 for every `/api/*` call | error notifications | `app/handlers_auth.go:115-119` |
| Auth enabled with empty login/password | No validation anywhere. Every login fails → the pilot is locked out until `-disable-authentication` (§11 #10; same issue: `ARCHITECTURE_SETTINGS.md` §11 #2). | — | `AuthSettings.jsx:11-21`, `app/handlers_settings.go:29-42` |

## 9. Integration Points

| System | What crosses the boundary |
|---|---|
| `ARCHITECTURE_APPLICATION.md` | Router layout: `/api/login` outside, everything else under `r.Use(app.Auth)` (`app/routes.go:24-27`). CORS `*` + `Authorization` header (`app/routes.go:16-22`). `-disable-authentication` in `main` (`app/main.go:154-161`). Response helpers `writeErrorResponse`/`handleError` (`app/helpers.go:37-63`). `HandlerUI` serves `/signin` and `/logout` as SPA routes (`app/handlers_aux.go:24-26`). DB upload swaps `app.db` without clearing `authCache` (`app/handlers_db.go:53-58`; §11 #8, same issue as `ARCHITECTURE_APPLICATION.md` §11 #2). |
| `ARCHITECTURE_SETTINGS.md` | Auth fields live in `Settings` (`internal/models/structs.go:229-233`). `UpdateSettings` hashes the password and is the **only** `authCache` invalidation (`internal/models/settings.go:35-65`). `AuthSettings.jsx` generates the secret. `SaveSettingsButton` invalidates `['auth-enabled']`. |
| `ARCHITECTURE_DATABASE.md` | `tokens` table DDL per engine (`internal/driver/db_structure.go:102-107`). `settings2` blob. Default settings row with auth off (`internal/driver/driver.go:143-153`). `schemaVersion` (`internal/driver/db_structure.go:4`). |
| `ARCHITECTURE_FRONTEND.md` | `handleFetch`/`handle401`/`queryClient` (`app/ui/src/util/http/http.jsx`). `globalNavigate` (`app/ui/src/util/navigation.js`). Router tree (`app/ui/src/main.jsx:35-97`). `API_URL` for dev mode against `:4000`. |
| `ARCHITECTURE_IMPORT.md` | `ImportProgressDialog` streams `POST /api/import/run` with raw `fetch` and its own Bearer header. It does not use `handle401` (`app/ui/src/components/Import/ImportProgressDialog.jsx:54-66`). |
| All other systems | Every endpoint in `ARCHITECTURE_LOGBOOK.md`, `ARCHITECTURE_STATS_AND_MAP.md`, `ARCHITECTURE_PERSONS.md`, `ARCHITECTURE_AIRCRAFT_AIRPORTS.md`, `ARCHITECTURE_CURRENCY_LICENSING.md`, `ARCHITECTURE_PDF_EXPORT.md` sits behind `Auth`. Their UI calls must send the Bearer header. |
| External scripts | `README.md:321-345` documents `POST /api/login` → `.token` → `Authorization: Bearer`. This is a public contract. |

## 10. Testing

| Area | Existing tests |
|---|---|
| Go auth (`app/handlers_auth.go`, `internal/models/auth.go`) | **None.** The only Go tests are `app/handlers_import_test.go` (pure `TestParseName`) and `internal/nighttime/nighttime_test.go`. |
| UI auth (`SignIn`, `LogoutPage`, `util/auth`, `handle401`) | **None.** The UI tests are `app/ui/src/hooks/useSettings.test.jsx`, `app/ui/src/hooks/useAppNotifications.test.jsx`, `app/ui/src/hooks/useCustomFields.test.jsx`, `app/ui/src/hooks/useLocalStorageState/useStorageState.test.tsx`, `app/ui/src/components/Currency/helpers.test.jsx`. |

How to run: `make test` (`go test -v ./... -coverpkg=./...`, `Makefile:32-33`; needs `make build_ui` first because of `//go:embed ui/dist/*`). UI: `cd app/ui && npm test` (vitest, `app/ui/package.json:11`). `npm run build` runs `vitest run` first (`app/ui/package.json:8`).

Gaps worth covering first: the `Auth` middleware matrix (§3.3), `HandlerLogin` throttling arithmetic, logout revocation (§11 #2), `UpdateSettings` keep-hash path. No DB test harness exists, so a test must open a temp SQLite file via `driver.OpenDB("sqlite", path)` (`internal/driver/driver.go:23`). Model tests that need a DB must live in the external test package `models_test`: `internal/driver` imports `internal/models` (`internal/driver/driver.go:14`), so a test in package `models` that imports `driver` is an import cycle.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | `loginAttempts` is a plain global map, read and written by concurrent HTTP goroutines with no mutex. Parallel login requests are a data race and can hit Go's fatal "concurrent map writes". | `app/handlers_auth.go:29`, `:166-203` | Confirmed — `net/http` serves each request on its own goroutine, and there is no lock or `sync.Map`. | MAJOR | 2026-10-14 |
| 2 | Logout does not revoke the token server-side while it is cached. The logout request itself passes `Auth`, which caches the token (`authCache["token"]`). `DeleteToken` removes only the DB row. Later requests hit the cache first and still succeed, until another token is verified, settings are saved, the process restarts, or the JWT expires (24h). | `internal/models/auth.go:45-50`, `:69`, `:111-122` | Confirmed — the cache check comes before the DB query, and nothing deletes the cache key. | MAJOR | 2026-10-14 |
| 3 | `HandlerLogin` misses `return` after `handleError` for `createToken` and `AddToken`. The response keeps status 500 (the later `WriteHeader(200)` is ignored as superfluous) but gets a second JSON body appended, so the client cannot parse it. If `createToken` fails, `AddToken` still runs with an empty token string and inserts an empty row. `HandlerLogout` has the same pattern before `http.Redirect`. | `app/handlers_auth.go:206-213`, `:220-221`, `:228-232`; `app/helpers.go:29-31` | Confirmed — no `return` statements; `writeJSON` has already called `WriteHeader(500)` | MINOR | 2026-10-14 |
| 4 | `Auth` slices `tokenString[len("Bearer "):]` without a length or prefix check. A header shorter than 7 bytes panics; a non-Bearer scheme is silently mangled. The router has no panic-recovery middleware: see `ARCHITECTURE_APPLICATION.md` §11 #19. | `app/handlers_auth.go:132` | Confirmed | MINOR | 2026-10-14 |
| 5 | `HandlerLogout` type-asserts `.(string)` on a context value that is absent when auth is disabled → panic (recovered by `net/http`). The router has no panic-recovery middleware: see `ARCHITECTURE_APPLICATION.md` §11 #19. | `app/handlers_auth.go:227` vs `:121` | Confirmed | MINOR | 2026-10-14 |
| 6 | IP key is `strings.Split(RemoteAddr, ":")[0]`. Every IPv6 client maps to `"["`. Behind a reverse proxy (the Ingress example in `docker/README.md:178-183`) all clients share the proxy IP, so one attacker can lock out the pilot. | `app/handlers_auth.go:166` | Confirmed (IPv6 split); proxy effect follows from no `X-Forwarded-For` handling | MINOR | 2026-10-14 |
| 7 | The `tokens` table is never pruned. Every login adds a row; only explicit logout deletes one. Expired tokens stay forever. | `internal/models/auth.go:98-122` | Confirmed — the only `DELETE FROM tokens` is in `DeleteToken` | MINOR | 2026-10-14 |
| 8 | DB upload replaces `app.db` but leaves `authCache` stale (old `isAuthEnabled`, `secretKey`, `token`) until restart or a settings save. Example: if the previous DB had auth off, an uploaded DB with auth enabled is served without authentication (cached `isAuthEnabled=false`); if the previous DB had auth on, its cached `secretKey` and `token` keep authenticating requests against the new DB. Same issue: `ARCHITECTURE_APPLICATION.md` §11 #2, `ARCHITECTURE_SETTINGS.md` §11 #5, `ARCHITECTURE_DATABASE.md` §11 #8. | `app/handlers_db.go:53-58`, `internal/models/auth.go:11`, `:28-41` | Confirmed — `authCache` is cleared only in `internal/models/settings.go:65`, and the upload handler only swaps `app.db` | MAJOR | 2026-10-14 |
| 9 | The password is trimmed before hashing but not at login, so entering a password exactly as configured with leading or trailing spaces fails. Only the trimmed form logs in. | `internal/models/settings.go:36-38` vs `internal/models/auth.go:88`; `app/ui/src/components/SignIn.jsx:36` sends the raw value | Confirmed | MINOR | 2026-10-14 |
| 10 | Auth can be enabled with an empty login or password (no UI or server validation). One save locks the pilot out of the UI, and recovery needs shell access to run the binary with `-disable-authentication`. Same issue: `ARCHITECTURE_SETTINGS.md` §11 #2. | `AuthSettings.jsx:11-21`, `app/handlers_settings.go:22-51`, `internal/models/auth.go:84-92` | Confirmed | MAJOR | 2026-10-14 |
| 11 | `-disable-authentication` logs "authentication has been disabled" and exits 0 even when `DisableAuthorization` failed. | `app/main.go:155-160` | Confirmed | MINOR | 2026-10-14 |
| 12 | `secret_key` (the HMAC signing key) is returned by `GET /api/settings/list` and shown in the UI. Only `hash` is stripped. Impact is limited because forged JWTs must also exist in `tokens`. | `app/handlers_settings.go:18`, `internal/models/structs.go:233` | Confirmed | MINOR | 2026-10-14 |
| 13 | `POST /logout` is registered twice in the same sub-router. It is harmless (same handler) but dead duplication. Same issue: `ARCHITECTURE_APPLICATION.md` §11 #8. | `app/routes.go:30`, `:157` | Confirmed | MINOR | 2026-10-14 |
| 14 | Dead code and values: context keys `user` and `auth` are set but never read; the `Root` route `authLoader` data is never consumed; the custom `"token has expired"` branch in `verifyToken` is unreachable, because `jwt.Parse` (golang-jwt v5) already rejects expired tokens. | `app/handlers_auth.go:121`, `:156`, `:71-72`; `app/ui/src/main.jsx:44` | Confirmed — `grep` finds no readers; the custom check fires only when `now > exp`, a subset of the library's `now >= exp` | MINOR | 2026-10-14 |
| 15 | MySQL `tokens.username` is `VARCHAR(36)` (`UUID` type) but stores the login. Strict mode: `AddToken` fails for a login longer than 36 chars, so login returns 500 (see #3). Non-strict mode: the login is stored truncated and `VerifyToken` (`WHERE username = ?` with the full login) never matches, so every request returns 401. Same issue: `ARCHITECTURE_DATABASE.md` §11 #17. | `internal/driver/db_structure.go:6`, `:104`; `internal/models/auth.go:55-56`, `:102-103`; `app/handlers_auth.go:206`, `:211` | Confirmed (column type) — sign-in breaks in both MySQL modes | MINOR | 2026-10-14 |
| 16 | With auth disabled (the default), CORS `AllowedOrigins: *` may let any website the pilot visits read `/api/*` from a reachable instance. It can also write: simple POSTs need no preflight (multipart `POST /api/db/upload-db`; `text/plain` bodies to JSON endpoints, which decode without checking `Content-Type`), and preflighted `PUT`/`DELETE` pass because CORS allows every origin and these methods. Same root cause: `ARCHITECTURE_APPLICATION.md` §11 #5. | `app/routes.go:16-22`; `app/handlers_db.go:16-28`; `app/handlers_auth.go:184`, `app/handlers_settings.go:30` | Suspected — confirm with `curl -i -H 'Origin: https://example.com' http://localhost:4000/api/settings/list` and inspect `Access-Control-Allow-Origin`, then a cross-origin write from a browser page. Browser local-network protections may mitigate. | MAJOR | 2026-10-14 |
| 17 | `Authenticate` compares the login before running bcrypt (cost 12), so a wrong login answers much faster than a wrong password. The response time reveals whether a login name is valid. | `internal/models/auth.go:84-88`, `internal/models/settings.go:38` | Confirmed — early `return` on login mismatch skips `bcrypt.CompareHashAndPassword` | MINOR | 2026-10-14 |

## 12. Rules for Future Development

### R1 — Add a protected API endpoint (the default)
0. Handler `HandlerApi<Entity><Action>` in `app/handlers_<domain>.go`. Follow every `app.handleError(w, err)` with `return` (`app/helpers.go:53-63` does not stop the handler). Answer mutations with `app.writeOkResponse` (`app/helpers.go:45-51`).
1. Register it **inside** `r.Route("/api", ...)` after `r.Use(app.Auth)` in `app/routes.go:26-163`. Never at the top level.
   - 1b. Wrap large GETs as `r.With(middleware.Compress(5)).Get(...)` (pattern: `app/routes.go:34-35`).
2. If the handler needs the caller, read `r.Context().Value(tokenContextKey)` / `userContextKey` with a comma-ok assertion: they are absent when auth is disabled (`app/handlers_auth.go:120-124`).
3. UI: add the function to `app/ui/src/util/http/<domain>.jsx` with `headers: { 'Authorization': \`Bearer ${getAuthToken()}\` }` and call `handleFetch`, so a 401 redirects to `/signin`. Do not use raw `fetch`.
4. Shared query in `app/ui/src/hooks/queries/use<Entity>Query.js`. After a mutation, invalidate every dependent query key.
5. `CHANGELOG.md` `[Unreleased]` bullet plus the identical copy in `README.md`; update the owning `ARCHITECTURE_<SYSTEM>.md`.

### R2 — Add a public (unauthenticated) endpoint
0. Default answer: don't. `CLAUDE.md` allows only `POST /api/login` as public, so a new public route needs explicit owner approval recorded in the task file. If approved:
1. Register it at the top level next to `r.Post("/api/login", ...)` (`app/routes.go:24`), outside the `r.Route("/api", ...)` block. `/api/login` working without a token (`README.md:321-331`) shows this pattern bypasses `Auth`.
2. Write down in the PR why it must be public. With CORS `*` (`app/routes.go:16-22`) the endpoint can be called from any website (see §11 #16).

### R3 — Change the JWT (lifetime, claims, algorithm)
- Touch `createToken`, `verifyToken`, `extractUsernameFromToken` together (`app/handlers_auth.go:31-110`). Keep the `username` claim equal to the value stored in `tokens.username` (`app/handlers_auth.go:206`, `:211`), or `VerifyToken` fails.
- If the lifetime becomes configurable, follow R4.

### R4 — Add an auth-related setting
1. Add the field to `Settings` (`internal/models/structs.go:229-233`). It lives in the JSON blob, so **no DDL and no `schemaVersion` bump**. If the zero value is unsafe for existing installs, set a default in `CheckDefaultValues` (`internal/models/models_defaults.go:151`).
2. If the backend reads it on the hot path, add a cached getter in `internal/models/auth.go` following `IsAuthEnabled` (`:28-41`). `UpdateSettings` already clears the whole cache (`internal/models/settings.go:65`).
3. If it is secret, blank it in `HandlerApiSettingsList` (`app/handlers_settings.go:18`), and keep its old value in `UpdateSettings` the way the hash is kept (`internal/models/settings.go:45-52`). Otherwise the next full-object PUT wipes it.
4. UI: field in `AuthSettings.jsx`. Saving already invalidates `['settings']` and `['auth-enabled']` (`SaveSettingsButton.jsx:16-17`). Add a key there if a new query depends on it.
5. Update `ARCHITECTURE_SETTINGS.md` (it owns the `Settings` blob) and this doc.

### R5 — Change the `tokens` table
1. Edit `tokensTable` with **both** `ColumnType` variants (`internal/driver/db_structure.go:102-107`). Bump `schemaVersion` (`:4`) so `validateDB` runs.
2. `validateDB` only adds tables, columns and indexes (`internal/driver/driver.go:56-70`); bumping `schemaVersion` alone does not alter existing columns. A type or length change (e.g. widening MySQL `username`) needs a migration function in `internal/driver/` (pattern: `internal/driver/data_overhaul.go`) called from `validateDB` behind its own stored-version check (the existing overhaul runs only for stored versions < 100, `internal/driver/driver.go:47-54`), for both engines: MySQL `ALTER TABLE tokens MODIFY username VARCHAR(255) NOT NULL`; SQLite `TEXT` needs no change. Update `ARCHITECTURE_DATABASE.md`.
3. Update the SQL in `internal/models/auth.go:55`, `:102`, `:115`. Use `?` placeholders; both drivers accept them.

### R6 — Touch the auth cache or token lifecycle
- Any code that changes auth settings, swaps the DB, or revokes a token must also invalidate `authCache` (today only `UpdateSettings` does). `authCache` is unexported in `internal/models`, so add a model method (for example, clear the `token` key in `DeleteToken`). Do not reach into the cache from `app/`.
- Guard `loginAttempts` with a mutex (or `sync.Map`) whenever you touch `HandlerLogin`.

### R7 — Change the login request or response shape
- `README.md:321-345` publishes `POST /api/login {login,password}` → `.token` for scripts. Keep it backward compatible, or call out the break in the changelog.
- Update `SignIn.jsx:36-54` and `setAuthData` (`app/ui/src/util/auth.jsx:8-11`) together.

### Cross-check list (every auth change)
- [ ] Route is in the correct router block (`app/routes.go:24` public vs `:26-27` guarded)
- [ ] Both DB engines covered for any `tokens` DDL; `schemaVersion` bumped; migration added if a type changes
- [ ] `authCache` invalidated wherever auth state changes (settings, DB upload, logout)
- [ ] Error paths `return` after `handleError` / `writeErrorResponse`
- [ ] Auth-disabled path still works (no context values, no `tokens` access)
- [ ] UI request goes through `handleFetch` with the Bearer header; every dependent query key invalidated (for auth settings: `['settings']`, `['auth-enabled']`)
- [ ] Recovery still works: `-disable-authentication` (`app/main.go:88`, `:154-161`) and `README.md:137-138`
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:` / `- Update:` / `- Fix:`) **and** the same bullet in the changelog copy in `README.md`
- [ ] Tests added under `app/` or `internal/models/` (none exist today; DB-backed model tests go in package `models_test`, §10)
- [ ] `ARCHITECTURE_AUTH.md` (and `SUMMARIES.md` if the summary changes) updated

## 13. AI Notes

### Mental Model
One login and one password hash live in the settings JSON. Login hands out a 24h HS256 JWT and records it in `tokens`. Every `/api/*` request passes through `Auth`, which checks the flag (cached), then the signature and expiry, then that the token is in `tokens` (or is the one cached token). The UI keeps the JWT in `localStorage`, adds it by hand to every request, and treats any 401 as "go to `/signin`". The secret key is made in the browser, and the CLI flag is the only recovery path for forgotten credentials.

### Gotchas
- `authCache` is a process-wide `sync.Map` that only `UpdateSettings` clears (`internal/models/settings.go:65`). Any other write path to auth state (DB upload, direct SQL, a second process running `-disable-authentication` while the server runs) leaves the running server with stale values until restart.
- `PUT /api/settings/general` **replaces** the whole `Settings` struct (`app/handlers_settings.go:29-42`). A client that omits `secret_key`, `login` or `auth_enabled` resets them. Only `hash` survives an empty password (`internal/models/settings.go:45-52`).
- Turning the switch on always generates a **new** secret (`AuthSettings.jsx:14-20`). Saving it invalidates every existing JWT, including the current session.
- The JWT `username` claim and `tokens.username` hold the **login**. The login response's `username` holds `OwnerName` (`internal/models/auth.go:95`).
- `/api/auth-enabled` is behind `Auth` (`app/routes.go:161`), so the UI cannot learn "auth is on" before it has a token. Only the 401 redirect reveals it.
- Logout does not clear the TanStack Query cache (`app/ui/src/pages/LogoutPage.jsx:10-24`). Data from the previous session stays in memory in that tab.
- `-disable-authentication` never starts the server: it exits after flipping the flag (`app/main.go:160`).
- Error bodies are mixed: plain text for a missing header (`app/handlers_auth.go:129`), JSON `{ok,message}` everywhere else (`app/helpers.go:37-43`).

### File Quick Reference

| Need to… | Open |
|---|---|
| Change token validation or the middleware | `app/handlers_auth.go:51-161` |
| Change login/throttling | `app/handlers_auth.go:164-222` |
| Change the credential check or token SQL | `internal/models/auth.go` |
| Change password hashing or cache invalidation | `internal/models/settings.go:31-68` |
| Move an endpoint in or out of auth | `app/routes.go:24-27` |
| Change the recovery flag | `app/main.go:88`, `:154-161` |
| Change the sign-in UI | `app/ui/src/components/SignIn.jsx` |
| Change logout | `app/ui/src/pages/LogoutPage.jsx`, `DashboardToolbar.jsx:61-87` |
| Change token storage | `app/ui/src/util/auth.jsx`, `app/ui/src/constants/constants.jsx:6-7` |
| Change 401 handling | `app/ui/src/util/http/http.jsx:6-31` |
| Change the auth settings form | `app/ui/src/components/Settings/GeneralSettings/AuthSettings.jsx` |
| Change the `tokens` DDL | `internal/driver/db_structure.go:102-107` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
