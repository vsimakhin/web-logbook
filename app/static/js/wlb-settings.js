"use strict";

const settingsUtils = function () {
    const removeButton = '<i class="bi bi-trash" onclick="settingsUtils.removeClassesRow(this);" id="remove_row"></i>';
    const rowBody = `<tr><td contenteditable="true">CLASS_NAME</td><td contenteditable="true">TYPE_NAME</td><td>${removeButton}</td></tr>`;

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

    const validatePasswordField = (field) => {
        if (!field.value) {
            if (document.getElementById("previous_auth_value").value == "false") {
                return updateFieldValidity(field, false);
            }
        }
        return commonUtils.updateFieldValidity(field, true);
    }

    /**
     * Validates the coomon settings fields.
     */
    const validateFields = () => {
        const fields = [
            { name: "login", validator: commonUtils.validateRequiredField, error: "Login field is empty\r\n" },
            { name: "password", validator: validatePasswordField, error: "Password field is empty\r\n" },
        ]
        const errorMessage = commonUtils.validateFields(fields);

        const isValid = errorMessage === "";
        if (!isValid) {
            commonUtils.showErrorMessage(errorMessage);
        }
        return isValid;
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

        let color_scheme = 0;
        if (document.getElementById("color_scheme_radio2").checked) {
            color_scheme = 1;
        } else if (document.getElementById("color_scheme_radio3").checked) {
            color_scheme = 2;
        }

        let sidebar_layout = 0;
        if (document.getElementById("sidebar_layout_radio2").checked) {
            sidebar_layout = 1;
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
            airports_db_source: document.getElementById("airports_db_source").value,
            no_icao_filter: document.getElementById("no_icao_filter").checked,
            color_scheme: color_scheme,
            sidebar_layout: sidebar_layout,
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

    }

    /**
     * Initializes the page by assigning event listeners, initializing the custom airports table,
     * initializing the signature, and reloading the aircraft classes table.
     */
    const initPage = async () => {
        assignEventListeners();
        await initSignature();
        await reloadAircraftClassesTable();
    }

    document.addEventListener("DOMContentLoaded", initPage);

    return { removeClassesRow }
}();