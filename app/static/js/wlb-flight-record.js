"use strict";

const flightRecordUtils = function () {
    let aircrafts = {};

    /**
     * Calculates the total time and night time based on the departure and arrival times.
     */
    const calculateTimes = async (e) => {
        const date = commonUtils.getElementValue("date");
        const departure_place = commonUtils.getElementValue("departure_place");
        const departure_time = commonUtils.getElementValue("departure_time");
        const arrival_place = commonUtils.getElementValue("arrival_place");
        const arrival_time = commonUtils.getElementValue("arrival_time");

        if ((departure_time.length == 4) && (arrival_time.length == 4) && (!isNaN(departure_time)) && (!isNaN(arrival_time))) {
            const start = [departure_time.substring(0, 2), departure_time.substring(2)];
            const end = [arrival_time.substring(0, 2), arrival_time.substring(2)];

            // total time
            const totalTime = calculateTotalTime(start, end);

            const oldTotalTime = commonUtils.getElementValue("total_time");
            commonUtils.setElementValue("total_time", totalTime);

            if (oldTotalTime !== "") {
                // Probably the total time was already set and now recalculated,
                // so we can go through the other time fields and update the time as well.
                // As a case - the flight record was copied and now the times are recalculated.
                const targetFields = ["se_time", "me_time", "mcc_time", "night_time", "ifr_time", "pic_time", "sic_time", "dual_time", "instr_time", "sim_time"];
                targetFields.forEach((field) => {
                    if (commonUtils.getElementValue(field) === oldTotalTime) {
                        commonUtils.setElementValue(field, totalTime);
                    }
                });
            }

            // night time
            if (date && departure_place && arrival_place) {
                const night_time = await calculateNightTime(date, departure_place, departure_time, arrival_place, arrival_time);
                commonUtils.setElementValue("night_time", night_time);
            }
        }
    }

    /**
     * Calculates the total time between two given times.
     * @param {number[]} start - An array representing the start time [hours, minutes].
     * @param {number[]} end - An array representing the end time [hours, minutes].
     * @returns {string} The total time in the format "HH:MM".
     */
    const calculateTotalTime = (start, end) => {
        const startDate = new Date(0, 0, 0, start[0], start[1], 0);
        const endDate = new Date(0, 0, 0, end[0], end[1], 0);
        let diff = endDate.getTime() - startDate.getTime();
        let hours = Math.floor(diff / 1000 / 60 / 60);
        diff -= hours * 1000 * 60 * 60;
        const minutes = Math.floor(diff / 1000 / 60);

        if (hours < 0) { hours += 24; }

        const totalTime = `${hours}:${String(minutes).padStart(2, '0')}`;
        return totalTime;
    }

    /**
     * Calculates the night time based on the given parameters.
     * @param {string} date - The date of the flight.
     * @param {string} departure_place - The departure place of the flight.
     * @param {string} departure_time - The departure time of the flight.
     * @param {string} arrival_place - The arrival place of the flight.
     * @param {string} arrival_time - The arrival time of the flight.
     * @returns {string} - The calculated night time in the format "HH:MM", or an empty string if the night time is zero or negative.
     */
    const calculateNightTime = async (date, departure_place, departure_time, arrival_place, arrival_time) => {
        const payload = {
            date: date,
            departure: {
                place: departure_place,
                time: departure_time
            },
            arrival: {
                place: arrival_place,
                time: arrival_time
            }
        };

        const api = await commonUtils.getApi("LogbookNight");
        const json = await commonUtils.postRequest(api, payload);

        if (json.ok) {
            const night_time = parseInt(json.data)
            if (night_time > 0) {
                const hours = Math.floor(night_time / 60);
                const minutes = night_time - (hours * 60);

                const time = `${hours}:${String(minutes).padStart(2, '0')}`;
                return time;
            } else {
                return "";
            }
        }
    }

    /**
     * Converts the value of the target element to uppercase.
     * @param {Event} e - The event object.
     */
    const convertToUpperCaseHandler = (e) => {
        e.currentTarget.value = e.currentTarget.value.toUpperCase();
    }

    /**
     * Handles the input event to skip letters and only allow numbers.
     * @param {Event} e - The input event object.
     */
    const skipLettersHandler = (e) => {
        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
    }

    /**
     * Copies the value of the "total_time" element to the current target element.
     * @param {Event} e - The event object.
     */
    const copyTotalTimeHandler = (e) => {
        e.currentTarget.value = commonUtils.getElementValue("total_time");
    }

    /**
     * Handles the change event for the aircraft registration input field.
     * Retrieves the aircraft model based on the selected registration and updates the corresponding input field.
     * @returns {Promise<void>} A promise that resolves when the aircraft model is updated.
     */
    const onRegChange = async () => {
        // check if aircrafts are not empty
        if (Object.keys(aircrafts).length === 0) {
            const api = await commonUtils.getApi("Aircrafts");
            aircrafts = await commonUtils.fetchJSON(api);
        }

        const aircraft_reg = commonUtils.getElementValue("aircraft_reg");
        for (var item in aircrafts) {
            if (item === aircraft_reg) {
                commonUtils.setElementValue("aircraft_model", aircrafts[item]);
                break;
            }
        }
    }

    const updateFlightRecordTitle = async () => {
        const departurePlace = commonUtils.getElementValue("departure_place");
        const arrivalPlace = commonUtils.getElementValue("arrival_place");
        const prevUuid = commonUtils.getElementValue("prev_uuid");
        const nextUuid = commonUtils.getElementValue("next_uuid");
        const url = await commonUtils.getApi("Logbook");

        // Construct the base caption
        let caption = "Flight Record";
        if (departurePlace && arrivalPlace) {
            caption += ` ${departurePlace} - ${arrivalPlace}`;
        }

        // Update the page title
        document.title = caption;

        // Construct navigation links if applicable
        const prevLink = prevUuid && prevUuid !== "0" ? ` <a href="${url}/${prevUuid}"><i class="bi bi-chevron-left"></i></a> ` : "";
        const nextLink = nextUuid && nextUuid !== "0" ? ` <a href="${url}/${nextUuid}"><i class="bi bi-chevron-right"></i></a>` : "";

        // Update the page header
        document.getElementById("page_header").innerHTML = caption + prevLink + nextLink;
    }
    /**
     * Handles the change event for the departure and arrival places.
     * Loads the flight map if both departure and arrival places are selected.
     */
    const onDepArrChange = async (e) => {
        const departure_place = commonUtils.getElementValue("departure_place");
        const arrival_place = commonUtils.getElementValue("arrival_place");

        if (departure_place !== "" && arrival_place !== "") {
            // load map
            await flightRecordMap.loadMap(departure_place, arrival_place);

            // update title and header
            await updateFlightRecordTitle();
        }
    }

    /**
     * Creates a new flight record based on the last arrival and date.
     */
    const newFlightRecord = async () => {
        const url = await commonUtils.getApi("LogbookNew");
        const date = commonUtils.getElementValue("date");
        const arrival = commonUtils.getElementValue("arrival_place");
        location.href = `${url}?last_arrival=${arrival}&last_date=${date}`;
    }

    /**
     * Copies the flight record
     */
    const copyFlightRecord = async () => {
        // set empty uuids
        commonUtils.setElementValue("uuid", "");
        commonUtils.setElementValue("prev_uuid", "");
        commonUtils.setElementValue("next_uuid", "");

        // hide buttons
        document.getElementById("attach_button").classList.add("d-none");
        document.getElementById("new_flight_record").classList.add("d-none");
        document.getElementById("ask_delete_flight_record_btn").classList.add("d-none");
        document.getElementById("copy_flight_record").classList.add("d-none");

        await updateFlightRecordTitle();

        // show info message
        commonUtils.showInfoMessage("Flight record copied, update the details/flight times and save");
    }

    /**
     * Sets the tooltip message for the specified element.
     * @param {string} elementName - The ID of the element to set the tooltip for.
     * @param {string} message - The tooltip message to set.
     */
    const setTooltipMessage = (elementName, message) => {
        const element = document.getElementById(elementName);
        if (element) {
            element.setAttribute("data-bs-toggle", "tooltip");
            element.setAttribute("data-bs-placement", "bottom");
            element.setAttribute("title", message);
        }
    }

    /**
     * Enables tooltips for flight record fields based on user preferences.
     */
    const enableTooltips = async () => {
        const isEnable = await commonUtils.getPreferences("enable_flightrecord_tooltips");
        if (isEnable) {
            const msg = "Double Click will copy value from Total Time";

            setTooltipMessage("departure_place", "Departure Place");
            setTooltipMessage("departure_time", "Departure Time");
            setTooltipMessage("arrival_place", "Arrival Place");
            setTooltipMessage("arrival_time", "Arrival Time");
            setTooltipMessage("landings_day", "Day Landings");
            setTooltipMessage("landings_night", "Night Landings");
            setTooltipMessage("pic_name", "Double Click will set 'Self' value");
            setTooltipMessage("se_time", msg);
            setTooltipMessage("me_time", msg);
            setTooltipMessage("mcc_time", msg);
            setTooltipMessage("night_time", msg);
            setTooltipMessage("ifr_time", msg);
            setTooltipMessage("pic_time", msg);
            setTooltipMessage("dual_time", msg);
            setTooltipMessage("instr_time", msg);
            setTooltipMessage("sim_time", msg);
        }
    }

    /**
     * Assigns event listeners to the necessary elements.
     * @function assignEventListeners
     */
    const assignEventListeners = () => {
        // on change
        document.getElementById("departure_time").addEventListener("change", calculateTimes);
        document.getElementById("arrival_time").addEventListener("change", calculateTimes);
        document.getElementById("departure_place").addEventListener("change", onDepArrChange);
        document.getElementById("arrival_place").addEventListener("change", onDepArrChange);

        // on input
        document.getElementById("departure_place").addEventListener("input", convertToUpperCaseHandler);
        document.getElementById("arrival_place").addEventListener("input", convertToUpperCaseHandler);
        document.getElementById("departure_time").addEventListener("input", skipLettersHandler);
        document.getElementById("arrival_time").addEventListener("input", skipLettersHandler);
        document.getElementById("landings_day").addEventListener("input", skipLettersHandler);
        document.getElementById("landings_night").addEventListener("input", skipLettersHandler);
        document.getElementById("aircraft_reg").addEventListener("input", (e) => {
            e.currentTarget.value = e.currentTarget.value.toUpperCase();
            onRegChange();
        });

        // on dlb click
        document.getElementById("pic_name").addEventListener("dblclick", (e) => { e.currentTarget.value = 'Self'; });
        document.getElementById("se_time").addEventListener("dblclick", copyTotalTimeHandler);
        document.getElementById("me_time").addEventListener("dblclick", copyTotalTimeHandler);
        document.getElementById("mcc_time").addEventListener("dblclick", copyTotalTimeHandler);
        document.getElementById("night_time").addEventListener("dblclick", copyTotalTimeHandler);
        document.getElementById("ifr_time").addEventListener("dblclick", copyTotalTimeHandler);
        document.getElementById("pic_time").addEventListener("dblclick", copyTotalTimeHandler);
        document.getElementById("sic_time").addEventListener("dblclick", copyTotalTimeHandler);
        document.getElementById("dual_time").addEventListener("dblclick", copyTotalTimeHandler);
        document.getElementById("instr_time").addEventListener("dblclick", copyTotalTimeHandler);
        document.getElementById("sim_time").addEventListener("dblclick", copyTotalTimeHandler);

        // on click
        document.getElementById("save_flight_record_btn").addEventListener("click", saveFlightRecord);
        document.getElementById("ask_delete_flight_record_btn").addEventListener("click", askForDeleteFlightRecord);
        document.getElementById("delete_flight_record_btn").addEventListener("click", deleteFlightRecord);
        document.getElementById("attach_button").addEventListener("click", openUploadAttachemnts);
        document.getElementById("upload").addEventListener("click", uploadAttachment);
        document.getElementById("new_flight_record").addEventListener("click", newFlightRecord);
        document.getElementById("copy_flight_record").addEventListener("click", copyFlightRecord);
    }

    /**
     * Initializes the date range picker.
     */
    const initDateRangePicker = async () => {
        const firstDay = await commonUtils.getPreferences("daterange_picker_first_day");

        $('input[name="date"]').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            locale: {
                format: "DD/MM/YYYY",
                firstDay: parseInt(firstDay) || 0,
            },
            autoApply: true,
        }, function (start, end, label) {
            $(this).val(start.format("DD/MM/YYYY"));
        });
    }

    // validators
    /**
     * Validates the departure or arrival time field.
     * @param {HTMLInputElement} field - The input field to validate.
     * @returns {boolean} - Returns true if the field value is valid, false otherwise.
     */
    const validateDepArrTime = (field) => {
        if (field.value !== "" && field.value.length !== 4) {
            return commonUtils.updateFieldValidity(field, false);
        }
        return commonUtils.updateFieldValidity(field, true);
    }

    /**
     * Validates the time field.
     * @param {HTMLInputElement} field - The input field to be validated.
     * @returns {boolean} - Returns true if the field value is a valid time, otherwise false.
     */
    const validateTime = (field) => {
        if (field.value !== "" && !/^(?:(?<!\d)|[0-9]\d{0,4}):([0-5]\d)$/.test(field.value)) {
            return commonUtils.updateFieldValidity(field, false);
        }
        return commonUtils.updateFieldValidity(field, true);
    }

    /**
     * Validates the fields in the flight record form.
     * @returns {boolean} Returns true if all fields are valid, otherwise false.
     */
    const validateFields = () => {
        const fields = [
            { name: "date", validator: commonUtils.validateRequiredField, error: "Date cannot be empty\r\n" },
            { name: "departure_time", validator: validateDepArrTime, error: "Departure Time should be in HHMM format or empty\r\n" },
            { name: "arrival_time", validator: validateDepArrTime, error: "Arrival Time should be in HHMM format or empty\r\n" },
            { name: "total_time", validator: validateTime, error: "Total Time should be in HH:MM format or empty\r\n" },
            { name: "se_time", validator: validateTime, error: "Single Engine Time should be in HH:MM format or empty\r\n" },
            { name: "me_time", validator: validateTime, error: "Multi Engine Time should be in HH:MM format or empty\r\n" },
            { name: "mcc_time", validator: validateTime, error: "MCC Time should be in HH:MM format or empty\r\n" },
            { name: "night_time", validator: validateTime, error: "Night Time should be in HH:MM format or empty\r\n" },
            { name: "ifr_time", validator: validateTime, error: "IFR Time should be in HH:MM format or empty\r\n" },
            { name: "pic_time", validator: validateTime, error: "PIC Time should be in HH:MM format or empty\r\n" },
            { name: "sic_time", validator: validateTime, error: "Co-Pilot Time should be in HH:MM format or empty\r\n" },
            { name: "dual_time", validator: validateTime, error: "Dual Time should be in HH:MM format or empty\r\n" },
            { name: "instr_time", validator: validateTime, error: "Instructor Time should be in HH:MM format or empty\r\n" },
            { name: "sim_time", validator: validateTime, error: "Simulator Time should be in HH:MM format or empty\r\n" },
        ]
        const errorMessage = commonUtils.validateFields(fields);

        const isValid = errorMessage === "";
        if (!isValid) {
            commonUtils.showErrorMessage(errorMessage);
        }
        return isValid;
    }

    /**
     * Saves the flight record by sending a POST request to the server.
     * Validates the form fields before sending the request.
     */
    const saveFlightRecord = async () => {
        if (!validateFields()) {
            return;
        }

        const payload = {
            uuid: commonUtils.getElementValue("uuid"),
            date: commonUtils.getElementValue("date"),
            departure: {
                place: commonUtils.getElementValue("departure_place"),
                time: commonUtils.getElementValue("departure_time")
            },
            arrival: {
                place: commonUtils.getElementValue("arrival_place"),
                time: commonUtils.getElementValue("arrival_time")
            },
            aircraft: {
                model: commonUtils.getElementValue("aircraft_model"),
                reg_name: commonUtils.getElementValue("aircraft_reg")
            },
            time: {
                se_time: commonUtils.getElementValue("se_time"),
                me_time: commonUtils.getElementValue("me_time"),
                mcc_time: commonUtils.getElementValue("mcc_time"),
                total_time: commonUtils.getElementValue("total_time"),
                night_time: commonUtils.getElementValue("night_time"),
                ifr_time: commonUtils.getElementValue("ifr_time"),
                pic_time: commonUtils.getElementValue("pic_time"),
                co_pilot_time: commonUtils.getElementValue("sic_time"),
                dual_time: commonUtils.getElementValue("dual_time"),
                instructor_time: commonUtils.getElementValue("instr_time")
            },
            landings: {
                day: commonUtils.formatLandings(commonUtils.getElementValue("landings_day")),
                night: commonUtils.formatLandings(commonUtils.getElementValue("landings_night"))
            },
            sim: {
                type: commonUtils.getElementValue("sim_type"),
                time: commonUtils.getElementValue("sim_time")
            },
            pic_name: commonUtils.getElementValue("pic_name"),
            remarks: commonUtils.getElementValue("remarks")
        };

        const api = await commonUtils.getApi("LogbookSave");
        const data = await commonUtils.postRequest(api, payload);
        if (data.ok) {
            commonUtils.showInfoMessage(data.message);

            if (commonUtils.getElementValue("uuid") === "") {
                // set new uuid
                commonUtils.setElementValue("uuid", data.data);

                // show buttons
                document.getElementById("attach_button").classList.remove("d-none");
                document.getElementById("new_flight_record").classList.remove("d-none");
                document.getElementById("ask_delete_flight_record_btn").classList.remove("d-none");
                document.getElementById("copy_flight_record").classList.remove("d-none");
            }
        } else {
            commonUtils.showErrorMessage(data.message);
        }
    }

    /**
     * Asks for confirmation before deleting a flight record.
     * @param {Event} e - The event object.
     */
    const askForDeleteFlightRecord = async (e) => {
        const deleteModal = new bootstrap.Modal(document.getElementById("delete-record"));
        await deleteModal.show();
    }

    /**
     * Deletes a flight record.
     * @param {Event} e - The event object.
     */
    const deleteFlightRecord = async (e) => {
        const payload = {
            uuid: commonUtils.getElementValue("uuid")
        }

        const api = await commonUtils.getApi("LogbookDelete");
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
     * Loads attachments for a flight record.
     */
    const loadAttachments = async () => {
        const uuid = document.getElementById("uuid").value
        if (uuid === "") {
            return; // new record
        }

        let tbody = document.getElementById("attachments_table");
        let rows = "";

        const api = await commonUtils.getApi("LogbookUUIDAttachments");
        const data = await commonUtils.fetchJSON(api.replace("{uuid}", uuid));

        if (data.length) {
            tbody.innerHTML = "";
            const logbookAttachmentsDownloadAPI = await commonUtils.getApi("LogbookAttachmentsDownload");
            for (let x = 0; x < data.length; x++) {
                rows = rows +
                    `<tr>
                        <td><a href="${logbookAttachmentsDownloadAPI}${data[x]["uuid"]}" target="_blank">${data[x]["document_name"]}</a></td>
                        <td id="ask_${data[x]["uuid"]}"><a class="btn" onclick="flightRecordUtils.askForDeleteAttachment('${data[x]["uuid"]}');"><i class="bi bi-file-x-fill"></i> Delete</a></td>
                    </tr>`;
            }
            tbody.innerHTML = rows;
            document.getElementById("attach_button").innerHTML = '<i class="bi bi-paperclip"></i> Attachments <span class="badge bg-secondary">' + data.length + '</span>';
        } else {
            tbody.innerHTML = "";
            document.getElementById("attach_button").innerHTML = '<i class="bi bi-paperclip"></i> Attachments';
        }
    };

    /**
     * Asks for confirmation to delete an attachment.
     * @param {string} uuid - The UUID of the attachment to be deleted.
     */
    const askForDeleteAttachment = (uuid) => {
        let tdbody = document.getElementById("ask_" + uuid);
        tdbody.innerHTML = `<button id="delete_attachment_${uuid}" class="btn btn-outline-danger" onclick="flightRecordUtils.deleteAttachment('${uuid}')"><i class="bi bi-check-square-fill"></i> Confirm</button>`;
    };

    /**
     * Deletes an attachment with the specified UUID.
     * @param {string} uuid - The UUID of the attachment to delete.
     */
    const deleteAttachment = async (uuid) => {
        let payload = { uuid: uuid };
        const api = await commonUtils.getApi("LogbookAttachmentsDelete");
        const data = await commonUtils.postRequest(api, payload);
        if (data.ok) {
            loadAttachments();
            commonUtils.showInfoMessage("Attachment deleted");
        } else {
            commonUtils.showErrorMessage(data.message);
        }
    }

    /**
     * Opens the upload attachments modal.
     * @param {Event} e - The event object.
     */
    const openUploadAttachemnts = async (e) => {
        const uploadModal = new bootstrap.Modal(document.getElementById("attachments"));
        await uploadModal.show();
    }

    /**
     * Uploads an attachment for the flight record.
     */
    const uploadAttachment = async () => {
        if (commonUtils.getElementValue("document") === "") {
            return;
        }

        const payload = new FormData(document.getElementById("flight_record_attachment_form"));
        const api = await commonUtils.getApi("LogbookAttachmentsUpload");
        let requestOptions = {
            method: "post",
            mode: "same-origin",
            credentials: "same-origin",
            body: payload,
        }
        const response = await fetch(api, requestOptions);
        const data = await response.json();

        if (data.ok) {
            commonUtils.showInfoMessage(data.message);
            loadAttachments();
        } else {
            commonUtils.showErrorMessage(data.message);
        }

        document.getElementById("flight_record_attachment_form").reset();
    };

    /**
     * Initializes the page by assigning event listeners, enabling tooltips, and triggering the onDepArrChange function.
     */
    const initPage = async () => {
        await updateFlightRecordTitle();
        assignEventListeners();
        await enableTooltips();
        await onDepArrChange();
        await initDateRangePicker();
        await loadAttachments();
    }

    document.addEventListener("DOMContentLoaded", initPage);

    return { saveFlightRecord, askForDeleteAttachment, deleteAttachment, uploadAttachment, loadAttachments };
}();

