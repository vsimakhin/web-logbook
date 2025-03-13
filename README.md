![GitHub Release](https://img.shields.io/github/v/release/vsimakhin/web-logbook) ![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/vsimakhin/web-logbook/latest/total?color=green)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/vsimakhin/web-logbook/total?label=all%20downloads) ![GitHub License](https://img.shields.io/github/license/vsimakhin/web-logbook)
[!["Buy Me A Coffee"](https://img.shields.io/badge/-buy_me_a%C2%A0coffee-gray?logo=coffeescript)](https://buymeacoffee.com/vsimakhin)


# Web-logbook

This is a simple, free and opensource EASA-style logbook application written in golang.

You can clone the repo and compile the binaries yourself, or just download the latest ones for your operating system from the [releases](https://github.com/vsimakhin/web-logbook/releases).

Once you start the app it automatically creates an SQLite local DB and starts listening on port 4000 by default. So you can open it in your standard web browser at http://localhost:4000

You also can easily export all flight records into EASA style pdf format, print it, sign and use it as a usual paper logbook.

# Changelog

## [2.44.1] - 17.01.2025

- Fix: Resolved an issue with the query for retrieving created indexes in MySQL.
- Update: Update golang packages.

## [2.44.0] - 13.12.2024

- Update: Update golang packages.
- Fix: Add database schema version and check, so the app will not recreate DB views on every start up.
- Update: There are few major updates for the docker files and image containers
  - The base image changed from `debian:bookworm-slim` to `alpine`, which reduced the container image size 3x - from 104MB to 37MB
  - The image supports `linux/amd64` and `linux/arm64` now
  - The entrypoint and cmd are changed. If you don't see data with the new image try to remove `./web-logbook` from the command
  ```yaml
  # old image
  ENTRYPOINT ["./web-logbook", "-dsn", "/data/web-logbook.sql"]
  
  # new image
  ENTRYPOINT ["./web-logbook" ]
  CMD ["-dsn", "/data/web-logbook.sql"]
  ```
  - **BREAKING**: If you encounter errors like the one shown below, verify the access rights and ownership of your `web-logbook.sql` file. Ensure it is owned by the current user rather than root, and update the ownership if necessary.
  ```bash
  SQL logic error: no such table: metadata (1)
  ERROR	2024/12/14 20:33:01 main.go:162: SQL logic error: view logbook_view already exists (1)

  ```

## [2.43.3] - 04.11.2024

- Fix: Resolved SQL syntax error that occurred when creating a new license record.

## [2.43.2] - 21.10.2024

- Fix: Error on `Total by Month` page when changing a year in Chrome and MS Edge browsers.

## [2.43.1] - 21.10.2024

- Fix: Attachments not uploaded if the new record saved and page wasn't reloaded

## [2.43.0] - 10.10.2024

- Update: Updated golang version to the latest 1.23.2 and required packages.
- Update: removed update_time field from tables and some small code optimization. No UI change.

## [2.42.0] - 30.08.2024

- Update: No longer shorten the remarks field for small screens if the option "Do not adjust logbook columns for small screens" is selected
- Fix: Recreate the database view during startup in case changes didn't propagate after a version change.

The full changelog is [here](https://github.com/vsimakhin/web-logbook/blob/main/CHANGELOG.md)

# Usage

1. Download the latest release from https://github.com/vsimakhin/web-logbook/releases
1. Extract the archive to some folder/directory
1. Run:
  * Windows:
    * Double-click on the `web-logbook.exe` file. It will show you some warning about how unsafe it can be (need to solve it later), but just run it.
  * Linux/MacOS:
    * Open a terminal and navigate to the directory
    * Run `./web-logbook`
4. Open your browser, type http://localhost:4000 and the application is ready to use
  * *(first run)* Go to the `Settings->Airports` page and click on the `Update Airport DB` button
6. To close the application, use `Ctrl+C` in the terminal window or just close it

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

* Logbook
  * Flight records with date filter and global search through all data
  * Quick export to PDF (A4, A5) and CSV/XLS
* Flight records
  * Flight data
  * Attachments for the flight records
  * Automatic night-time calculation
  * Map drawing and distance calculation for the flight record
* Licensing & Certification
  * List of licenses, certificates and endorsements
  * Document attachments and preview
  * Expiration time tracking
* Map
  * Map of the flights
  * Date filters
  * Routes and airports filters
  * Aircraft filters
* Statistics
  * Totals
  * By Year
  * By Month
  * By Aircraft
  * By Aircraft group/class
  * Limits (EASA flight time limitations)
* Export
  * Export to EASA PDF format (A4 and A5)
  * PDF export formats with custom title pages (for example, include your CV automatically)
  * Additional export formats (XLSX, CSV)
  * Adjustable settings for each export format
* Import
  * CSV support
  * Automatic WebLogbook profile load
* Settings
  * Owner name, license and address, signature for the PDF exports
  * Signature pad to automatically include signatures to the PDF exports
  * Enable/Disable authentication (in case you need to expose the app to the public internet)
  * Aircraft groups/classes
  * Global airport database
  * Your own custom airfields or heliports
  * Some interface settings

## Logbook
![EASA Logbook](./readme-assets/logbook.png)

## Flight record
![Flight record](./readme-assets/flight-record.png)

## Licensing & Certification
![Licensing & Certification](./readme-assets/licensing-record.png)

## Map
![Map of the flights](./readme-assets/map-example.png)

## Stats example
![Flight stats example](./readme-assets/stats-example.png)

## Export
![Export](./readme-assets/export-page.png)

### A4
![Export to PDF](./readme-assets/logbook-export.png)

### A5
![Export to PDF](./readme-assets/export-a5-a.png)
![Export to PDF](./readme-assets/export-a5-b.png)

So in real life the logbook could look like
![Pilot logbook](./readme-assets/logbook_irl.jpg)

## Import
![Import](./readme-assets/import.png)

## Settings
![Settings](./readme-assets/settings-general.png)

## Dark mode
![Dark mode](./readme-assets/dark-mode.png)

## Mobile friendly
![Mobile friendly](./readme-assets/mobile-friendly.png)

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

Since the app is running on `localhost` it's not possible to create a public certificate that would be valid by public CAs. As an option, you can create a self-signed certificate and add it to the root CA in your operating system. For that, you can use [`mkcert` tool](https://github.com/FiloSottile/mkcert).

* Open a terminal/console and navigate to the `web-logbook` directory
* Create a directory `certs`
* In this new directory run commands:
  * `mkcert -instal` - it will create a new local CA
  * `mkcert localhost` - it will generate a key(`localhost-key.pem`) and a certificate(`localhost.pem`)
* Now just run the Web Logbook App with the new parameter: `web-logbook --enable-https`

You don't need to install a new local CA in you system, but in this case, browser will always show you a warning message, that certificate is self-signed and not trusted.

Also, you can always generate your own certificate and key and store it in the different directories in your operating system. For that use `--key` and `--cert` parameters to specify the exact location.

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

# New features/Issues

In case you'd like to add some other features to the logbook or you found a bug, please open an "issue" here https://github.com/vsimakhin/web-logbook/issues with a description. I cannot promise I'll implement it or fix it at a reasonable time but at least I can take a look.

<a href="https://www.buymeacoffee.com/vsimakhin" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

# Contributors

* [@Jacopx](https://github.com/Jacopx), [@dimoniet](https://github.com/dimoniet), [@maesteve](https://github.com/maesteve), [@ken340](https://github.com/ken340) - bug reports, testing, and new functionality suggestions

# Used libraries

Backend:
* Golang go-pdf https://github.com/go-pdf/fpdf
* Golang chi web-server https://github.com/go-chi/chi

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
