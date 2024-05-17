"use strict";

const settingsUtils = function () {
    let airports_custom = null;
    let airports_db = undefined;
    let airportDBReloaded = false;

    /**
     * Displays the airports database modal and initializes the DataTable.
     * If the DataTable has not been initialized yet, it fetches the airport data from the API and initializes the DataTable.
     * If the DataTable has already been initialized and the airport database has been reloaded, it reloads the DataTable.
     */
    const showAirportsDB = async () => {
        const airportDBModal = new bootstrap.Modal(document.getElementById('airportDB'), {});
        await airportDBModal.show();

        if (!airports_db) {
            const api = await commonUtils.getApi("AirportStandardData");
            airports_db = $('#airports_db').DataTable({
                ordering: true,
                scrollX: true,
                bLengthChange: false,
                ajax: api,
                lengthMenu: [[20], [20]],
                columnDefs: [
                    { targets: [5, 6, 7], className: "dt-body-center" },
                    { targets: [0], width: "10%" },
                    { targets: [1], width: "10%" },
                    { targets: [2], width: "30%" },
                    { targets: [3], width: "10%" },
                    { targets: [4], width: "19%" },
                    {
                        targets: [0, 2], render: function (data, type, row) {
                            if (data.length > 25) {
                                const txt = data.substr(0, 25) + '…'
                                return `<span data-bs-toggle="tooltip" data-bs-placement="bottom" title="${commonUtils.escapeHtml(data)}">${commonUtils.escapeHtml(txt)}</span>`;
                            } else {
                                return data;
                            }
                        }
                    }
                ],
                rowCallback: function (row, data, index) {
                    $("td:eq(8)", row).html(`<span data-bs-toggle="tooltip" data-bs-placement="bottom" title="Copy data to Custom Airports"><i class="bi bi-copy" onclick="settingsUtils.copyAirportData('${data[0]}','${data[3]}','${data[4]}','${data[5]}','${data[6]}','${data[7]}');"></i></span>`);
                },
            });
        }

        if (airportDBReloaded) {
            airports_db.ajax.reload();
            airportDBReloaded = false;
        }
    }

    const updateAirportsSettings = async () => {
        const payload = {
            airports_db_source: document.getElementById("airports_db_source").value,
            no_icao_filter: document.getElementById("no_icao_filter").checked,
        };

        const api = await commonUtils.getApi("SettingsAirportDB");
        const data = await commonUtils.postRequest(api, payload);
        return data.ok;
    }

    /**
     * Updates the airports database.
     */
    const updateAirportsDB = async () => {
        // first update airports db source and no_icao_filter
        const settingsUpdated = await updateAirportsSettings();
        if (!settingsUpdated) {
            commonUtils.showErrorMessage("Error updating settings");
            return;
        }

        airportDBReloaded = true;

        startUpdateStatus();
        commonUtils.showInfoMessage("Updating...", false);

        const api = await commonUtils.getApi("AirportUpdate");
        const data = await commonUtils.fetchJSON(api);
        if (data.ok) {
            document.getElementById("airports").value = data.message + " airports";
            commonUtils.showInfoMessage("Airports DB has been updated");
        }
        else {
            commonUtils.showErrorMessage(data.message);
        }

        stopUpdateStatus();
    }

    /**
     * Shows the spinner and disabling the update button.
     */
    const startUpdateStatus = () => {
        document.getElementById("spinner").classList.remove("d-none");
        document.getElementById("btn_update").disabled = true;
    }

    /**
     * Hides the spinner and enabling the update button.
     */
    const stopUpdateStatus = () => {
        document.getElementById("spinner").classList.add("d-none");
        document.getElementById("btn_update").disabled = false;
    }

    /**
     * Initializes the custom airports table.
     */
    const initCustomAirportsTable = async () => {
        airports_custom = $('#airports_custom').DataTable({
            ordering: true,
            scrollX: true,
            lengthMenu: [[15, 30, -1], [15, 30, "All"]],
            columnDefs: [
                { targets: [3, 4, 5], className: "dt-body-center" },
                { targets: [0], width: "15%" },
                { targets: [1], width: "15%" },
                { targets: [2], width: "15%" },
                { targets: [3], width: "15%" },
                { targets: [4], width: "20%" },
                { targets: [5], width: "20%" },
            ],
            rowCallback: function (row, data, index) {
                $("td:eq(6)", row).html(`<i class="bi bi-trash" onclick="settingsUtils.removeCustomAirport('${data[0]}');"></i>`);
            },
        });

        await reloadCustomAirports();
    }

    /**
     * Reloads the custom airports data.
     */
    const reloadCustomAirports = async () => {
        const api = await commonUtils.getApi("AirportCustomData");
        const data = await commonUtils.fetchJSON(api);
        airports_custom.clear();
        if (data["data"] !== null) {
            airports_custom.rows.add(data["data"]).draw();
        } else {
            airports_custom.rows.add([]).draw();
        }
    }

    /**
     * Clears the custom airport fields.
     */
    const clearCustomAirportFields = () => {
        const clear = function (field) {
            field.value = "";
            field.classList.remove("is-invalid");
            field.classList.remove("is-valid");
        };

        clear(document.getElementById("airport_name"));
        clear(document.getElementById("airport_city"));
        clear(document.getElementById("airport_country"));
        clear(document.getElementById("airport_elevation"));
        clear(document.getElementById("airport_lat"));
        clear(document.getElementById("airport_lon"));
    }

    /**
     * Validates the custom airport fields.
     * @param {HTMLInputElement} field - The input field to validate.
     * @returns {boolean} - Returns true if the field is valid, false otherwise.
     */
    const validateAirportFieldsN = (field) => {
        if (field.value === "" || isNaN(field.value)) {
            return commonUtils.updateFieldValidity(field, false);
        }
        return commonUtils.updateFieldValidity(field, true);
    }

    /**
     * Validates the custom airport fields.
     * @returns {boolean} Returns true if all fields are valid, otherwise false.
     */
    const validateCustomAirportFields = () => {
        const fields = [
            { name: "airport_name", validator: commonUtils.validateRequiredField, error: "Airport Name cannot be empty\r\n" },
            { name: "airport_elevation", validator: validateAirportFieldsN, error: "Airport Elevation should be a number\r\n" },
            { name: "airport_lat", validator: validateAirportFieldsN, error: "Airport Latitude should be a number\r\n" },
            { name: "airport_lon", validator: validateAirportFieldsN, error: "Airport Longtitude should be a number\r\n" },
        ]
        const errorMessage = commonUtils.validateFields(fields);

        const isValid = errorMessage === "";
        if (!isValid) {
            commonUtils.showErrorMessage(errorMessage);
        }
        return isValid;
    }

    /**
     * Adds a custom airport 
     */
    const addCustomAirport = async () => {
        if (!validateCustomAirportFields()) {
            return;
        }

        const payload = {
            name: airport_name.value.trim(),
            city: document.getElementById("airport_city").value,
            country: document.getElementById("airport_country").value,
            elevation: parseFloat(airport_elevation.value),
            lat: parseFloat(airport_lat.value),
            lon: parseFloat(airport_lon.value),
        };

        const api = await commonUtils.getApi("AirportAddCustom");
        const data = await commonUtils.postRequest(api, payload);
        if (data.ok) {
            commonUtils.showInfoMessage(data.message);
            // reload the table and clear the fields
            reloadCustomAirports();
            clearCustomAirportFields();
        } else {
            commonUtils.showErrorMessage(data.message);
        }
    }

    /**
     * Removes a custom airport from the server.
     * @param {string} airport_name - The name of the airport to be removed.
     */
    const removeCustomAirport = async (airport_name) => {
        const payload = {
            name: airport_name,
        };

        const api = await commonUtils.getApi("AirportDeleteCustom");
        const data = await commonUtils.postRequest(api, payload);
        if (data.ok) {
            commonUtils.showInfoMessage(data.message);
            // reload the table and clear the fields
            reloadCustomAirports();
        } else {
            commonUtils.showErrorMessage(data.message);
        }
    }

    /**
     * Copies airport data to the corresponding input fields.
     * @param {string} name - The name of the airport.
     * @param {string} city - The city where the airport is located.
     * @param {string} country - The country where the airport is located.
     * @param {number} elevation - The elevation of the airport.
     * @param {number} lat - The latitude of the airport.
     * @param {number} lon - The longitude of the airport.
     */
    const copyAirportData = (name, city, country, elevation, lat, lon) => {
        commonUtils.setElementValue("airport_name", name);
        commonUtils.setElementValue("airport_city", city);
        commonUtils.setElementValue("airport_country", country);
        commonUtils.setElementValue("airport_elevation", elevation);
        commonUtils.setElementValue("airport_lat", lat);
        commonUtils.setElementValue("airport_lon", lon);
    }

    /**
     * Assigns event listeners to various elements in the web page.
     */
    const assignEventListeners = () => {
        document.getElementById("btn_show_db").addEventListener("click", () => { showAirportsDB(); });
        document.getElementById("btn_update").addEventListener("click", () => { updateAirportsDB(); });
        document.getElementById("btn_add_airport").addEventListener("click", () => { addCustomAirport(); });
    }

    /**
     * Initializes the page by assigning event listeners, initializing the custom airports table,
     * initializing the signature, and reloading the aircraft classes table.
     */
    const initPage = async () => {
        assignEventListeners();
        await initCustomAirportsTable();
    }

    document.addEventListener("DOMContentLoaded", initPage);

    return { removeCustomAirport, copyAirportData }
}();