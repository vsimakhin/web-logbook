"use strict";

const commonUtils = function () {
    let api = {};

    /**
     * Fetches data from the API and caches it for future use.
     * @param {string} apiItem - The API item to fetch.
     * @returns {Promise<any>} - A promise that resolves to the fetched API data.
     */
    const getApi = async (apiItem) => {
        if (!api.hasOwnProperty(apiItem)) {
            const json = await fetchJSON(`/api/${apiItem}`);
            if (!json || !json.hasOwnProperty("data")) {
                console.error(`Error fetching API ${apiItem}.`);
                return "";
            }
            api[apiItem] = json.data;
        }
        return api[apiItem];
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

    return {
        fetchJSON, getApi,
        showMessage, showInfoMessage, showErrorMessage,
        runExport, escapeHtml, formatLandings, convertNumberToTime, convertTime
    };
}();