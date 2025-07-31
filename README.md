![GitHub Release](https://img.shields.io/github/v/release/vsimakhin/web-logbook) ![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/vsimakhin/web-logbook/latest/total?color=green)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/vsimakhin/web-logbook/total?label=all%20downloads) ![GitHub License](https://img.shields.io/github/license/vsimakhin/web-logbook)


# Web-logbook

This is a simple, free and opensource EASA-style logbook application written in golang and react.

You can clone the repo and compile the binaries yourself, or just download the latest ones for your operating system from the [releases](https://github.com/vsimakhin/web-logbook/releases).

Once you start the app it automatically creates an SQLite local DB and starts listening on port 4000 by default. So you can open it in your standard web browser at http://localhost:4000

You also can easily export all flight records into EASA style pdf format, print it, sign and use it as a usual paper logbook.

# Changelog

## [3.5.0] - 31.07.2025

- Fix: Tooltip/description overlap for the input fields
- Fix: Night time calculation error when copying flight records

## [3.4.0] - 16.07.2025

- Fix: Instructor time wasn't imported
- Update: Golang and npm packages/security patches
- New: Support for GPX track files

## [3.3.0] - 06.07.2025

- Fix: Critical bug with excessive escaping for custom fields
- New: Custom logbook table pagination. You can set your custom rows numbers instead of standard `5, 10, 15, 20, 25, 30, 50, 100` for the logbook table
- Update: Updated material-react-table npm package and fixed the issue with filters for the text columns.
- Update: Update golang and npm packages

## [3.2.0] - 10.06.2025

- New: Added custom fields functionality. Create custom fields (text, number, time, duration) on the Settings page that appear on Flight records. Includes configurable statistics functions with Dashboard integration for data visualization. Note: Import data for custom fields is not yet supported.
- Doc: Update Readme with some API examples
- Fix: Quick CSV export for logbook table didn't include CoPilot time

The full changelog is [here](https://github.com/vsimakhin/web-logbook/blob/main/CHANGELOG.md)

## Old v2.x version
If you still would like to use v2.x version:
* Latest v2 release https://github.com/vsimakhin/web-logbook/releases/tag/v2.45.0
* Docker `docker pull vsimakhin/web-logbook:v2.45.0`
* Github branch https://github.com/vsimakhin/web-logbook/tree/v2-security-patches


# Usage

1. Download the latest release from https://github.com/vsimakhin/web-logbook/releases
2. Extract the archive to some folder/directory
3. Run:
  * Windows:
    * Double-click on the `web-logbook.exe` file. It will show you some warning about how unsafe it can be (need to solve it later), but just run it.
  * Linux/MacOS:
    * Open a terminal and navigate to the directory
    * Run `./web-logbook`
4. Open your browser, type http://localhost:4000 and the application is ready to use
5. To close the application, use `Ctrl+C` in the terminal window or just close it

## CLI options
```sh
$ ./web-logbook -h
  -cert string
      certificate path (default "certs/localhost.pem")
  -disable-authentication
      Disable authentication (in case you forgot login credentials)
  -dsn string
      Data source name {sqlite: file path|mysql: user:password@protocol(address)/dbname?param=value} (default "web-logbook.sql")
  -enable-https
      Enable TLS/HTTPS
  -engine string
      Database engine {sqlite|mysql} (default "sqlite")
  -env string
      Environment {dev|prod} (default "prod")
  -key string
      private key path (default "certs/localhost-key.pem")
  -port int
      Server port (default 4000)
  -url string
      Server URL (default empty - the app will listen on all network interfaces)
  -version
      Prints current version
```

# Supported operating systems

Since it's written in Golang, it can run on any system after compiling the sources. Currently, on the [Release](https://github.com/vsimakhin/web-logbook/releases/latest) page, there are binaries available for Linux, MacOS, and Windows.


# Interface

## Logbook
* Flight records table with filter for all fields and global search through all data
* Quick export to CSV for all and filtered data
* Export to PDF (A4, A5) formats

![EASA Logbook](./readme-assets/logbook.png)

* Dark mode and mobile friendly

![EASA Logbook dark mode](./readme-assets/dark-mode.png)
![EASA Logbook mobile](./readme-assets/mobile-friendly.png)


## Flight records
* Flight data
* Attachments for the flight records
* Automatic night-time calculation
* Custom/user defined fields support
* Flight map
  * KML track support (check this tool [fr24-kml-splitter](https://github.com/morremeyer/fr24-kml-splitter) for flightradar24 tracks)

![Flight record](./readme-assets/flight-record.png)

## Licensing & Certification
* List of licenses, certificates and endorsements
* Document attachments and preview

![Licensing & Certification](./readme-assets/licensing-record.png)

## Map
* Map of the flights
* Date filters
* Routes and airports filters
* Aircraft filters

![Map of the flights](./readme-assets/map-example.png)

## Aircrafts
* List of the aircrafts in the logbook
* Types & categories

![Aircrafts](./readme-assets/aircrafts.png)

## Airports
* Database of the standard airports
* Custom user defined airports and airfields

![Airports](./readme-assets/airports.png)

## Stats
* Dashboard with custom filters
* By Year
* By Type
* By Category

![Dashboard](./readme-assets/dashboard.png)
![Stats](./readme-assets/stats-by-category.png)

## Currency
* Tracking currency and flight exprerience

![Currency](./readme-assets/currency.png)

## Export
* Export to EASA PDF format (A4 and A5)
* PDF export formats with custom title pages (for example, include your CV automatically)
* Adjustable settings for each export format

![Export](./readme-assets/export.png)

### A4
![Export to PDF](./readme-assets/export-a4.png)

### A5
![Export to PDF](./readme-assets/export-a5-a.png)
![Export to PDF](./readme-assets/export-a5-b.png)

So in real life the logbook could look like
![Pilot logbook](./readme-assets/logbook_irl.jpg)

## Import
* CSV support
* Automatic WebLogbook profile load

## Settings
  * Owner name, license and address, signature for the PDF exports
  * Signature pad to automatically include signatures to the PDF exports
  * Enable/Disable authentication (in case you need to expose the app to the public internet)
  * Some interface settings
  * Custom fields for the Flight record

![Settings](./readme-assets/settings.png)


# Airports Databases

The app supports 3 sources:
* https://github.com/mwgg/Airports/raw/master/airports.json - main JSON database of 28k+ airports.
* (default) https://github.com/vsimakhin/Airports/raw/master/airports.json - my local fork of the main JSON database,  to ensure that the app remains functional even if there are any breaking changes in the upstream.
* https://davidmegginson.github.io/ourairports-data/airports.csv - an alternate set of airports from https://ourairports.com/, which contains over 78k records, including small airfields and heliports. 

If you enable the `No ICAO codes filter` option, the app will ignore ICAO airport codes that contain numbers and dashes, which are not commonly used ICAO codes. By default, this option is unchecked, which makes the database slightly smaller and cleaner.

# Advanced configuration

## Docker

Check [readme](./docker/README.md) for dockerized app for more details.

## HTTPS enable

You can generate your own certificate and key and store it in the different directories in your operating system. For that use `--key` and `--cert` parameters to specify the exact location and wun app with `--enable-https` flag.

## MySQL database

To store all data, you can use MySQL database. To get started, create a database and a user with access to it. On the first run, the application will create all necessary tables and views. If you want to migrate your data from SQLite to MySQL, you can use the export to CSV function first and then import from CSV.

The DSN format for MySQL connections 
```
user:password@protocol(address)/dbname?param=value
```

For example, 
```
./web-logbook -engine mysql -dsn "web-logbook-user:pwd@tcp(192.168.0.222)/web-logbook"
```

## API

The backend exposes a REST (sort of) API for access to all logbook functionality. You can find the full list of the endpoints here https://github.com/vsimakhin/web-logbook/blob/main/app/routes.go#L26

### Authentication

If authentication is enabled you need to use Bearer token

```bash
# get token
TOKEN=$(curl -s -X POST http://127.0.0.1:4000/api/login -H "Content-Type: application/json" -d '{"login": "login", "password": "password"}' | jq -r '.token')

# run request
curl http://127.0.0.1:4000/api/export/A4 -H "Authorization: Bearer $TOKEN" --output logbook.pdf
```

Powershel for Windows (generated by ChatGPT)
```powershell
$response = Invoke-RestMethod -Uri "http://127.0.0.1:4000/api/login" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"login": "login", "password": "password"}'

$token = $response.token

Invoke-WebRequest -Uri "http://127.0.0.1:4000/api/export/A4" `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -OutFile "logbook.pdf"
```

### API examples

Download PDF A4 logbook
```bash
curl http://127.0.0.1:4000/api/export/A4 --output logbook.pdf
```

Get distance between LKPR and EDDM airports in nautical miles
```bash
curl http://127.0.0.1:4000/api/distance/LKPR/EDDM
```

# New features/Issues

In case you'd like to add some other features to the logbook or you found a bug, please open an "issue" here https://github.com/vsimakhin/web-logbook/issues with a description. I cannot promise I'll implement it or fix it at a reasonable time but at least I can take a look.

# Contributors

Thanks for bug reports, testing, improvements, and feature suggestions:

<p align="left">
  <a href="https://github.com/Jacopx" title="Jacopx">
    <img src="https://github.com/Jacopx.png?size=40" width="40" height="40"  alt="Jacopx" />
  </a>
  <a href="https://github.com/dimoniet" title="dimoniet">
    <img src="https://github.com/dimoniet.png?size=40" width="40" height="40"  alt="dimoniet" />
  </a>
  <a href="https://github.com/ghost" title="maesteve">
    <img src="https://github.com/ghost.png?size=40" width="40" height="40"  alt="maesteve" />
  </a>
  <a href="https://github.com/ken340" title="ken340">
    <img src="https://github.com/ken340.png?size=40" width="40" height="40"  alt="ken340" />
  </a>
  <a href="https://github.com/morremeyer" title="morremeyer">
    <img src="https://github.com/morremeyer.png?size=40" width="40" height="40" alt="morremeyer" />
  </a>
  <a href="https://github.com/bbqman7089" title="bbqman7089">
    <img src="https://github.com/bbqman7089.png?size=40" width="40" height="40" alt="bbqman7089" />
  </a>
  <a href="https://github.com/danielkappelle" title="danielkappelle">
    <img src="https://github.com/danielkappelle.png?size=40" width="40" height="40" alt="danielkappelle" />
  </a>
  <a href="https://github.com/jvandergeer" title="jvandergeer">
    <img src="https://github.com/jvandergeer.png?size=40" width="40" height="40" alt="jvandergeer" />
  </a>
  <a href="https://github.com/eagleone84" title="eagleone84">
    <img src="https://github.com/eagleone84.png?size=40" width="40" height="40" alt="eagleone84" />
  </a>
  <a href="https://github.com/daman2k" title="daman2k">
    <img src="https://github.com/daman2k.png?size=40" width="40" height="40" alt="daman2k" />
  </a>
  <a href="https://github.com/fldroiddev" title="fldroiddev">
    <img src="https://github.com/fldroiddev.png?size=40" width="40" height="40" alt="daman2k" />
  </a>
</p>

# Used libraries

Backend:
* Golang go-pdf https://github.com/go-pdf/fpdf
* Golang chi web-server https://github.com/go-chi/chi
* go-sunrise github.com/nathan-osman/go-sunrise
* sqlite https://gitlab.com/cznic/sqlite

Frontend:
* React https://react.dev/
* Material UI https://mui.com/material-ui/
* Material React Table https://material-react-table.com
* Openlayers https://openlayers.org/
* dayjs https://github.com/iamkun/dayjs
* TanStack Query https://tanstack.com/query/
* export-to-csv https://github.com/alexcaza/export-to-csv
* Signature Pad https://github.com/szimek/signature_pad
* PapaParse https://github.com/mholt/PapaParse
* arc.js https://github.com/springmeyer/arc.js
* compare-versions https://github.com/omichelsen/compare-versions
* file-type https://github.com/sindresorhus/file-type
