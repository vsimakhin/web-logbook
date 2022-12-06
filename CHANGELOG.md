# Changelog

## Not released yet

- Updated: unit tests were redesigned and updated, made them more reliable and not random sometimes. This doesn't affect UI or functionality, just internal thing
- New: Added `-ldflags="-s -w"` when compiling binaries. It removes the debug information and should reduce the final size.
- New: Added few filters to the map page: aircraft registration, model and class, route arrival/departure.

## [2.9.0] - 27.11.2022

- New: a date range field (https://www.daterangepicker.com/) for logbook, stats and maps pages with some predefined values (last 30 days, this month etc) and possibility to select a custom range. This one probably will cause some hidden bugs in UI, but ¯\\_(ツ)_/¯*
- New: Started to write a changelog to track the changes, fixes and so on in one file
- New: Added binaries for arm32 to support older Raspberry Pi devices
- Updated: The custom date picker from jquery was replaced by the date range picker. No effect on the end user, just simplifying the code
