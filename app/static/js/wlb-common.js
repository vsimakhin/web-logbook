"use strict";

const commonUtils = function () {
    let api = {};
    let preferences = {};

    /**
     * Fetches data from the API and caches it for future use.
     * @param {string} apiItem - The API item to fetch.
     * @returns {Promise<any>} - A promise that resolves to the fetched API data.
     */
    const getApi = async (apiItem) => {
        if (!api.hasOwnProperty(apiItem)) {
            const result = await fetchJSON(`/api/${apiItem}`);
            if (!result) {
                console.error(`Error fetching API ${apiItem}.`);
                return "";
            }
            api[apiItem] = result;
        }
        return api[apiItem];
    }

    /**
     * Retrieves the preferences/settings for the app.
     * @param {string} item - The preference item to retrieve.
     * @returns {Promise<any>} - A promise that resolves to the value of the preference item, or null if it fails.
     */
    const getPreferences = async (item) => {
        if (!preferences.hasOwnProperty(item)) {
            try {
                preferences = await fetchJSON("/preferences");
            } catch (error) {
                console.error(`Failed to get preferences: ${error}`);
                return null;
            }
        }
        return preferences[item] || null;
    }

    /**
     * Fetches JSON data from the specified URL.
     * @param {string} url - The URL to fetch JSON data from.
     * @returns {Promise<Object>} - A promise that resolves to the JSON data.
     */
    const fetchJSON = async (url) => {
        const options = {
            method: "GET",
            mode: "same-origin",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return {};
            }
            const json = await response.json();
            return json || {};
        } catch (error) {
            console.error(`Error fetching ${url} - ${error}`);
            return {};
        }
    }

    /**
     * Displays a toast message with the specified type and message.
     * @param {string} type - The type of the message. Can be "error" or any other value for info message.
     * @param {string} message - The message to be displayed in the toast.
     */
    const showMessage = (type, message) => {
        const toast = document.getElementById("toast");
        if (!toast) {
            console.error("Cannot initialize toast message. Element not found.");
            return;
        }

        // set message
        const toastMessage = document.getElementById("toast-message");
        toastMessage.innerText = message;

        // set message type - info or error
        const toastType = document.getElementById("toast-type");
        if (type === "error") {
            toastType.classList.remove("text-success");
            toastType.classList.add("text-danger");
            toastType.innerText = "Error";

            toastMessage.classList.add("text-danger");
        } else {
            toastType.classList.remove("text-danger");
            toastType.classList.add("text-success");
            toastType.innerText = "Info";

            toastMessage.classList.remove("text-danger");
        }

        // show toast
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast);
        toastBootstrap.show();
    }

    /**
     * Displays an information message.
     * @param {string} message - The message to be displayed.
     */
    const showInfoMessage = (message) => {
        showMessage("info", message);
    }

    /**
     * Displays an error message.
     * @param {string} message - The message to be displayed.
     */
    const showErrorMessage = (message) => {
        showMessage("error", message);
    }

    /**
     * Runs the export process for the specified format.
     * @param {string} format - The format to export (e.g., "pdf", "csv").
     * @returns {Promise<void>} - A promise that resolves when the export process is complete.
     */
    const runExport = async (format) => {
        const api = await getApi("Export");
        window.open(`${api}/${format}`, "_blank");
    }

    /**
     * Escapes special characters in a string to prevent HTML injection.
     * @param {string} unsafe - The string to escape.
     * @returns {string} The escaped string.
     */
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Formats the value of landings.
     * @param {string} value - The value to be formatted.
     * @returns {number} - The formatted value of landings.
     */
    const formatLandings = (value) => {
        return value === "" ? 0 : parseInt(value);
    }

    /**
     * Converts a number to a time format (HH:MM).
     * @param {number} number - The number to convert.
     * @returns {string} The time in the format HH:MM.
     */
    const convertNumberToTime = (number) => {
        var hours = Math.floor(number);
        var minutes = Math.round((number - hours) * 60);
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (minutes === 60) {
            hours = hours + 1;
            minutes = "00";
        }
        return hours + ":" + minutes;
    }

    /**
     * Converts a time value to a numeric representation in hours.
     * @param {number|string} time - The time value to convert. Can be a number or a string in the format "HH:MM".
     * @returns {number} The time value converted to a numeric representation in hours.
     */
    const convertTime = (time) => {
        if (typeof time === "number") {
            return time
        }

        if (time === "") {
            return 0;
        }

        if (!time.includes(":")) {
            return parseInt(time.replace(" ", "")); // already converted
        }

        var hoursMinutes = time.split(/[.:]/);
        var hours = parseInt(hoursMinutes[0], 10);
        var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;

        return hours + minutes / 60;
    }

    /**
     * Retrieves the value of an element with the specified ID.
     * @param {string} elementId - The ID of the element to retrieve the value from.
     * @returns {string} The value of the element, or an empty string if the element is not found.
     */
    const getElementValue = (elementId) => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with ID ${elementId} not found.`);
            return "";
        }
        return element.value;
    }

    /**
     * Sets the value of an element with the specified ID.
     * @param {string} elementId - The ID of the element.
     * @param {string} value - The value to set.
     */
    const setElementValue = (elementId, value) => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with ID ${elementId} not found.`);
            return;
        }
        element.value = value;
    }

    /**
     * Returns standard request options for a POST request with the given payload.
     * @param {Object} payload - The payload to be sent with the request.
     * @returns {Object} - The options object for the POST request.
     */
    const getRequestOption = (payload) => {
        return {
            method: "post",
            mode: "same-origin",
            credentials: "same-origin",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    }

    /**
     * Sends a POST request to the specified URL with the given payload.
     * @param {string} url - The URL to send the request to.
     * @param {object} payload - The payload to include in the request body.
     * @returns {Promise<object>} - A promise that resolves to the JSON response from the server.
     */
    const postRequest = async (url, payload) => {
        const options = {
            method: "POST",
            mode: "same-origin",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return {};
            }
            const json = await response.json();
            return json || {};
        } catch (error) {
            console.error(`Error fetching ${url} - ${error}`);
            return {};
        }
    }

    /**
     * Updates the validity state of a field element and applies corresponding CSS classes.
     * @param {HTMLElement} field - The field element to update.
     * @param {boolean} isValid - The validity state of the field.
     * @returns {boolean} - The updated validity state of the field.
     */
    const updateFieldValidity = (field, isValid) => {
        if (isValid) {
            field.classList.remove("is-invalid");
        }
        else {
            field.classList.remove("is-valid");
            field.classList.add("is-invalid");
        }

        return isValid;
    }

    /**
     * Validates a field using a custom validator function and returns an error message if validation fails.
     * @param {string} fieldId - The ID of the field to validate.
     * @param {function} validator - The validator function to use for validation.
     * @param {string} errorMessage - The error message to return if validation fails.
     * @returns {string} - The error message if validation fails, otherwise an empty string.
     */
    const validateField = (fieldId, validator, errorMessage) => {
        const field = document.getElementById(fieldId);
        if (!validator(field)) {
            return errorMessage;
        }
        return "";
    }

    /**
     * Validates an array of fields.
     * @param {Array} fields - The array of fields to validate.
     * @example 
     * const fields = [
     *   { name: "category", validator: commonUtils.validateRequiredField, error: "Category cannot be empty\r\n" },
     *   { name: "name", validator: commonUtils.validateRequiredField, error: "Name cannot be empty\r\n" },
     * ]
     * @returns {string} - The error message if any of the fields fail validation, otherwise an empty string.
     */
    const validateFields = (fields) => {
        let errorMessage = "";
        fields.forEach(field => {
            errorMessage += commonUtils.validateField(field.name, field.validator, field.error);
        });
        return errorMessage;
    }

    /**
     * Capitalizes the first letter of each word in a string.
     * @param {string} str - The input string.
     * @returns {string} The modified string with capitalized words.
     */
    const capitalizeWords = (str) => {
        return str.replace('_', ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    /**
     * Validates a required field.
     * @param {HTMLInputElement} field - The input field to validate.
     * @returns {boolean} - Returns true if the field is valid, false otherwise.
     */
    const validateRequiredField = (field) => {
        if (!field.value) {
            return updateFieldValidity(field, false);
        }
        return updateFieldValidity(field, true);
    }

    return {
        fetchJSON, getApi, getPreferences,
        showMessage, showInfoMessage, showErrorMessage,
        runExport, escapeHtml, formatLandings, convertNumberToTime, convertTime,
        getElementValue, setElementValue,
        getRequestOption, postRequest,
        updateFieldValidity, validateField, capitalizeWords, validateRequiredField, validateFields
    };

}();
