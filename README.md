# Web-logbook

This is EASA style logbook local web app written in golang.

You can clone the repo and compile the binaries yourself, or just download the latest ones for your operating system from the releases.

Once you start the app it automatically creates a sqlite local db and start listening on a port 4000 by default. So you can open it in your standard web-browser on http://localhost:4000

You also can easily export all flight records into EASA style pdf format, print it, sign and use as a usual paper logbook.

# Usage

1. Download the latest release from https://github.com/vsimakhin/web-logbook/releases
1. Extract archive to some folder (let's say it will be a `/some/path/folder-name`)
1. Open a terminal and navigate to this folder
1. Run `./web-logbook`
1. Once you finished, use `Ctrl+C` or just close the terminal window

# Supported operating systems

Since it's written in golang it can run on any system if you compile the sources. For now in the `Release` page there are 2 binaries for linux amd64 and windows.

# Interface

## Logbook

![Main logbook page](https://github.com/vsimakhin/web-logbook-assets/raw/main/logbook-main.png)

## Export

![Export to PDF](https://github.com/vsimakhin/web-logbook-assets/raw/main/logbook-export.png)

## Flight record

![Flight record](https://github.com/vsimakhin/web-logbook-assets/raw/main/flight-record-example.png)

## Settings

![Settings](https://github.com/vsimakhin/web-logbook-assets/raw/main/settings.png)

## Stats

![Flight stats](https://github.com/vsimakhin/web-logbook-assets/raw/main/stats.png)


![Map](https://github.com/vsimakhin/web-logbook-assets/raw/main/stats-map.png)

