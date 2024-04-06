"use strict";

const commonUtils = function () {

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

    return {
        fetchJSON,
        showMessage, showInfoMessage, showErrorMessage
    };
}();