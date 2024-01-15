# Web-logbook

This is a simple free EASA-style logbook application written in golang.

You can clone the repo and compile the binaries yourself, or just download the latest ones for your operating system from the [releases](https://github.com/vsimakhin/web-logbook/releases).

Once you start the app it automatically creates an SQLite local DB and starts listening on port 4000 by default. So you can open it in your standard web browser at http://localhost:4000

You also can easily export all flight records into EASA style pdf format, print it, sign and use it as a usual paper logbook.

# Changelog

The changelog is [here](https://github.com/vsimakhin/web-logbook/blob/main/CHANGELOG.md)

# Usage

1. Download the latest release from https://github.com/vsimakhin/web-logbook/releases
1. Extract the archive to some folder/directory
1. Run:
  * Windows:
    * Double-click on the `web-logbook.exe` file. It will show you some warning about how unsafe it can be (need to solve it later), but just run it.
  * Linux:
    * Open a terminal and navigate to the directory
    * Run `./web-logbook`
  * MacOS:
    * *I still didn't test it for MacOS, so in theory, should be as same as for Linux, but... who knows ¯\\_(ツ)_/¯*
4. Open your browser, type http://localhost:4000 and the application is ready to use
  * *(first run)* Go to the [Settings](http://localhost:4000/settings) page, `Airports` tab and click on the `Update Airport DB` button
6. To close the application, use `Ctrl+C` in the terminal window or just close it

## CLI options
```sh
$ ./web-logbook -h
  -cert string
      certificate path (default "certs/localhost.pem")
  -disable-authentication
      Disable authentication (in case you forgot login credentials)
  -dsn string
      SQLite file name (default "web-logbook.sql")
  -enable-https
      Enable TLS/HTTPS
  -env string
      Environment {dev|prod} (default "prod")
  -key string
      private key path (default "certs/localhost-key.pem")
  -port int
      Server port (default 4000)
  -url string
      Server URL (default "localhost")
  -version
      Prints current version
```

# Supported operating systems

Since it's written in golang it can run on any system if you compile the sources. For now, on the [Release](https://github.com/vsimakhin/web-logbook/releases/latest) page, there are 3 binaries for Linux, MacOS and Windows, all of them are amd64.

There is an application [Web Logbook Mobile](https://github.com/vsimakhin/web-logbook-mobile) for Android and IOS, which can sync with the main application.

# Interface

Currently, there are implemented several modules in the logbook app:
* Logbook itself
  * Flight records 
  * Attachments for the flight records
  * Automatic night-time calculation
  * Map drawing and distance calculation for the flight record
* Settings
  * Signature and owner name
  * Signature pad to automatically include signatures to the PDF exports
  * Enable/Disable authentication (in case you need to expose the app to the public internet)
  * Aircraft groups/classes
  * List global airport database
  * Your own custom airfields or heliports
  * Some interface settings
* Export
  * Export to EASA PDF format (A4 and A5)
  * Additional export formats (XLSX, CSV)
  * Adjustable settings for each export format
* Import
  * CSV support
  * Automatic WebLogbook profile load
* Map
  * Filters for routes and airports
  * Filters for the aircraft
* Licensing & Certification
  * Document attachments and preview
  * Expiration time tracking
* Statistics
  * Totals
  * By Year
  * By Aircraft
  * By Aircraft group/class, defined in settings

## Logbook

![Main logbook page](https://github.com/vsimakhin/web-logbook-assets/raw/main/logbook-main.png)

## Export

![Export](https://github.com/vsimakhin/web-logbook-assets/raw/main/export.png)

### A4
![Export to PDF](https://github.com/vsimakhin/web-logbook-assets/raw/main/logbook-export.png)

### A5
![Export to PDF](https://github.com/vsimakhin/web-logbook-assets/raw/main/export-a5-a.png)
![Export to PDF](https://github.com/vsimakhin/web-logbook-assets/raw/main/export-a5-b.png)

So in real life the logbook could look like
![Pilot logbook](https://github.com/vsimakhin/web-logbook-assets/raw/main/logbook_irl.jpg)

## Flight record

![Flight record](https://github.com/vsimakhin/web-logbook-assets/raw/main/flight-record-example.png)

### Attachments
![Flight record attachments](https://github.com/vsimakhin/web-logbook-assets/raw/main/flight-record-example-attachments.png)

## Settings

![Settings](https://github.com/vsimakhin/web-logbook-assets/raw/main/settings.png)

![Settings-Airports](https://github.com/vsimakhin/web-logbook-assets/raw/main/settings-airports.png)

## Stats

![Flight stats](https://github.com/vsimakhin/web-logbook-assets/raw/main/stats.png)

![Map](https://github.com/vsimakhin/web-logbook-assets/raw/main/stats-map.png)

## Licensing & Certifications

![Licensing](https://github.com/vsimakhin/web-logbook-assets/raw/main/licensing.png)

![Licensing record](https://github.com/vsimakhin/web-logbook-assets/raw/main/licensing-record.png)

# Airports Databases

The app supports 3 sources:
* https://github.com/mwgg/Airports/raw/master/airports.json - main JSON database of 28k+ airports.
* (default) https://github.com/vsimakhin/Airports/raw/master/airports.json - my local fork of the main JSON database,  to ensure that the app remains functional even if there are any breaking changes in the upstream.
* https://davidmegginson.github.io/ourairports-data/airports.csv - an alternate set of airports from https://ourairports.com/, which contains over 78k records, including small airfields and heliports. 

If you enable the `No ICAO codes filter` option, the app will ignore ICAO airport codes that contain numbers and dashes, which are not commonly used ICAO codes. By default, this option is unchecked, which makes the database slightly smaller and cleaner.

Please make sure to click the `Save` button before updating the database to ensure that all changes are saved.

# HTTPS enable

Since the app is running on `localhost` it's not possible to create a public certificate that would be valid by public CAs. As an option, you can create a self-signed certificate and add it to the root CA in your operating system. For that, you can use [`mkcert` tool](https://github.com/FiloSottile/mkcert).

* Open a terminal/console and navigate to the `web-logbook` directory
* Create a directory `certs`
* In this new directory run commands:
  * `mkcert -instal` - it will create a new local CA
  * `mkcert localhost` - it will generate a key(`localhost-key.pem`) and a certificate(`localhost.pem`)
* Now just run the Web Logbook App with the new parameter: `web-logbook --enable-https`

You don't need to install a new local CA in you system, but in this case, browser will always show you a warning message, that certificate is self-signed and not trusted.

Also, you can always generate your own certificate and key and store it in the different directories in your operating system. For that use `--key` and `--cert` parameters to specify the exact location.

# New features/Issues

In case you'd like to add some other features to the logbook or you found a bug, please open an "issue" here https://github.com/vsimakhin/web-logbook/issues with a description. I cannot promise I'll implement it or fix it at a reasonable time but at least I can take a look.

# Contributors

* [@Jacopx](https://github.com/Jacopx), [@dimoniet](https://github.com/dimoniet), [@maesteve](https://github.com/maesteve) - bug reports, testing, and new functionality suggestions

# Used libraries

* Bootstrap https://getbootstrap.com/
* Datatables https://datatables.net/
* Openlayers https://openlayers.org/
* Golang go-pdf https://github.com/go-pdf/fpdf
* Golang chi web-server https://github.com/go-chi/chi
* Golang Excelize https://github.com/xuri/excelize
* Chart.js https://www.chartjs.org/
* Date Range Picker https://www.daterangepicker.com/
* Signature Pad https://github.com/szimek/signature_pad
* PapaParse https://github.com/mholt/PapaParse
