"use strict";

const licenseRecordUtils = function () {

    /**
     * Validates a date field.
     * @param {HTMLInputElement} field - The date field to validate.
     * @returns {boolean} - Returns true if the field value is a valid date, otherwise false.
     */
    const validateDate = (field) => {
        if (field.value !== "") {
            if (!/^(0?[1-9]|[12][0-9]|3[01])[- /.]((0?[1-9]|1[012])[- /.](19|20)?[0-9]{2})*$/.test(field.value)) {
                return commonUtils.updateFieldValidity(field, false);
            }
        }
        return commonUtils.updateFieldValidity(field, true);
    }

    /**
     * Validates the fields in the license record form.
     * @returns {boolean} Returns true if all fields are valid, otherwise false.
     */
    const validateFields = () => {
        const fields = [
            { name: "category", validator: commonUtils.validateRequiredField, error: "Category cannot be empty\r\n" },
            { name: "name", validator: commonUtils.validateRequiredField, error: "Name cannot be empty\r\n" },
            { name: "issued", validator: validateDate, error: "Issued date should be in DD/MM/YYYY format or empty\r\n" },
            { name: "valid_from", validator: validateDate, error: "Valid From date should be in DD/MM/YYYY format or empty\r\n" },
            { name: "valid_until", validator: validateDate, error: "Valid Until date should be in DD/MM/YYYY format or empty\r\n" },
        ]
        const errorMessage = commonUtils.validateFields(fields);

        const isValid = errorMessage === "";
        if (!isValid) {
            commonUtils.showErrorMessage(errorMessage);
        }
        return isValid;
    }

    /**
     * Saves the license record by sending a POST request to the server.
     * @param {Event} e - The event object.
     * @returns {Promise<void>} - A promise that resolves when the license record is saved successfully.
     */
    const saveLicense = async (e) => {
        if (!validateFields()) {
            return;
        }

        const payload = new FormData(document.getElementById("licensing"));
        const api = commonUtils.getApi("LicensingSave");
        const requestOptions = {
            method: "post",
            mode: "same-origin",
            credentials: "same-origin",
            body: payload,
        }

        const response = await fetch(api, requestOptions);
        const data = await response.json();

        if (data.ok) {
            commonUtils.showInfoMessage(data.message);
            if (typeof data.redirect_url !== 'undefined') {
                location.href = data.redirect_url;
            }
        } else {
            commonUtils.showErrorMessage(data.message);
        }
    }

    /**
     * Deletes a license.
     * @returns {Promise<void>} - A promise that resolves when the license is deleted.
     */
    const deleteLicense = async () => {
        const payload = { uuid: document.getElementById("uuid").value }
        const api = commonUtils.getApi("LicensingDelete");
        const data = await commonUtils.postRequest(api, payload);
        if (data.ok) {
            commonUtils.showInfoMessage(data.message);
            if (typeof data.redirect_url !== 'undefined') {
                location.href = data.redirect_url;
            }
        } else {
            commonUtils.showErrorMessage(data.message);
        }
    }

    /**
     * Deletes an attachment using the provided UUID.
     */
    const deleteAttachment = async () => {
        const payload = { uuid: document.getElementById("uuid").value }
        const api = commonUtils.getApi("LicensingAttachmentDelete");
        const data = await commonUtils.postRequest(api, payload);
        if (data.ok) {
            commonUtils.showInfoMessage(data.message);
            if (typeof data.redirect_url !== 'undefined') {
                location.href = data.redirect_url;
            }
        } else {
            commonUtils.showErrorMessage(data.message);
        }
    }

    /**
     * Initializes a date picker for the specified input field.
     * @param {string} name - The name of the input field.
     * @param {number} firstDay - The first day of the week (0-6, where 0 is Sunday).
     */
    const initDatePicker = (name, firstDay) => {
        const input = $(`input[name="${name}"]`);

        input.daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            locale: {
                format: "DD/MM/YYYY",
                firstDay: parseInt(firstDay) || 0,
            },
            autoUpdateInput: false,
            autoApply: true,
        }, function (start, end, label) {
            $(this).val(start.format("DD/MM/YYYY"));
        });

        input.on('apply.daterangepicker', function (ev, picker) {
            $(this).val(picker.startDate.format("DD/MM/YYYY"));
        });

        input.on("cancel.daterangepicker", function (ev, picker) {
            $(this).val('');
        });
    }

    /**
     * Initializes date pickers for the specified fields.
     * @returns {Promise<void>} A promise that resolves when the date pickers are initialized.
     */
    const initDatePickers = async () => {
        const firstDay = commonUtils.getPreferences("daterange_picker_first_day");
        ["issued", "valid_from", "valid_until"].forEach(name => initDatePicker(name, firstDay));
    }

    /**
     * Assigns event listeners to the necessary elements.
     */
    const assignEventListeners = () => {
        document.getElementById("save_license").addEventListener("click", saveLicense);
    }

    /**
     * Initializes the page by assigning event listeners and initializing date pickers.
     */
    const initPage = () => {
        assignEventListeners();
        initDatePickers();
    }

    document.addEventListener("DOMContentLoaded", initPage);

    return { deleteLicense, deleteAttachment }
}();