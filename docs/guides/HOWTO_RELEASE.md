# HOWTO: Release and Dependency Updates

> How a web-logbook version is cut, built and published, and how dependency updates are done — as practiced in git history.
> Development workflow and the CI parity sequence: `docs/guides/HOWTO_DEVELOPMENT.md`. Git conventions: `docs/rules/RULE_GIT.md`.

> **Agents never tag, push or publish — the owner does.** Agents may prepare the edits described here in the working tree
> (changelog bullets, and the version-bump edits when explicitly asked); the main session stages them (subagents never
> run `git add`, `docs/rules/RULE_GIT.md`). Committing, pushing, creating
> branches, tags and GitHub releases, and pushing Docker images are the owner's steps. The `deny` list in
> `.claude/settings.json` blocks `git commit`, `git push`, `git checkout`, `git switch`, `git tag` and `gh release`.

---

## Table of Contents

1. [Versions](#1-versions)
2. [Changelog Rules](#2-changelog-rules)
3. [Version Bump](#3-version-bump)
4. [Tag and GitHub Release](#4-tag-and-github-release)
5. [Docker Images](#5-docker-images)
6. [Dependency Updates](#6-dependency-updates)
7. [Pre-release Checklist](#7-pre-release-checklist)

---

## 1. Versions

There are two independent version numbers:

| Version | Where | When it changes |
|---|---|---|
| App version | `version` const in `app/main.go:18` (now `5.0.0-alpha1`) | Every release. Served by `GET /api/version` (`HandlerVersion`, `app/handlers_aux.go:32-34`; route `app/routes.go:160`) and printed by `-version` (`app/main.go:124-127`). |
| Schema version | `schemaVersion` in `internal/driver/db_structure.go:4` (now `"101"`) | Only when the DB structure changes; `validateDB` applies schema changes only when it differs from the stored one (`internal/driver/driver.go:56`). Not tied to the app version. |

Format: `MAJOR.MINOR.PATCH`, with an optional pre-release suffix (`5.0.0-alpha1`). Observed in history: patch releases carry fixes (`4.8.1`, `4.6.1`), sometimes with a dependency/library update (`4.9.1`, `4.5.1`), minor releases add features (`- New:` bullets), and the major bump to 5 came with the data type overhaul that rewrites existing data (`CHANGELOG.md:7-17`).

The UI shows a "New" badge when the latest GitHub release tag is newer than the running version: `fetchLatestRelease` reads `https://api.github.com/repos/vsimakhin/web-logbook/releases/latest` (`app/ui/src/util/http/settings.jsx:88-95`) and `compareVersions(latestRelease.tag_name, version)` decides (`app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:42-45`). The release tag and the `version` const must therefore name the same version (`v4.10.0` ↔ `4.10.0`).

---

## 2. Changelog Rules

- `CHANGELOG.md` holds the full history. `README.md` holds a **copy** of the top of it under `# Changelog` (`README.md:64-101`), ending with the link to the full file (`README.md:101`).
- Every change goes under `## [Unreleased]` at the top (`CHANGELOG.md:3`), and the **identical** bullet goes under `## [Unreleased]` in `README.md` (`README.md:66`).
- One bullet per change, prefixed `- New:`, `- Update:` or `- Fix:` (`CHANGELOG.md:11-17`). Link a GitHub issue when there is one (`CHANGELOG.md:58`).
- A release that can damage data on upgrade gets a warning line under the heading, as `5.0.0-alpha1` did: `:warning: As this is an alpha (non-production) release, back up your database before upgrading` (`CHANGELOG.md:9`).
- Release headings: `## [X.Y.Z] - DD.MM.YYYY` (`CHANGELOG.md:7`, `CHANGELOG.md:19`).

---

## 3. Version Bump

Practiced as a direct commit on `main` with the message `version ++` after the release's PRs are merged (`d3fcc75` for 4.10.0, `1f675ca` for 4.9.1, `e0be1a1` for 4.9.0; `git log --oneline --grep='version'`). It touches exactly three files (`git show --stat d3fcc75`):

| File | Edit |
|---|---|
| `app/main.go` | `version = "X.Y.Z"` (`app/main.go:18`) |
| `CHANGELOG.md` | `## [Unreleased]` → `## [X.Y.Z] - DD.MM.YYYY` (release date). Bullets unchanged. |
| `README.md` | The same heading change in the changelog copy, bullets identical to `CHANGELOG.md`. The owner also trims the oldest release sections from the README copy at this point (`e0be1a1` dropped 4.8.1 and 4.8.0, `a2ebc82` dropped 4.7.0); `CHANGELOG.md` is never trimmed. |

No new empty `[Unreleased]` heading is added by the bump; the next change re-creates it (`948ac96` added `## [Unreleased]` back to both files).

Variant: for `5.0.0-alpha1` the version const and the dated changelog section were changed inside the feature PR itself (`git show 8b2fa8d -- app/main.go CHANGELOG.md`), with no separate `version ++` commit.

If the schema changed since the last release, `schemaVersion` must already have been bumped by the feature that changed it (`internal/driver/db_structure.go:4`) — the version bump does not touch it.

---

## 4. Tag and GitHub Release

Owner only.

1. Create a GitHub release with tag `vX.Y.Z` on the version-bump commit. Existing tags point at those commits: `v4.10.0` → `d3fcc75`, `v4.9.1` → `1f675ca`, `v4.9.0` → `e0be1a1` (`git rev-list -n1 <tag>`). `v5.0.0-alpha1` points at `752dd86`, a commit of the PR branch that is not an ancestor of `main` (the PR was squash-merged as `8b2fa8d`).
2. Creating the release triggers `.github/workflows/release.yml` (`on: release: types: [created]`, `.github/workflows/release.yml:3-6`). Pushing a tag alone does not.
3. The workflow:
   - sets up Go `1.26.9` (`.github/workflows/release.yml:14-17`);
   - runs `make build_all` (`.github/workflows/release.yml:19-20`) = `clean build_ui test` + seven cross-builds (`Makefile:99`) — so the UI tests, `go fmt` and the Go tests run again;
   - uploads seven archives to the release (`.github/workflows/release.yml:22-62`);
   - builds and pushes the Docker image (§5).

| Make target | Platform | Archive uploaded |
|---|---|---|
| `build_darwin_amd64` (`Makefile:78-83`) | darwin/amd64 | `dist/web-logbook-darwin-amd64.tar.gz` (`.github/workflows/release.yml:26`) |
| `build_darwin_arm64` (`Makefile:85-90`) | darwin/arm64 | `dist/web-logbook-darwin-arm64.tar.gz` (`.github/workflows/release.yml:32`) |
| `build_linux_amd64` (`Makefile:50-55`) | linux/amd64 | `dist/web-logbook-linux-amd64.tar.gz` (`.github/workflows/release.yml:38`) |
| `build_linux_arm64` (`Makefile:57-62`) | linux/arm64 | `dist/web-logbook-linux-arm64.tar.gz` (`.github/workflows/release.yml:44`) |
| `build_linux_arm_6` (`Makefile:64-69`) | linux/arm, GOARM=6 | `dist/web-logbook-linux-arm-6.tar.gz` (`.github/workflows/release.yml:50`) |
| `build_linux_arm_7` (`Makefile:71-76`) | linux/arm, GOARM=7 | `dist/web-logbook-linux-arm-7.tar.gz` (`.github/workflows/release.yml:56`) |
| `build_windows_amd64` (`Makefile:92-97`) | windows/amd64 | `dist/web-logbook-windows-amd64.zip` with `web-logbook.exe` (`.github/workflows/release.yml:62`) |

All cross-builds use `CGO_ENABLED=0` and `-ldflags="-s -w" -trimpath` (`Makefile:8`, `Makefile:53-54`).

---

## 5. Docker Images

**Published by CI** (`.github/workflows/release.yml:64-84`): QEMU + Buildx, Docker Hub login with the `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` secrets, then `docker/build.Dockerfile` built for `linux/amd64,linux/arm64` and pushed as `vsimakhin/web-logbook:<release tag name>` (for example `vsimakhin/web-logbook:v4.10.0`).

- The `:4` and `:latest` tag lines are commented out (`.github/workflows/release.yml:85-86`), so CI pushes **only** the version tag. `docker/README.md:24-27` tells users to pull `latest`; how `latest` is updated is not found in the repository.
- `docker/build.Dockerfile` does not compile anything: it copies `./dist/web-logbook-linux-${TARGETARCH}/web-logbook` (`docker/build.Dockerfile:15-17`), so the matching `make build_linux_amd64` / `build_linux_arm64` output (or `make build_all`) must exist first. Platforms are fixed to `linux/amd64,linux/arm64` (`.github/workflows/release.yml:81`); adding `linux/arm` would need a `dist/web-logbook-linux-arm/` directory, which the Makefile does not produce (it builds `linux-arm-6` / `linux-arm-7`).
- Image runtime: Alpine, non-root user `weblogbook`, volumes `/data` and `/certs`, port 4000, `ENTRYPOINT ["./web-logbook"]`, `CMD ["-dsn", "/data/web-logbook.sql"]` (`docker/build.Dockerfile:10-25`).
- `docker/release.Dockerfile` downloads the latest **published** GitHub release archive for the target architecture (`docker/release.Dockerfile:11-16`); it only reflects a version after its release exists.

Local image from source (from `docker/README.md:44-49`):

```sh
make build_all
docker build -t vsimakhin/web-logbook:latest -f $PWD/docker/build.Dockerfile .
```

---

## 6. Dependency Updates

Despite the name, there is no `.github/dependabot.yml`; dependency updates are done by hand on a branch named `dependabot-YYYYMMDD` (merge commits `b937e84` "Merge pull request #525 from vsimakhin/dependabot-20260722", `33fff31` from `dependabot-20260522`) and squash-merged as `Dependabot YYYYMMDD (#NNN)` (`948ac96`, `2b1f410`, `495d8e4`). The PR usually has three commits: "update npm libs", "update golang libs", "update readme/changelog" (`git show 948ac96`); older PRs say "modules" instead of "libs" (`2b1f410`, `495d8e4`). The owner creates the branch; agents cannot (`git checkout` / `git switch` are denied).

| Step | Files | Seen in |
|---|---|---|
| npm packages in `app/ui` | `app/ui/package-lock.json`; `app/ui/package.json` only when a version range is raised or a major upgrade is taken (a major ESLint upgrade also changed `app/ui/eslint.config.js`) | lock only: `948ac96`, `2b1f410`; with `app/ui/package.json`: `495d8e4`, `3f7fc73`; with ESLint config: `b937e84` |
| Go modules | `go.mod`, `go.sum` | every dependency PR |
| Go toolchain (when it changes) | the `go` directive (`go.mod:3`) **and** `go-version` in both workflows (`.github/workflows/go.yml:19`, `.github/workflows/release.yml:17`) — all three must match | `948ac96` (1.26.7 → 1.26.9 in all three), `7e42ba9`, `33fff31` |
| Changelog | `- Update: Golang and npm packages/security patches.` under `## [Unreleased]` in `CHANGELOG.md` and the README copy (`CHANGELOG.md:5`, `README.md:68`); a Go-only update was worded `- Update: Golang (1.25.10) modules/security patches.` (`CHANGELOG.md:68`). Skip the bullet if `[Unreleased]` already has it. | `948ac96` |

The exact update commands are not recorded in git. Typical commands that produce these diffs:

```sh
cd app/ui && npm outdated && npm update     # in-range updates -> package-lock.json
go get -u ./... && go mod tidy              # from the repo root -> go.mod, go.sum
go mod edit -go=X.Y.Z                       # toolchain bump only: sets the go directive (go.mod:3)
```

`go get -u` raises the `go` directive only when an updated dependency requires a newer Go; it does not move to a chosen toolchain version. For a toolchain bump, set the `go` directive with `go mod edit -go=X.Y.Z` and then edit `go-version` in `.github/workflows/go.yml:19` and `.github/workflows/release.yml:17` to the same value by hand (`948ac96` changed all three from 1.26.7 to 1.26.9).

Verify with the full CI parity sequence plus `npm run lint` (`docs/guides/HOWTO_DEVELOPMENT.md` §6), then a manual run of the dev loop: sign in, open the logbook, open and save a flight record, open the map, run a PDF export. Major upgrades of UI libraries (MUI, React Router, Vite, ESLint) deserve their own PR and changelog line (`c3d59dd` "Upgrade MUI modules to the latest v9 (#551)", `CHANGELOG.md:29`).

---

## 7. Pre-release Checklist

Preparation (agents can help, staged only):

- [ ] Every change since the last release has its bullet under `## [Unreleased]` in `CHANGELOG.md`, prefixed `- New:` / `- Update:` / `- Fix:`.
- [ ] The README changelog copy has the identical `[Unreleased]` bullets (`README.md:64-101`).
- [ ] Version chosen (`MAJOR.MINOR.PATCH`, §1); a backup warning line added if the release rewrites existing data (`CHANGELOG.md:9`).
- [ ] If the DB structure changed since the last release: `schemaVersion` was bumped (`internal/driver/db_structure.go:4`), the upgrade was tested on a **copy** of an existing database, on SQLite and — if the change touches engine-specific SQL — on MySQL.
- [ ] Go versions agree: `go.mod:3`, `.github/workflows/go.yml:19`, `.github/workflows/release.yml:17`.
- [ ] CI parity sequence and `npm run lint` pass locally (`docs/guides/HOWTO_DEVELOPMENT.md` §6).
- [ ] Optional: `make build_all` locally (needs `tar` and `zip`, `Makefile:97`) to catch cross-compile problems before CI does.
- [ ] Smoke run on a copy of a real DB: the version chip shows the new version (`app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:51-55`), logbook, flight record, map, stats, PDF A4/A5 export work.
- [ ] Architecture docs in `docs/architecture/` describe the released behaviour.

Owner:

- [ ] `version ++` commit on `main`: `app/main.go:18`, `CHANGELOG.md`, `README.md` (§3).
- [ ] `Go` workflow green on that commit.
- [ ] GitHub release with tag `vX.Y.Z` on that commit (§4).
- [ ] `Build release` workflow green: seven archives attached, `vsimakhin/web-logbook:vX.Y.Z` on Docker Hub.
- [ ] Docker `latest` updated if wanted (not done by `.github/workflows/release.yml`, §5).
