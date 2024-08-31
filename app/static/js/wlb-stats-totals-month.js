"use strict";

const statsTotalsByMonth = function () {
    const yearChange = async () => {
        const api = commonUtils.getApi('StatsTotalsByMonthYearPage');
        year = commonUtils.getElementValue("year");
        window.location.href = api.replace('{year}', year);
    }

    const initPage = async () => {
        const tableTotals = $("#totals_by_month").DataTable({
            ordering: false,
            info: false,
            scrollX: true,
            columnDefs: [
                { targets: "_all", width: "5%" },
            ],
            paging: false,
            searching: false,
            initComplete: function () { statsUtils.loadChart('totals_by_month'); } // Show Totals for chart
        });

        document.getElementById("year").addEventListener("change", () => { yearChange(); });
        document.getElementById("year").focus();
    }

    document.addEventListener("DOMContentLoaded", initPage);
}();