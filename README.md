# Web-logbook

This is a simple free EASA style logbook application written in golang.

You can clone the repo and compile the binaries yourself, or just download the latest ones for your operating system from the [releases](https://github.com/vsimakhin/web-logbook/releases).

Once you start the app it automatically creates a sqlite local db and start listening on a port 4000 by default. So you can open it in your standard web-browser on http://localhost:4000

You also can easily export all flight records into EASA style pdf format, print it, sign and use as a usual paper logbook.

# Usage

1. Download the latest release from https://github.com/vsimakhin/web-logbook/releases
1. Extract archive to some folder/directory
1. Run: 
  * Windows:
    * Double click on the `web-logbook.exe` file. It will show you some warning about how unsafe it can be (need to solve it later), but just run it.
  * Linux:
    * Open a terminal and navigate to the directory
    * Run `./web-logbook`
  * MacOS:
    * *I still didn't test it for the MacOS, so in theory should be as same as for linux, but... who knows ¯\\_(ツ)_/¯*
4. Open your browser and type http://localhost:4000
5. Go to Settings page and click "Restore Defaults" for the export formats (in case the values there are 0)
6. Once you finished, use `Ctrl+C` or just close the terminal window

## CLI options
```
$ ./web-logbook -h
  -disable-authentication
    	Disable authentication (in case you forgot login credentials)
  -dsn string
    	SQLite file name (default "web-logbook.sql")
  -env string
    	Environment {dev|prod} (default "prod")
  -port int
    	Server port (default 4000)
  -version
    	Prints current version

```

# Supported operating systems

Since it's written in golang it can run on any system if you compile the sources. For now in the [Release](https://github.com/vsimakhin/web-logbook/releases/latest) page there are 3 binaries for linux, macos and windows, all of them are amd64.

# Interface

Currently there are implemented several modules in the logbook app:
* Logbook itself
  * Attachments for the flight records
  * Map drawing and distance calculation for the flight record
  * Export to EASA PDF format (A4 and A5)
* Settings
  * Signature and owner name 
  * Enable/Disable authentication (in case you need to expose the app to the public internet)
  * Aircraft groups/classes
  * Adjustable settings for each export format 
* Map
  * Filters for routes and airports 
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

### A4
![Export to PDF](https://github.com/vsimakhin/web-logbook-assets/raw/main/logbook-export.png)

### A5
A5 format output is still in beta mode, I didn't fully test the page margins on the real paper

![Export to PDF](https://github.com/vsimakhin/web-logbook-assets/raw/main/export-a5-a.png)
![Export to PDF](https://github.com/vsimakhin/web-logbook-assets/raw/main/export-a5-b.png)


## Flight record

![Flight record](https://github.com/vsimakhin/web-logbook-assets/raw/main/flight-record-example.png)

### Attachments
![Flight record attachments](https://github.com/vsimakhin/web-logbook-assets/raw/main/flight-record-example-attachments.png)

## Settings

![Settings](https://github.com/vsimakhin/web-logbook-assets/raw/main/settings.png)

![A5 Format Settings](https://github.com/vsimakhin/web-logbook-assets/raw/main/settings-export-format.png)

## Stats

![Flight stats](https://github.com/vsimakhin/web-logbook-assets/raw/main/stats.png)

![Flight stats classes](https://github.com/vsimakhin/web-logbook-assets/raw/main/stats-classes.png)

![Map](https://github.com/vsimakhin/web-logbook-assets/raw/main/stats-map.png)

## Licensing & Certifications

![Licensing](https://github.com/vsimakhin/web-logbook-assets/raw/main/licensing.png)

![Licensing record](https://github.com/vsimakhin/web-logbook-assets/raw/main/licensing-record.png)

# New features/Issues

In case you'd like to add some other features for the logbook or you found a bug, please open an "issue" here https://github.com/vsimakhin/web-logbook/issues with a description. I cannot promise I'll implement it or fix at a reasonable time but at least I can take a look.

# Used libraries

* Bootstrap https://getbootstrap.com/
* Datatables https://datatables.net/
* Openlayers https://openlayers.org/
* Golang gofpdf https://github.com/jung-kurt/gofpdf
* Golang chi web-server https://github.com/go-chi/chi
* Chart.js https://www.chartjs.org/

