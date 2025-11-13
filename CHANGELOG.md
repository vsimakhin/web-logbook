# Changelog

## [Unreleased]

- Update: Golang and npm packages/security patches
- Fix: Optimized the currency page to refresh the state after a flight record is updated.
- New: Add support for imports from Leon application.
- Fix: Flights for the selected person were shown in random order.

## [3.16.0] - 25.10.2025

- Fix: Error when building aircraft list if multiple aircraft types were logged under the same registration number.
- Update: Golang and npm packages/security patches
- Fix/Update: Simplified and corrected night time calculation. Previously, it could be inaccurate for routes on the opposite side of the globe from Europe.
- Fix: Night time field wasn't updated (for copied flights) if the actual night time was 0.

## [3.15.0] - 15.10.2025

- New: Add option to upload and download the database file (SQLite only).
- Fix: Update column number for the ICAO code for Our Airports database source.
- Fix: Recalculate night time even the field is not empty.
- New: Added an option to hide time fields on the Flight Record page.
- Update: Reorganized action buttons on the Flight Record page.
- Update: Set start of the week to Monday for the date fields.
- New: Added badges on the navigation panel for very soon expiring and expired licenses, configurable from the Settings page.

## [3.14.0] - 07.10.2025

- New: Expiration date tracking for Currency - `Valid Until` and `Expire` @xtncl

## [3.13.0] - 06.10.2025

- Fix: Dashboard stats calculation when using custom manual dates

## [3.12.0] - 04.10.2025

- Update: Dashboard and stats improved - simulator flights are now counted under the correct aircraft type or category when simulator type matches, otherwise grouped as "Simulator".
- Update: Improved import with automatic recognition of date, time, and route in CSV fields, and added a help button with field format descriptions.

## [3.11.0] - 27.09.2025

- Update: General code optimization and UI improvements for the aircraft and airports tables (column resizing)
- New: Custom person roles (new field on the Settings page)
- New: Added `Since` and `All Time` time frame units for the Currency
- Update: grey out 0:00/0 values in the stats tables
- New: Enroute field as a new custom type. Allows to add enroute/touch-n-goes airfields and show them on the map. Distance is recalculated as well.

## [3.10.0] - 19.09.2025

- Fix: track plotting from SkyDaemon KML files

## [3.9.0] - 13.09.2025

- Fix: Corrected caching for Persons entity
- Update: Increase timeout for initial DB check
- Update: Golang and npm packages/security patches
- Fix: Don't show the brackets if the person doesn't have a role
- Update: Change Map selectors `No Route Lines`/`No Tracks` to `Route Lines`/`Tracks`
- New: Added Track and Attachments columns for the logbook table. Shows if a flight record has a track attached and amount of the attachments. Hidden by default

## [3.8.0] - 06.09.2025

- New: Added a support to change the naming for the standard fields on the flight record page and all the tables (logbook and stats)

## [3.7.0] - 03.09.2025

- New: Added new section `Persons` to track the crew members for the flights @danielkappelle

## [3.6.1] - 19.08.2025

- Fix: track is not displayed on the Flight record map
- Update: Add `numeric` property for Time and Landing fields to show a numeric keyboard on mobile devices for better UX @danielkappelle

## [3.6.0] - 14.08.2025

- New: Custom fields support in the main logbook table and stats tables
- New: Add option to show/hide tracks and routes on the `Map` page
- Fix: Dashboard filters error

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

## [3.1.3] - 24.05.2025

- Fix: Handled missing registration numbers when building the aircrafts list/table from flight records.

## [3.1.2] - 24.05.2025

- Fix: Copilot time was not added to the logbook during import.
- Update: Fix a logic for checking duplicate records during import.

## [3.1.1] - 21.05.2025

- Fix: Potential user lockout when the username was not provided in email format.

## [3.1.0] - 17.05.2025

- Note: Version 3 is now stable and released to production. The Docker image is also available under the `latest` tag.
- New: Added preview support for flight record attachments.
- Update: Added navigation buttons to move to the previous and next flights on the flight record page.
- Fix: Resolved an issue when changing or adding a new license category.
- Fix: Fixed a bug with the aircraft type autocomplete when no records are present. @danielkappelle

## [3.0.0-beta4] - 09.05.2025

- Fix: Columns layout for currency table.
- Fix: Error when updating day or night landings in a flight record.
- Update: Added recalculation of night time during flight record import.
- Fix: Corrected night time calculation for flights with identical departure and arrival locations (e.g., training circuits).
- Note: I expect this to be the last beta release; the next versions will be production releases.

## [3.0.0-beta3] - 03.05.2025

- Update: Updated npm and Go packages with security fixes and version bumps.
- Fix: Avoid redundant request triggered during new license record creation
- New: Tracking currency and flight experience
- Fix: Avoid redundant request triggered during new flight record creation

## [3.0.0-beta2] - 13.04.2025

- Fix: Fix issue adding new aircraft types and regs
- Update: Optimize UI elements
- Note: The Docker image for this release is still tagged with its version only and doesn't use the standard `latest` tag until it exits beta status

## [3.0.0-beta1] - 12.04.2025

- New: Column sizing preferences for the Logbook and Licensing tables are now saved (in a browser local storage). A Reset Column Sizing button has also been added to the right toolbar.
- New: Track log support added. You can now upload KML files as attachments or convert existing ones to display flight tracks on the map page. The flight distance is automatically calculated from the track log. Tracks are also visible on the overall Map page.
- Update: Updated npm and Go packages with security fixes and version bumps.

## [3.0.0-alpha1] - 17.03.2025

- Caution: This is an early release and still in test, please create a backup of your db file (`weblogbook.sql`) before switching to this version
- Update: Completely new user interface
- Update (**breaking change**): The category list has a new format and should be recreated
- Note: The Docker image for this release is tagged with its version only and doesn't use the standard `latest` tag until it exits alpha status

## [2.45.0] - 15.03.2025

- Update: This is the final release of the v2.x series, including Golang library and security updates, before the rollout of v3.x.

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
- Update: Removed update_time field from tables and some small code optimization. No UI change.

## [2.42.0] - 30.08.2024

- Update: No longer shorten the remarks field for small screens if the option "Do not adjust logbook columns for small screens" is selected
- Fix: Recreate the database view during startup in case changes didn't propagate after a version change.

## [2.41.0] - 11.08.2024

- Update: Update go minor version (1.21.13) and related packages (bug and security fixes).
- Fix: Corrected a title for the login page.
- Fix: Fix the random order of the elements on Stats by Type/Class pages

## [2.40.0] - 10.07.2024

- Update: The page will no longer reload when saving a new flight record.
- Update: During validation, fields with correct values will no longer be highlighted in green. Only fields with incorrect values will be highlighted in red.
- New: Added a "Copy" button to the Flight Record page.
- Update: When the arrival or departure time is changed and the total time is recalculated, the other time fields will also be checked against the old total.

## [2.39.0] - 03.07.2024

- Fix: Incorrect night time calculation when flying inside the polar circle

## [2.38.0] - 25.06.2024

- Fix: Bug with columns for the extended PDF format, both A4 and A5.
- Update: Update golang to 1.21.11 and golang packages
- Fix: The daterange picker on the main Logbook page didn't recognize the settings for the first day of the week (Monday or Sunday)

## [2.37.0] - 02.06.2024

- Update: Session manager now stores tokens in the database instead of memory. In this case it's possible to run the application in the Cloud platforms (AWS ECS, Google Cloud Run, Kubernetes) without always keeping it live and active.

## [2.36.0] - 01.06.2024

- Update: Slightly updated the build script to support v6 and v7 platforms for ARM32 binaries.
- New: Added new option to the Settings page - `Do not adjust logbook columns for small screens`. In this case the full logbook table will be shown without hiding any columns for mobile devices.
- New: New stats page - Totals by Month

## [2.35.2] - 20.05.2024

- Fix: Proper password field validation on Save
- Update: Support for submit button (on Enter key) on login page
- Fix: Add horizontal scrolling for the logbook page to properly support mobile devices
- Fix: Add dynamic resizing for the charts on Stats pages
- Fix: Instructor's hours for the Total Stats table were mixed up for the last 90 days and the last 12 months

## [2.35.1] - 20.05.2024

- Fix: Correct using styles and classes for the sidebar when switching between the pages
- Update: Code cleanup, removing code for synchronization with mobile client (will not continue working on it)
- Update: Update golang version (1.21.10) and go packages.
 
## [2.35.0] - 18.05.2024

- New: Implemented a new responsive user interface that is friendly for desktop, mobile, and tablet devices. The design is based on the adminkit.io template, and all pages are refactored to ensure a seamless user experience across different platforms. Probably some new bugs are introduced ¯\\_(ツ)_/¯*
- Update: rename cmd/web directory to app, just internal change.
- Update: Code optimization. No UI change. Includes:
    - Migrated all javascript code to a js files instead of keeping them in gohtml templates, plus some html code optimization. This significantly reduces amouunt of typo and errors. 
    - Removed map data for css and js files for standard libraries. As a result, the final size of the application binary file is reduced by ~10 MB to ~18MB.
    - Added simple brutforce protection for login page.
    - Optimize internal helper function, so need for additional error check.

## [2.34.0] - 03.04.2024

- New: Add support for MySQL database. Check [readme](https://github.com/vsimakhin/web-logbook?tab=readme-ov-file#mysql-database) for more details.
- Update: Refactored PDF export package. No UI changes.
- New: Add support for a custom title page for PDF A4/A5 exports.
- Update: Update openlayers lib from 7.3.0 to 9.0.0. No UI changes.
- Update: Update golang from 1.20.3 to 1.21.8. No UI changes.
- Fix: Finally fixed the unit tests. No UI changes.

## [2.33.0] - 08.03.2024

- New: License Number and Address fields on the `Settings` page. They are printed (if not empty) on the title page for PDF exported logbook.
- Fix: Try to fix a `Map` page layout for Mac OS

## [2.32.1] - 06.03.2024

- Fix: Add additional checks for time field autoformat, so app will not crash

## [2.32.0] - 25.02.2024

- New: Add autoformat for time fields. You can choose from three options: `None`, `HH:MM` (will add leading 0) and `H:MM` (will remove leading 0). Please note that this feature only affects how the time is displayed in the UI and does not modify the data in the database table. You can find this option in the `Settings`, `Export PDF A4`, and `Export PDF A5` pages.

## [2.31.0] - 27.01.2024

- New: Add autoformat for the date field for import data, so it can convert `D/MM/YYYY`, `DD/MM/YYYY` and `D/M/YYYY` to the full `DD/MM/YYYY` format.
- Fix: Allow full HH:MM format for flight time, so even 02:15 is valid (previosly it allowed 2:15 only without leading 0)
- Fix: If the name field in the AirportDB listing is too long, the listing was displayed outside the popup. Fixed.

## [2.30.0] - 22.01.2024

- Fix: Map now show a great circle arcs instead of "direct" lines.
- Fix: Duplicate models in the field of the flight record form. Fixed. Plus added sorting for models and regs.
- Fix: The ICAO code was not properly set for the airports from ourairports.com source. Changed the algorithm to assign the codes.

## [2.29.1] - 15.01.2024

- Fix: time error for totals on the main `Logbook page` due to `round` function. Calculation didn't affect Stats or Logbook exports

## [2.29.0] - 15.01.2024

- New: Additional sources for the airport databases. The new option added is from [https://ourairports.com](https://ourairports.com)

## [2.28.1] - 06.01.2024

- Fix: Cross Country hours in the Stats tables when there are no flights for the time period

## [2.28.0] - 25.12.2023

- New: Add licensing synchronization with mobile app. No UI changes.
- Fix: The `-url` parameter was ignored. Now the default value is empty, which means the app will listen on all available network interfaces.
You can set `-url localhost` and app will listen on `localhost` or `127.0.0.1` only.
- New: Few changes for the future new mobile [client](https://github.com/vsimakhin/web-logbook-mobile-ionic). No UI changes.

## [2.27.0] - 07.10.2023

- New: Added rows `Total this page` and `Total all pages` for the main logbook table. The values are updated if you filter the search.

## [2.26.0] - 20.09.2023

- Update: ignore case for filters on the `Map` page
- Fix: The filter on the `Map` page wasn't working correctly if there was a space in the fields
- Update: Show the total number of rows for most of the tables (Logbook, Licensing, Airports)
- New: Date Range Picker first day of the week settings - Sunday or Monday.
- New: Attachments synchronization support for the mobile application.

## [2.25.0] - 27.07.2023

- Fix: the license warning badge wasn't hidden on some pages even it was set so in the Settings

## [2.24.0] - 20.07.2023

- New: option for A4 PDF extended format, where Date field is added to the FSTD section
- Update: the synchronization protocol between the main app and the mobile app slightly changed to implement new features in the feature easily.

## [2.23.0] - 01.07.2023

- Fix: set smaller font size or even truncate the remarks for PDF exports in case they are too long

## [2.22.0] - 03.06.2023

- New: Dark mode.
- New: A popup with airport infromation once you click on the marker on the `Map` page.
- Update: The Openlayers library upgraded to the version 7.3.0

## [2.21.2] - 28.04.2023

- Fix: added escape function for special html chars when checking for a long remarks field

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