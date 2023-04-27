# Changelog

## [2.21.1] - 27.04.2023

- Update: Golang version update to 1.20.3

## [2.21.0] - 18.04.2023

- Update: A new algorithm for a night-time calculation. The previous one had a few limitations, such as it couldn't correctly calculate the time if the flight started before sunset and ended after sunrise. Or there was quite a high error if the flight was close to the North or South poles. The new algorithm divides the flight for the segments <1 minute and checks the sunrise/sunset time for each of them, and then summarises the total night time.

## [2.20.3] - 16.04.2023

- Fix: The main logbook table pagination was broken due to wrong variable type (string instead of int)

## [2.20.2] - 15.04.2023

- Fix: last release introduced an error, when validator for the flight record didn't accept time in 0:mm format. Fixed.

## [2.20.1] - 15.04.2023

- New: Add options to the `Settings` to define the amount of the rows in the `Logbook` and `Licensing` tables
- Update: Updated validators for the flight record, so it's possible to add the first "empty" flight record with hours from the previous logbook.
- Fix: table layout on the main `Logbook` page.

## [2.20.0] - 13.04.2023

- New: Slightly updated the `Licensing` table and added a check for the expired or expiring soon licenses. The warning will appear in the left navigation bar, however, there is still an option to disable the badge in the `Settings` page if it's too annoying.
- New: Added airport database synchronization with a mobile app.
- Update: Moved code that calculates a night time from the package to the internal module - easier troubleshooting and it was used as an example for adding the same functionality to the mobile app
- Fix: Remarks in the main logbook table are truncated depends on the screen width.
- Update: New version for the go-nighttime package, which uses a different library for calculating sunrise and sunset. It might not as precise as the previous one (the difference is up to 2 minutes depending on the flight time), but the calculation is much faster (1000 times) and it doesn't need a time zone database, which makes the binary file up to 15MB less.
- Fix: Show values on the charts (tooltip) in the proper format - HH:MM for time fields, and XXX XXX nm for distance

## [2.19.0] - 06.04.2023

- New: Synchronization with mobile apps. Check [Web Logbook Mobile](https://github.com/vsimakhin/web-logbook-mobile) for more info

## [2.18.1] - 28.03.2023

- Fix: The chart layout for `Totals` on the `Stats` was hardcoded and didn't take into account the hidden fields. Now it's fixed.

## [2.18.0] - 26.03.2023

- Fix: The date filter on the `Map` page didn't work in case of manual change. Now it's ok.
- New: Added option to customize the headers for PDF export formats.
- New: `Restore defaults` option is now by section (common, headers, columns widths)
- New: Added option to switch to the next or the previous flight record on the `Flight Record` page

## [2.17.0] - 24.03.2023

- New: Added HTTPS support. Check [readme](./README.md) for configuration

## [2.16.0] - 19.03.2023

- New: New subpage `Airports` for the `Settings`
- New: Added option to add your custom airport which is not in the standard default airports DB
- New: Added option to list and go through the standard airports database
- Fix: Fixed error for the `Total By Class` when the table is empty

## [2.15.0] - 18.03.2023

- New: Automatic departure and arrival time format recognition for the `Import`
- New: Added option to recalculate night time during the import
- New: Added a check if the flight or simulator record already exists during the import
- New: When the app is running in `dev` mode the logs for the web server now are printed by a standard middleware logger instead of custom messages for each handler. Also added a cache header for static files. Mostly no effect on the user interface, might slight speed improvement.
- Updated: All JavaScript is rewritten to have it in a more readable format with some best practices. No effect on the user interface

## [2.14.0] - 05.03.2023

- New: The full new main section `Import`. For now it's limited to CSV files only. This function is in beta mode. Please use it carefully and don't forget to create backups.
- New: Adjusted text and column width for the main `Logbook` table. Also added the `Logbook table font size` parameter to the `Settings` page.

## [2.13.0] - 24.02.2023

- New: Add option for A5 pdf export format to add `Date` column to the `FSTD` section, which fully matches Part FCL.050 format (https://www.easa.europa.eu/sites/default/files/dfu/Part-FCL.pdf)
- New: Now you can add a signature to the logbook in PDF format. The new signature pad on the `Settings` page allows you to write/draw your signature in any color or upload it from a file (`*.png` format only, and should be with transparent background). And then you can "turn it on" for each PDF export format with a checkbox `Include signature`
- New: Added new setting `Replace SE and ME values for single pilot time with "✓" symbol` for PDF export formats. It's according to EASA Part FCL.050 logbook example https://www.easa.europa.eu/sites/default/files/dfu/Part-FCL.pdf
- Updated: PDF export code adjustment to be more readable and flexible for future formats.
- Updated: Labels for the `Settings`->`Misc` page are set to use a regular font

## [2.12.0] - 21.01.2023

- Fix: Correct column name from `Arrival/Departure Date` to `Arrival/Departure Time` on the main logbook page
- New: Added `Last 12 Months` column to the main stats page
- Updated: Rewrote slightly javascript file for the `Stats` page/template to follow some best practices from "javascript world" (whatever it means...). Will be doing the same for other included JS template partials in the future.
- Updated: Rename `Enable help messages on the flight record page` to `Disable...` and change the logic, otherwise for the new users this field is always unchecked and they don't see some tricks to quickly fill the flight record form
- New: Added options to hide some columns for the Stats tables (you can find them in the `Settings`)
- New: Added Cross Country for the Stats tables
- New: Added new field `Stats tables font size` on the `Settings` page - due to a lot of columns the table layout can be broken on the smaller screens, so you can set your font size from 50% to 100%

## [2.11.0] - 10.01.2023

- New: Added progress check for the flight time limitations on the Stats page. It's based on the EASA rules (mostly for commercially flying pilots): 100 hours in a period of 28 consecutive calendar days, 280 in a period of 90 consecutive calendar days, 900 hours in a calendar year, and 1000 in a period of 12 consecutive calendar months.
- Updated: golang version 1.19 and dependencies
- Fix: Typo fix on the Stats page, the label was "Single Engine" instead of "Distance"

## [2.10.1] - 10.12.2022

- Fix: When clicking on the `Remove` button for the attachment the modal window just closed without letting you confirm the deletion. This was fixed by updating the bootstrap css and js files.
- Fix: Updated alert info fields to show the proper color as well (green/red)

## [2.10.0] - 10.12.2022

- Updated: unit tests were redesigned and updated, making them more reliable and not random sometimes. This doesn't affect UI or functionality, just an internal thing
- New: Added `-ldflags="-s -w"` when compiling binaries. It removes the debug information and should reduce the final size.
- New: Added a few filters to the map page: aircraft registration, model and class, and route arrival/departure.
- New: Double click on the `PIC Name` will set the `Self` value for the field

## [2.9.0] - 27.11.2022

- New: a date range field (https://www.daterangepicker.com/) for the logbook, stats, and maps pages with some predefined values (last 30 days, this month etc) and the possibility to select a custom range. This one probably will cause some hidden bugs in UI, but ¯\\_(ツ)_/¯*
- New: Started to write a changelog to track the changes, fixes and so on in one file
- New: Added binaries for arm32 to support older Raspberry Pi devices
- Updated: The custom date picker from jquery was replaced by the date range picker. No effect on the end user, just simplifying the code