"use strict";

const statsTotalsByYear = function () {
    const initPage = async () => {
        const tableTotals = $("#totals_by_year").DataTable({
            ordering: false,
            info: false,
            scrollX: true,
            columnDefs: [
                { targets: "_all", width: "5%" },
            ],
            paging: false,
            searching: false,
            initComplete: function () { statsUtils.loadChart('totals_by_year'); } // Show Totals for chart
        });
    }

    document.addEventListener("DOMContentLoaded", initPage);
}();