# Changelog

## [Unreleased]

- Fix: Correct column name from `Arrival/Departure Date` to `Arrival/Departure Time` on the main logbook page
- New: Added `Last 12 Months` column to the main stats page
- Updated: Rewrote slightly javascript file for `Stats` page/template to follow some best practices from "javascript world" (whatever it means...). Will be doing the same for other included JS template partials in the future.

## [2.11.0] - 10.01.2023

- New: Added progress check for the flight time limitations on the Stats page. It's based on the EASA rules (mostly for commercially flying pilots): 100 hours in a period of 28 consecutive calendar days, 280 in a period of 90 consecutive calendar days, 900 hours in a calendar year and 1000 in a period of 12 consecutive calendar months.
- Updated: golang version 1.19 and dependencies
- Fix: Typo fix on the Stats page, the label was "Single Engine" instead of "Distance"

## [2.10.1] - 10.12.2022

- Fix: When clicked on the `Remove` button for the attachment the modal window just closed without letting you to confirm the deletion. This was fixed by updating bootstrap css and js files.
- Fix: Updated alert info fields to show the proper color as well (green/red)

## [2.10.0] - 10.12.2022

- Updated: unit tests were redesigned and updated, made them more reliable and not random sometimes. This doesn't affect UI or functionality, just internal thing
- New: Added `-ldflags="-s -w"` when compiling binaries. It removes the debug information and should reduce the final size.
- New: Added few filters to the map page: aircraft registration, model and class, route arrival/departure.
- New: Double click on the `PIC Name` will set `Self` value for the field

## [2.9.0] - 27.11.2022

- New: a date range field (https://www.daterangepicker.com/) for logbook, stats and maps pages with some predefined values (last 30 days, this month etc) and possibility to select a custom range. This one probably will cause some hidden bugs in UI, but ¯\\_(ツ)_/¯*
- New: Started to write a changelog to track the changes, fixes and so on in one file
- New: Added binaries for arm32 to support older Raspberry Pi devices
- Updated: The custom date picker from jquery was replaced by the date range picker. No effect on the end user, just simplifying the code
