"use strict";

const importUtils = function () {
    let table = null;
    let csv_import = null;
    let table_data = [];

    /**
     * Initializes the import table using DataTables plugin.
     */
    const initImportTable = () => {
        table = $('#import').DataTable({
            ordering: false,
            info: false,
            lengthMenu: [[15, 50, -1], [15, 50, "All"]],
            columns: [
                { data: "date" },
                { data: "departure_place" },
                { data: "departure_time" },
                { data: "arrival_place" },
                { data: "arrival_time" },
                { data: "aircraft_model" },
                { data: "aircraft_reg" },
                { data: "se_time" },
                { data: "me_time" },
                { data: "mcc_time" },
                { data: "total_time" },
                { data: "night_time" },
                { data: "ifr_time" },
                { data: "pic_time" },
                { data: "sic_time" },
                { data: "dual_time" },
                { data: "instr_time" },
                { data: "landings_day" },
                { data: "landings_night" },
                { data: "sim_type" },
                { data: "sim_time" },
                { data: "pic_name" },
                { data: "remarks" }
            ],
            columnDefs: [
                { targets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20], className: "dt-body-center" },
                { targets: [0], width: "1%" }, //date
                { targets: [1, 2, 3, 4], width: "4%" }, //places
                { targets: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20], width: "3%" }, //time
                { targets: [5, 6, 19], width: "4%" }, //aircraft
                { targets: [17, 18], width: "3%" }, //landings
                { targets: [21], width: "9%" }, //pic
            ],
        });
    }

    /**
     * Clears the table data and displays an info message.
     */
    const clearTable = () => {
        table_data = [];
        table.clear();
        table.rows.add(table_data).draw();

        commonUtils.showInfoMessage(`Table cleared`);
    }

    /**
     * Creates a backup, for sqlite db only
     */
    const createBackup = async () => {
        const payload = {};
        const api = await commonUtils.getApi("ImportCreateBackup");
        const data = await commonUtils.postRequest(api, payload);
        if (data.ok) {
            commonUtils.showInfoMessage(data.message);
        } else {
            commonUtils.showErrorMessage(data.message);
        }
    }

    /**
     * Fills the select options with the provided array of options.
     * @param {Array} options - The array of options to populate the select elements with.
     */
    const fillSelectOptions = (options) => {
        const elements = document.querySelectorAll("#mapFieldsModal select");
        for (let i = 0, element; element = elements[i++];) {
            // reset all options
            element.length = 0;
            const chooseOneOption = document.createElement("option");
            chooseOneOption.text = "Select one...";
            chooseOneOption.value = "-1";
            element.add(chooseOneOption);

            options.forEach(function (item, index) {
                const elementOption = document.createElement("option");
                elementOption.text = item;
                elementOption.value = index;
                element.add(elementOption);
            });
        }
    }

    /**
     * Parses a CSV file 
     */
    const parseCSV = () => {
        const csv_file = document.getElementById("csv_file");
        const file = csv_file.files[0];

        Papa.parse(file, {
            complete: function (results) {
                if (results.errors.length) {
                    commonUtils.showErrorMessage('csv parsing error: ' + results.errors[0].message);
                }
                else {
                    fillSelectOptions(results.data[0]);

                    csv_import = results;
                    const mapFieldsModal = new bootstrap.Modal(document.getElementById('mapFieldsModal'), {})
                    mapFieldsModal.show();
                }
            }
        });
    }

    /**
     * Loads a CSV profile based on the given profile name.
     * @param {string} profileName - The name of the profile to load.
     */
    const loadCSVProfile = (profileName) => {
        if (profileName === "WebLogbook") {
            loadCSVProfileWebLogbook();
        }
    }

    /**
     * Retrieves the index of a header with the given name from the CSV import data.
     * @param {string} name - The name of the header to search for.
     * @returns {string} - The index of the header, or "-1" if not found.
     */
    const getHeaderId = (name) => {
        let id = "-1";

        if (csv_import !== null) {
            if (csv_import.data.length > 0) {
                csv_import.data[0].forEach(function (item, index) {
                    if (item === name) {
                        id = index.toString();
                    }
                });
            }
        }

        return id;
    }

    /**
     * Loads standard CSV profile for Web Logbook CSV export.
     */
    const loadCSVProfileWebLogbook = () => {
        commonUtils.setElementValue("date", getHeaderId("Date"));
        commonUtils.setElementValue("departure_place", getHeaderId("Departure Place"));
        commonUtils.setElementValue("departure_time", getHeaderId("Departure Time"));
        commonUtils.setElementValue("arrival_place", getHeaderId("Arrival Place"));
        commonUtils.setElementValue("arrival_time", getHeaderId("Arrival Time"));
        commonUtils.setElementValue("aircraft_model", getHeaderId("Aircraft Model"));
        commonUtils.setElementValue("aircraft_reg", getHeaderId("Aircraft Reg"));
        commonUtils.setElementValue("se_time", getHeaderId("Time SE"));
        commonUtils.setElementValue("me_time", getHeaderId("Time ME"));
        commonUtils.setElementValue("mcc_time", getHeaderId("Time MCC"));
        commonUtils.setElementValue("total_time", getHeaderId("Time Total"));
        commonUtils.setElementValue("landings_day", getHeaderId("Landings Day"));
        commonUtils.setElementValue("landings_night", getHeaderId("Landings Night"));
        commonUtils.setElementValue("night_time", getHeaderId("Time Night"));
        commonUtils.setElementValue("ifr_time", getHeaderId("Time IFR"));
        commonUtils.setElementValue("pic_time", getHeaderId("Time PIC"));
        commonUtils.setElementValue("sic_time", getHeaderId("Time CoPilot"));
        commonUtils.setElementValue("dual_time", getHeaderId("Time Dual"));
        commonUtils.setElementValue("instr_time", getHeaderId("Time Instructor"));
        commonUtils.setElementValue("sim_type", getHeaderId("SIM Type"));
        commonUtils.setElementValue("sim_time", getHeaderId("SIM Time"));
        commonUtils.setElementValue("pic_name", getHeaderId("PIC Name"));
        commonUtils.setElementValue("remarks", getHeaderId("Remarks"));
    }

    /**
     * Retrieves the mapped value from an array based on the selected ID.
     *
     * @param {string} name - The name of the HTML element.
     * @param {Array} arr - The array containing the mapped values.
     * @returns {string} - The mapped value corresponding to the selected ID, or an empty string if the ID is -1.
     */
    const getMappedValue = (name, arr) => {
        const id = document.getElementById(name).value;
        if (id === "-1") {
            return "";
        } else {
            return arr[id];
        }
    }

    /**
     * Automatic time format recognition for departures and arrivals
     * @param {string} time - The time value to be recognized and formatted.
     * @returns {string} - The recognized and formatted time value.
     */
    const autoTimeRecog = (time) => {
        if (time === "") {
            return "";
        }
        time = time.replace(/[^0-9]/g, '').padStart(4, '0');
        return time;
    }

    /**
     * Converts a date string to "DD/MM/YYYY".
     *
     * @param {string} dateString - The date string to be converted.
     * @returns {string} The converted date string in the format "DD/MM/YYYY".
     */
    const convertToDDMMYYYY = (dateString) => {
        // Split the input date string
        const parts = dateString.split('/');

        // Extract day, month, and year from the split parts
        const day = parts[0].padStart(2, '0'); // Pad with leading zero if needed
        const month = parts[1].padStart(2, '0'); // Pad with leading zero if needed
        const year = parts[2];

        // Return the formatted date
        return `${day}/${month}/${year}`;
    }

    /**
     * Preview data for import table
     */
    const previewImport = () => {
        table_data = [];

        for (let i = 1; i < csv_import.data.length - 1; i++) {
            const item = {
                date: convertToDDMMYYYY(getMappedValue("date", csv_import.data[i]).replace(/[.]/g, '/')),
                departure_place: getMappedValue("departure_place", csv_import.data[i]),
                departure_time: autoTimeRecog(getMappedValue("departure_time", csv_import.data[i])),
                arrival_place: getMappedValue("arrival_place", csv_import.data[i]),
                arrival_time: autoTimeRecog(getMappedValue("arrival_time", csv_import.data[i])),
                aircraft_model: getMappedValue("aircraft_model", csv_import.data[i]),
                aircraft_reg: getMappedValue("aircraft_reg", csv_import.data[i]),
                se_time: getMappedValue("se_time", csv_import.data[i]),
                me_time: getMappedValue("me_time", csv_import.data[i]),
                mcc_time: getMappedValue("mcc_time", csv_import.data[i]),
                total_time: getMappedValue("total_time", csv_import.data[i]),
                night_time: getMappedValue("night_time", csv_import.data[i]),
                ifr_time: getMappedValue("ifr_time", csv_import.data[i]),
                pic_time: getMappedValue("pic_time", csv_import.data[i]),
                sic_time: getMappedValue("sic_time", csv_import.data[i]),
                dual_time: getMappedValue("dual_time", csv_import.data[i]),
                instr_time: getMappedValue("instr_time", csv_import.data[i]),
                landings_day: commonUtils.formatLandings(getMappedValue("landings_day", csv_import.data[i])),
                landings_night: commonUtils.formatLandings(getMappedValue("landings_night", csv_import.data[i])),
                sim_type: getMappedValue("sim_type", csv_import.data[i]),
                sim_time: getMappedValue("sim_time", csv_import.data[i]),
                pic_name: getMappedValue("pic_name", csv_import.data[i]),
                remarks: getMappedValue("remarks", csv_import.data[i])
            };

            table_data.push(item);
        }

        table.clear();
        table.rows.add(table_data).draw();

        commonUtils.showInfoMessage(`Loaded ${table_data.length} rows`);
    }

    /**
     * Run import
     */
    const importData = async () => {
        if (table_data.length === 0) {
            commonUtils.showInfoMessage("Nothing to import");
            return;
        }

        startImportStatus();

        let frs = [];
        for (let i = 0; i < table_data.length; i++) {
            const item = table_data[i];
            frs.push(marshallItem(item));
        };

        const payload = {
            recalculate_night_time: document.getElementById("recalculate_night_time").checked,
            data: frs,
        }

        const api = await commonUtils.getApi("ImportRun");
        const data = await commonUtils.postRequest(api, payload);
        if (data.ok) {
            clearTable();
            commonUtils.showInfoMessage(data.message);
        } else {
            const err_data = JSON.parse(data.data);

            table_data = [];
            for (var i = 0; i < err_data.length; i++) {
                const item = err_data[i];
                table_data.push(unmarshallItem(item));
            };
            table.clear();
            table.rows.add(table_data).draw();

            commonUtils.showErrorMessage(data.message);
        }

        stopImportStatus();
    }

    /**
     * Updates the import status by showing a spinner and disabling the import button.
     */
    const startImportStatus = () => {
        document.getElementById("spinner").classList.remove("d-none");
        document.getElementById("btn_import").disabled = true;
    }

    /**
     * Stops the import status by hiding the spinner and enabling the import button.
     */
    const stopImportStatus = () => {
        document.getElementById("spinner").classList.add("d-none");
        document.getElementById("btn_import").disabled = false;
    }

    /**
     * Converts an item to an app format.
     * @param {Object} item - The item to be converted.
     * @returns {Object} The converted item.
     */
    const marshallItem = (item) => {
        const converted_item = {
            uuid: "",
            date: item["date"],
            departure: {
                place: item["departure_place"],
                time: item["departure_time"]
            },
            arrival: {
                place: item["arrival_place"],
                time: item["arrival_time"]
            },
            aircraft: {
                model: item["aircraft_model"],
                reg_name: item["aircraft_reg"]
            },
            time: {
                se_time: item["se_time"],
                me_time: item["me_time"],
                mcc_time: item["mcc_time"],
                total_time: item["total_time"],
                night_time: item["night_time"],
                ifr_time: item["ifr_time"],
                pic_time: item["pic_time"],
                co_pilot_time: item["sic_time"],
                dual_time: item["dual_time"],
                instructor_time: item["instr_time"]
            },
            landings: {
                day: item["landings_day"],
                night: item["landings_night"]
            },
            sim: {
                type: item["sim_type"],
                time: item["sim_time"]
            },
            pic_name: item["pic_name"],
            remarks: item["remarks"]
        };

        return converted_item;
    }

    /**
     * Converts an item from app format to the simple one
     * @param {Object} item - The item to be converted.
     * @returns {Object} - The converted item.
     */
    const unmarshallItem = (item) => {
        const converted_item = {
            date: item["date"],
            departure_place: item["departure"]["place"],
            departure_time: item["departure"]["time"],
            arrival_place: item["arrival"]["place"],
            arrival_time: item["arrival"]["time"],
            aircraft_model: item["aircraft"]["model"],
            aircraft_reg: item["aircraft"]["reg_name"],
            se_time: item["time"]["se_time"],
            me_time: item["time"]["me_time"],
            mcc_time: item["time"]["mcc_time"],
            total_time: item["time"]["total_time"],
            night_time: item["time"]["night_time"],
            ifr_time: item["time"]["ifr_time"],
            pic_time: item["time"]["pic_time"],
            sic_time: item["time"]["co_pilot_time"],
            dual_time: item["time"]["dual_time"],
            instr_time: item["time"]["instructor_time"],
            landings_day: item["landings"]["day"],
            landings_night: item["landings"]["night"],
            sim_type: item["sim"]["type"],
            sim_time: item["sim"]["time"],
            pic_name: item["pic_name"],
            remarks: item["remarks"]
        };

        return converted_item;
    }

    const assignEventListeners = () => {
        document.getElementById("btn_clear_table").addEventListener("click", () => { clearTable(); });
        document.getElementById("btn_create_backup").addEventListener("click", () => { createBackup(); });
        document.getElementById("btn_import").addEventListener("click", () => { importData(); });
        document.getElementById("btn_load_profile").addEventListener("click", () => { loadCSVProfile("WebLogbook"); });
        document.getElementById("btn_preview_import").addEventListener("click", () => { previewImport(); });

        document.getElementById("csv_file").addEventListener("change", () => { parseCSV(); });
    }

    const initPage = async () => {
        assignEventListeners();
        initImportTable();
    }

    document.addEventListener("DOMContentLoaded", initPage);
}();