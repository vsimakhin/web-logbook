'use strict';

const exportUtils = function () {

    const formatMap = {
        "A4": "custom_title_a4",
        "A5": "custom_title_a5"
    };

    /**
     * Retrieves the custom title based on the specified format.
     * @param {string} format - The format of the custom title.
     * @returns {Promise<string>} - A promise that resolves to the custom title.
     */
    const getCustomTitle = async (format) => {
        if (!formatMap[format]) { return; }

        const api = await commonUtils.getApi("LogbookUUIDAttachments");
        const url = api.replace("{uuid}", formatMap[format]);
        const data = await commonUtils.fetchJSON(url);
        return data.length > 0 ? data[0].uuid : "";
    }

    /**
     * Deletes the custom title for a given format.
     * @param {string} format - The format for which the custom title needs to be deleted.
     */
    const deleteCustomTitle = async (format) => {
        // drop current saved file from attachments
        const api = await commonUtils.getApi("LogbookUUIDAttachments");
        const url = api.replace("{uuid}", formatMap[format]);
        const data = await commonUtils.fetchJSON(url);

        if (data.length > 0) {
            const requestUrl = await commonUtils.getApi("LogbookAttachmentsDelete");

            for (let i = 0; i < data.length; i++) {
                const payload = { uuid: data[i].uuid }
                const requestOptions = { method: "post", body: JSON.stringify(payload) };
                await fetch(requestUrl, requestOptions);
            }
            document.getElementById(`${formatMap[format]}_document`).innerHTML = "";
        }
    }

    /**
     * Saves a custom title for a given format.
     * @param {string} format - The format for which the custom title is being saved.
     * @returns {Promise<string>} - A Promise that resolves to the UUID of the saved custom title.
     */
    const saveCustomTitle = async (format) => {
        const customTitleElement = document.getElementById(formatMap[format]);
        const file = customTitleElement.files[0];

        if (file) {
            await deleteCustomTitle(format);

            // upload new file as attachment
            let payload = new FormData();
            payload.append("document", file);
            payload.append("record_id", formatMap[format]);

            const requestOptions = { method: "post", body: payload };
            const requestUrl = await commonUtils.getApi("LogbookAttachmentsUpload");
            await fetch(requestUrl, requestOptions)
        }

        const uuid = await getCustomTitle(format);
        return uuid;
    }

    /**
     * Shows a custom title modal for the specified format.
     * @param {string} format - The format of the custom title modal to show.
     */
    const showCustomTitleModal = async (format) => {
        const modal = new bootstrap.Modal(document.getElementById(`${formatMap[format]}_modal`), {});

        const uuid = await getCustomTitle(format);
        if (uuid !== "") {
            const api = await commonUtils.getApi("LogbookAttachmentsDownload");
            const data = `${api}${uuid}`;
            const response = await fetch(data);
            if (response) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onload = function () {
                    const text = `<object data="${reader.result}" width="100%" height="700px">
                        <p>Your browser does not support preview of the document</p></object>`;

                    document.getElementById(`${formatMap[format]}_document`).innerHTML = text;
                };
                reader.readAsDataURL(blob);
            }
        }

        modal.show();
    }

    /**
     * Saves A4 format settings.
     */
    const saveExportA4 = async () => {
        let time_fields_auto_format = 0;
        if (document.getElementById("time_field_format_radio2_a4").checked) {
            time_fields_auto_format = 1;
        } else if (document.getElementById("time_field_format_radio3_a4").checked) {
            time_fields_auto_format = 2;
        }

        const custom_title_a4 = await saveCustomTitle("A4");
        const payload = {
            export_a4: {
                logbook_rows: parseInt(document.getElementById("logbook_rows_a4").value),
                fill: parseInt(document.getElementById("fill_a4").value),
                left_margin: parseFloat(document.getElementById("left_margin_a4").value),
                top_margin: parseFloat(document.getElementById("top_margin_a4").value),
                body_row_height: parseFloat(document.getElementById("row_height_a4").value),
                footer_row_height: parseFloat(document.getElementById("footer_height_a4").value),
                page_breaks: document.getElementById("page_breaks_a4").value,
                replace_sp_time: document.getElementById("replace_sp_time_a4").checked,
                include_signature: document.getElementById("include_signature_a4").checked,
                is_extended: document.getElementById("is_extended_a4").checked,
                time_fields_auto_format: time_fields_auto_format,
                custom_title: custom_title_a4,
                columns: {
                    col1: parseFloat(document.getElementById("col1_a4").value),
                    col2: parseFloat(document.getElementById("col2_a4").value),
                    col3: parseFloat(document.getElementById("col3_a4").value),
                    col4: parseFloat(document.getElementById("col4_a4").value),
                    col5: parseFloat(document.getElementById("col5_a4").value),
                    col6: parseFloat(document.getElementById("col6_a4").value),
                    col7: parseFloat(document.getElementById("col7_a4").value),
                    col8: parseFloat(document.getElementById("col8_a4").value),
                    col9: parseFloat(document.getElementById("col9_a4").value),
                    col10: parseFloat(document.getElementById("col10_a4").value),
                    col11: parseFloat(document.getElementById("col11_a4").value),
                    col12: parseFloat(document.getElementById("col12_a4").value),
                    col13: parseFloat(document.getElementById("col13_a4").value),
                    col14: parseFloat(document.getElementById("col14_a4").value),
                    col15: parseFloat(document.getElementById("col15_a4").value),
                    col16: parseFloat(document.getElementById("col16_a4").value),
                    col17: parseFloat(document.getElementById("col17_a4").value),
                    col18: parseFloat(document.getElementById("col18_a4").value),
                    col19: parseFloat(document.getElementById("col19_a4").value),
                    col20: parseFloat(document.getElementById("col20_a4").value),
                    col21: parseFloat(document.getElementById("col21_a4").value),
                    col22: parseFloat(document.getElementById("col22_a4").value),
                    col23: parseFloat(document.getElementById("col23_a4").value)
                },
                headers: {
                    date: document.getElementById("header_date_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    departure: document.getElementById("header_departure_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    arrival: document.getElementById("header_arrival_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    aircraft: document.getElementById("header_aircraft_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    spt: document.getElementById("header_spt_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    mcc: document.getElementById("header_mcc_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    total: document.getElementById("header_total_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    pic_name: document.getElementById("header_pic_name_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    landings: document.getElementById("header_landings_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    oct: document.getElementById("header_oct_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    pft: document.getElementById("header_pft_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    fstd: document.getElementById("header_fstd_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    remarks: document.getElementById("header_remarks_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    dep_place: document.getElementById("header_dep_place_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    dep_time: document.getElementById("header_dep_time_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    arr_place: document.getElementById("header_arr_place_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    arr_time: document.getElementById("header_arr_time_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    model: document.getElementById("header_model_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    reg: document.getElementById("header_reg_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    se: document.getElementById("header_se_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    me: document.getElementById("header_me_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    land_day: document.getElementById("header_land_day_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    land_night: document.getElementById("header_land_night_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    night: document.getElementById("header_night_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    ifr: document.getElementById("header_ifr_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    pic: document.getElementById("header_pic_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    cop: document.getElementById("header_cop_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    dual: document.getElementById("header_dual_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    instr: document.getElementById("header_instr_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    sim_type: document.getElementById("header_sim_type_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    sim_time: document.getElementById("header_sim_time_a4").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                }
            }
        };

        const api = await commonUtils.getApi("Export");
        const formatA4 = await commonUtils.getApi("ExportFormatA4");
        const fullUrl = `${api}/${formatA4}`;
        const data = await commonUtils.postRequest(fullUrl, payload);
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
     * Saves A5 format settings.
     */
    const saveExportA5 = async () => {
        let time_fields_auto_format = 0;
        if (document.getElementById("time_field_format_radio2_a5").checked) {
            time_fields_auto_format = 1;
        } else if (document.getElementById("time_field_format_radio3_a5").checked) {
            time_fields_auto_format = 2;
        }

        const custom_title_a5 = await saveCustomTitle("A5");
        const payload = {
            export_a5: {
                logbook_rows: parseInt(document.getElementById("logbook_rows_a5").value),
                fill: parseInt(document.getElementById("fill_a5").value),
                left_margin_a: parseFloat(document.getElementById("left_margin_a_a5").value),
                left_margin_b: parseFloat(document.getElementById("left_margin_b_a5").value),
                top_margin: parseFloat(document.getElementById("top_margin_a5").value),
                body_row_height: parseFloat(document.getElementById("row_height_a5").value),
                footer_row_height: parseFloat(document.getElementById("footer_height_a5").value),
                page_breaks: document.getElementById("page_breaks_a5").value,
                replace_sp_time: document.getElementById("replace_sp_time_a5").checked,
                include_signature: document.getElementById("include_signature_a5").checked,
                is_extended: document.getElementById("is_extended_a5").checked,
                time_fields_auto_format: time_fields_auto_format,
                custom_title: custom_title_a5,
                columns: {
                    col1: parseFloat(document.getElementById("col1_a5").value),
                    col2: parseFloat(document.getElementById("col2_a5").value),
                    col3: parseFloat(document.getElementById("col3_a5").value),
                    col4: parseFloat(document.getElementById("col4_a5").value),
                    col5: parseFloat(document.getElementById("col5_a5").value),
                    col6: parseFloat(document.getElementById("col6_a5").value),
                    col7: parseFloat(document.getElementById("col7_a5").value),
                    col8: parseFloat(document.getElementById("col8_a5").value),
                    col9: parseFloat(document.getElementById("col9_a5").value),
                    col10: parseFloat(document.getElementById("col10_a5").value),
                    col11: parseFloat(document.getElementById("col11_a5").value),
                    col12: parseFloat(document.getElementById("col12_a5").value),
                    col13: parseFloat(document.getElementById("col13_a5").value),
                    col14: parseFloat(document.getElementById("col14_a5").value),
                    col15: parseFloat(document.getElementById("col15_a5").value),
                    col16: parseFloat(document.getElementById("col16_a5").value),
                    col17: parseFloat(document.getElementById("col17_a5").value),
                    col18: parseFloat(document.getElementById("col18_a5").value),
                    col19: parseFloat(document.getElementById("col19_a5").value),
                    col20: parseFloat(document.getElementById("col20_a5").value),
                    col21: parseFloat(document.getElementById("col21_a5").value),
                    col22: parseFloat(document.getElementById("col22_a5").value),
                    col23: parseFloat(document.getElementById("col23_a5").value)
                },
                headers: {
                    date: document.getElementById("header_date_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    departure: document.getElementById("header_departure_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    arrival: document.getElementById("header_arrival_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    aircraft: document.getElementById("header_aircraft_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    spt: document.getElementById("header_spt_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    mcc: document.getElementById("header_mcc_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    total: document.getElementById("header_total_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    pic_name: document.getElementById("header_pic_name_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    landings: document.getElementById("header_landings_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    oct: document.getElementById("header_oct_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    pft: document.getElementById("header_pft_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    fstd: document.getElementById("header_fstd_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    remarks: document.getElementById("header_remarks_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    dep_place: document.getElementById("header_dep_place_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    dep_time: document.getElementById("header_dep_time_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    arr_place: document.getElementById("header_arr_place_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    arr_time: document.getElementById("header_arr_time_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    model: document.getElementById("header_model_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    reg: document.getElementById("header_reg_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    se: document.getElementById("header_se_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    me: document.getElementById("header_me_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    land_day: document.getElementById("header_land_day_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    land_night: document.getElementById("header_land_night_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    night: document.getElementById("header_night_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    ifr: document.getElementById("header_ifr_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    pic: document.getElementById("header_pic_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    cop: document.getElementById("header_cop_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    dual: document.getElementById("header_dual_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    instr: document.getElementById("header_instr_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    sim_type: document.getElementById("header_sim_type_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                    sim_time: document.getElementById("header_sim_time_a5").innerText.replace(/(\r\n|\n|\r)/gm, " "),
                }
            }
        };

        const api = await commonUtils.getApi("Export");
        const formatA5 = await commonUtils.getApi("ExportFormatA5");
        const fullUrl = `${api}/${formatA5}`;
        const data = await commonUtils.postRequest(fullUrl, payload);
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
     * Saves the export settings for CSV format.
    */
    const saveExportCSV = async () => {
        const payload = {
            export_csv: {
                crlf: document.getElementById("crlf_csv").checked,
                delimeter: document.getElementById("delimeter_csv").value
            }
        };

        const api = await commonUtils.getApi("Export");
        const formatCSV = await commonUtils.getApi("ExportFormatCSV");
        const fullUrl = `${api}/${formatCSV}`;
        const data = await commonUtils.postRequest(fullUrl, payload);
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
    * Saves the export settings for XLS format.
    */
    const saveExportXLS = async () => {
        const payload = {
            export_xls: {
                convert_time: document.getElementById("convert_time_xls").checked
            }
        };

        const api = await commonUtils.getApi("Export");
        const formatXLS = await commonUtils.getApi("ExportFormatXLS");
        const fullUrl = `${api}/${formatXLS}`;
        const data = await commonUtils.postRequest(fullUrl, payload);
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
     * Runs the export process for A4 format.
     */
    const runExportA4 = async () => {
        const formatA4 = await commonUtils.getApi("ExportFormatA4");
        commonUtils.runExport(formatA4);
    }

    /**
     * Runs the export process for A5 format.
     */
    const runExportA5 = async () => {
        const formatA5 = await commonUtils.getApi("ExportFormatA5");
        commonUtils.runExport(formatA5);
    }

    /**
     * Runs the export process for CSV format.
     */
    const runExportCSV = async () => {
        const formatCSV = await commonUtils.getApi("ExportFormatCSV");
        commonUtils.runExport(formatCSV);
    }

    /**
     * Runs the export process for XLS format.
     */
    const runExportXLS = async () => {
        const formatXLS = await commonUtils.getApi("ExportFormatXLS");
        commonUtils.runExport(formatXLS);
    }

    /**
     * Restores the default settings for a specific part of the export.
     * @param {string} part - The part of the export to restore defaults for.
     */
    const restoreDefaults = async (part) => {
        const api = await commonUtils.getApi("ExportRestoreDefaults");
        const data = await commonUtils.postRequest(api, part);
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
     * Shows the export tab based on the value of the 'param' query string parameter.
     */
    const showTab = () => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const param = urlParams.get('param');

        const validParams = ["a5headers", "a5common", "a5columns"];

        if (param && validParams.includes(param)) {
            $("#nav-export-a5-tab").trigger("click");
        }
    }

    /**
     * Assigns event listeners to various elements in the document.
     */
    const assignEventListeners = () => {
        if (document.getElementById("export_a4")) {
            document.getElementById("show_custom_title_modal_a4").addEventListener("click", () => { showCustomTitleModal("A4"); });
            document.getElementById("save_a4").addEventListener("click", saveExportA4);
            document.getElementById("modal_save_a4").addEventListener("click", saveExportA4);
            document.getElementById("modal_delete_custom_a4").addEventListener("click", () => { deleteCustomTitle("A4"); });
            document.getElementById("export_a4").addEventListener("click", runExportA4);
            document.getElementById("restore_defaults_a4_common").addEventListener("click", () => { restoreDefaults("a4common"); });
            document.getElementById("restore_defaults_a4_headers").addEventListener("click", () => { restoreDefaults("a4headers"); });
            document.getElementById("restore_defaults_a4_columns").addEventListener("click", () => { restoreDefaults("a4columns"); });
        }

        if (document.getElementById("export_a5")) {
            document.getElementById("show_custom_title_modal_a5").addEventListener("click", () => { showCustomTitleModal("A5"); });
            document.getElementById("save_a5").addEventListener("click", saveExportA5);
            document.getElementById("modal_save_a5").addEventListener("click", saveExportA5);
            document.getElementById("modal_delete_custom_a5").addEventListener("click", () => { deleteCustomTitle("A5"); });
            document.getElementById("export_a5").addEventListener("click", runExportA5);
            document.getElementById("restore_defaults_a5_common").addEventListener("click", () => { restoreDefaults("a5common"); });
            document.getElementById("restore_defaults_a5_headers").addEventListener("click", () => { restoreDefaults("a5headers"); });
            document.getElementById("restore_defaults_a5_columns").addEventListener("click", () => { restoreDefaults("a5columns"); });
        }

        if (document.getElementById("export_csv")) {
            document.getElementById("save_csv").addEventListener("click", saveExportCSV);
            document.getElementById("export_csv").addEventListener("click", runExportCSV);
        }

        if (document.getElementById("export_xls")) {
            document.getElementById("save_xls").addEventListener("click", saveExportXLS);
            document.getElementById("export_xls").addEventListener("click", runExportXLS);
        }
    }

    /**
     * Initializes the page.
     */
    const initPage = async () => {
        assignEventListeners();
        showTab();
    }

    document.addEventListener("DOMContentLoaded", initPage);
}();