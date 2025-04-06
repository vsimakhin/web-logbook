![GitHub Release](https://img.shields.io/github/v/release/vsimakhin/web-logbook) ![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/vsimakhin/web-logbook/latest/total?color=green)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/vsimakhin/web-logbook/total?label=all%20downloads) ![GitHub License](https://img.shields.io/github/license/vsimakhin/web-logbook)
[!["Buy Me A Coffee"](https://img.shields.io/badge/-buy_me_a%C2%A0coffee-gray?logo=coffeescript)](https://buymeacoffee.com/vsimakhin)


# Web-logbook

This is a simple, free and opensource EASA-style logbook application written in golang and react.

You can clone the repo and compile the binaries yourself, or just download the latest ones for your operating system from the [releases](https://github.com/vsimakhin/web-logbook/releases).

Once you start the app it automatically creates an SQLite local DB and starts listening on port 4000 by default. So you can open it in your standard web browser at http://localhost:4000

You also can easily export all flight records into EASA style pdf format, print it, sign and use it as a usual paper logbook.

# Changelog

## [Unreleased]

- New: Track log support added. You can now upload KML files as attachments or convert existing ones to display flight tracks on the map page. The flight distance is automatically calculated from the track log. Tracks are also visible on the overall Map page.

## [3.0.0-alpha1] - 17.03.2025

- Caution: This is an early release and still in test, please create a backup of your db file (`weblogbook.sql`) before switching to this version
- Update: Completely new user interface
- Update (**breaking change**): The category list has a new format and should be recreated
- Note: The Docker image for this release is tagged with its version only and doesn't use the standard `latest` tag until it exits alpha status

## [2.45.0] - 15.03.2025

- Update: This is the final release of the v2.x series, including Golang library and security updates, before the rollout of v3.x.

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
* Flight map

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

# New features/Issues

In case you'd like to add some other features to the logbook or you found a bug, please open an "issue" here https://github.com/vsimakhin/web-logbook/issues with a description. I cannot promise I'll implement it or fix it at a reasonable time but at least I can take a look.

<a href="https://www.buymeacoffee.com/vsimakhin" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

# Contributors

* [@Jacopx](https://github.com/Jacopx), [@dimoniet](https://github.com/dimoniet), [@maesteve](https://github.com/maesteve), [@ken340](https://github.com/ken340) - bug reports, testing, and new functionality suggestions

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
