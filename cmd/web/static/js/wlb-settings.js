"use strict";

const settingsUtils = function () {
    const removeButton = '<i class="bi bi-dash-square-fill" onclick="settingsUtils.removeClassesRow(this);" id="remove_row"></i>';
    const rowBody = `<tr><td contenteditable="true">CLASS_NAME</td><td contenteditable="true">TYPE_NAME</td><td>${removeButton}</td></tr>`;

    let airports_custom = null;
    let airports_db = undefined;
    let airportDBReloaded = false;

    // signature pad
    const canvas = document.getElementById("signature-pad");
    let signaturePad = null;

    /**
     * Resizes the canvas element based on the device pixel ratio and the offset width/height.
     */
    const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
    }

    /**
     * Initializes the signature pad and loads the signature.
     */
    const initSignature = async () => {
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgba(0,0,0,0)'
        });

        window.onresize = resizeCanvas;
        resizeCanvas();
        await loadSignature();
    }

    /**
     * Loads the signature image from preferences and sets it in the signature pad.
     */
    const loadSignature = async () => {
        const signatureImage = await commonUtils.getPreferences("signature_image");
        if (signatureImage !== "") {
            signaturePad.fromDataURL(signatureImage);
        }
    }

    /**
     * Clears the signature from the signature pad.
     */
    const clearSignature = () => {
        signaturePad.clear();
    }

    /**
     * Uploads a signature file and sets it as the source for a signature pad.
     */
    const uploadSignature = async () => {
        const sf = document.getElementById("signature_file");
        const file = sf.files[0],
            url = URL.createObjectURL(file);

        const res = await fetch(url);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            signaturePad.fromDataURL(reader.result);
        };
        reader.readAsDataURL(blob);
    }

    /**
     * Picks the signature color by triggering a click event on the element with the id "signature_color".
     */
    const pickSignatureColor = () => {
        document.getElementById("signature_color").click();
    }

    /**
     * Changes the signature color based on the value entered in the "signature_color" input field.
     */
    const changeSignatureColor = () => {
        function hexToRgb(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                return r + r + g + g + b + b;
            });

            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        const rgb_color = hexToRgb(document.getElementById("signature_color").value);
        signaturePad.penColor = `rgb(${rgb_color.r}, ${rgb_color.g}, ${rgb_color.b})`;
    }

    /**
     * Adds a new row to the aircraft class table.
     */
    const addNewClassesRow = () => {
        $('#aircraft_class').find('tbody').append(rowBody.replace("CLASS_NAME", "New Class Name").replace("TYPE_NAME", "Type1, Type2, Type3"));
    }

    /**
     * Removes the row from the aircraft class table.
     */
    const removeClassesRow = (obj) => {
        obj.closest("tr").remove();
    }

    /**
     * Removes an item from an array, helper function for reloadAircraftClassessTable().
     *
     * @param {Array} arr - The array from which to remove the item.
     * @param {any} value - The item to remove from the array.
     * @returns {Array} - The updated array after removing the item.
     */
    const removeArrayItem = (arr, value) => {
        const index = arr.indexOf(value);
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    }

    /**
     * Reloads the aircraft classes table with data
     */
    const reloadAircraftClassesTable = async () => {
        $('#aircraft_class').find('tbody').empty();

        const apiAircrafts = await commonUtils.getApi("Aircrafts");
        const aircrafts = await commonUtils.fetchJSON(apiAircrafts);
        let models_data = [];
        for (let item in aircrafts) {
            if (!models_data.includes(aircrafts[item])) {
                models_data.push(aircrafts[item]);
            }
        }

        const apiSettingsAircraftClasses = await commonUtils.getApi("SettingsAircraftClasses");
        const classes_data = await commonUtils.fetchJSON(apiSettingsAircraftClasses);

        for (let key of Object.keys(classes_data)) {
            $('#aircraft_class').find('tbody').append(rowBody.replace("CLASS_NAME", key).replace("TYPE_NAME", classes_data[key]));

            const tmp_models_data = [...models_data];

            for (let i = 0; i < tmp_models_data.length; i++) {
                if (classes_data[key].includes(tmp_models_data[i])) {
                    models_data = removeArrayItem(models_data, tmp_models_data[i]);
                }
            }
        }

        if (models_data.length > 0) {
            document.getElementById("without_classes").innerHTML = "<br>Aircraft models without classification: " + models_data;
        } else {
            document.getElementById("without_classes").innerHTML = "";
        }
    }

    /**
     * Displays the airports database modal and initializes the DataTable.
     * If the DataTable has not been initialized yet, it fetches the airport data from the API and initializes the DataTable.
     * If the DataTable has already been initialized and the airport database has been reloaded, it reloads the DataTable.
     */
    const showAirportsDB = async () => {
        const airportDBModal = new bootstrap.Modal(document.getElementById('airportDB'), {});

        if (!airports_db) {
            const api = await commonUtils.getApi("AirportStandardData");
            airports_db = $('#airports_db').DataTable({
                ordering: true,
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

        airportDBModal.show();
    }

    /**
     * Updates the airports database.
     */
    const updateAirportsDB = async () => {
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
                $("td:eq(6)", row).html(`<i class="bi bi-dash-square-fill" onclick="settingsUtils.removeCustomAirport('${data[0]}');"></i>`);
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
     * Validates the coomon settings fields.
     */
    const validateFields = () => {
        const fields = [
            { name: "login", validator: commonUtils.validateRequiredField, error: "Login field is empty\r\n" },
            { name: "password", validator: commonUtils.validateRequiredField, error: "Password field is empty\r\n" },
        ]
        const errorMessage = commonUtils.validateFields(fields);

        const isValid = errorMessage === "";
        if (!isValid) {
            commonUtils.showErrorMessage(errorMessage);
        }
        return isValid;
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
     * Saves the settings.
     * If authentication is enabled, it validates the fields before saving.
     * Reloads the aircraft classes table and displays success or error messages accordingly.
     */
    const saveSettings = async () => {
        if (document.getElementById("auth_enabled").checked && !validateFields()) {
            return;
        }

        const table = document.getElementById("aircraft_class");

        let aircraft_classes = {};
        for (let i = 0, row; row = table.rows[i]; i++) {
            const class_name = row.cells[0].innerText;
            const types = row.cells[1].innerText;

            if (class_name !== "Class Name") {
                aircraft_classes[class_name] = types
            }
        }

        // check signature
        let signatureImage = "";
        if (!signaturePad.isEmpty()) {
            signatureImage = signaturePad.toDataURL();
        }

        let time_fields_auto_format = 0;
        if (document.getElementById("time_field_format_radio2").checked) {
            time_fields_auto_format = 1;
        } else if (document.getElementById("time_field_format_radio3").checked) {
            time_fields_auto_format = 2;
        }

        const payload = {
            owner_name: document.getElementById("owner_name").value,
            license_number: document.getElementById("license_number").value,
            address: document.getElementById("address").value,
            signature_text: document.getElementById("signature_text").value,
            signature_image: signatureImage,
            aircraft_classes: aircraft_classes,
            auth_enabled: document.getElementById("auth_enabled").checked,
            login: document.getElementById("login").value,
            password: document.getElementById("password").value,
            disable_flightrecord_help: document.getElementById("disable_flightrecord_help").checked,
            disable_license_warning: document.getElementById("disable_license_warning").checked,
            hide_stats_fields: {
                hide_se: document.getElementById("hide_se").checked,
                hide_me: document.getElementById("hide_me").checked,
                hide_mcc: document.getElementById("hide_mcc").checked,
                hide_night: document.getElementById("hide_night").checked,
                hide_ifr: document.getElementById("hide_ifr").checked,
                hide_pic: document.getElementById("hide_pic").checked,
                hide_copilot: document.getElementById("hide_copilot").checked,
                hide_dual: document.getElementById("hide_dual").checked,
                hide_instructor: document.getElementById("hide_instructor").checked,
                hide_sim: document.getElementById("hide_sim").checked,
                hide_cc: document.getElementById("hide_cc").checked,
                hide_landings: document.getElementById("hide_landings").checked,
                hide_distance: document.getElementById("hide_distance").checked
            },
            stats_font_size: document.getElementById("stats_font").value,
            logbook_font_size: document.getElementById("logbook_font").value,
            logbook_rows: document.getElementById("logbook_rows").value,
            licensing_rows: document.getElementById("licensing_rows").value,
            datepicker_week: document.getElementById("datepicker_week").value,
            time_fields_auto_format: time_fields_auto_format,
            sync_options: {
                keep_deleted_records_days: parseInt(document.getElementById("keep_deleted_records_days").value)
            },
            airports_db_source: document.getElementById("airports_db_source").value,
            no_icao_filter: document.getElementById("no_icao_filter").checked,
        };


        const api = await commonUtils.getApi("Settings");
        const data = await commonUtils.postRequest(api, payload);
        if (data.ok) {
            reloadAircraftClassesTable();
            commonUtils.showInfoMessage(data.message);
            if (typeof data.redirect_url !== 'undefined') {
                location.href = data.redirect_url;
            }
        } else {
            commonUtils.showErrorMessage(data.message);
        }
    }

    /**
     * Assigns event listeners to various elements in the web page.
     */
    const assignEventListeners = () => {
        document.getElementById("btn_save_settings").addEventListener("click", () => { saveSettings(); });

        document.getElementById("signature_color").addEventListener("change", () => { changeSignatureColor(); });
        document.getElementById("signature_file").addEventListener("change", () => { uploadSignature(); });
        document.getElementById("pick_color").addEventListener("click", () => { pickSignatureColor(); });
        document.getElementById("clear_signature").addEventListener("click", () => { clearSignature(); });
        document.getElementById("upload_signature").addEventListener("click", () => { document.getElementById('signature_file').click(); });

        document.getElementById("add_row").addEventListener("click", () => { addNewClassesRow(); });

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
        await initSignature();
        await reloadAircraftClassesTable();
    }

    document.addEventListener("DOMContentLoaded", initPage);

    return { removeClassesRow, removeCustomAirport, copyAirportData }
}();