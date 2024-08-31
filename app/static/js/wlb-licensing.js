"use strict";

const licensingUtils = function () {

    const initLicensing = async () => {
        const downloadIcon = `<i class="bi bi-cloud-arrow-down"></i>`;
        const lengthMenu = commonUtils.getPreferences("licensing_rows") || 15;
        const groupColumn = 0;
        const url = commonUtils.getApi("LicensingData");
        const licensingDownloadAPI = commonUtils.getApi("LicensingDownload");
        const licensingAPI = commonUtils.getApi("Licensing");

        const table = $("#licensing").DataTable({
            bAutoWidth: false,
            columnDefs: [
                { visible: false, targets: groupColumn },
                { targets: [1], visible: false, searchable: false },
                { targets: [7], width: "1%" }, //date
            ],
            ordering: false,
            paging: true,
            oLanguage: { sEmptyTable: "No records" },
            ajax: {
                url: url,
                dataSrc: function (json) { return json.data === null ? [] : json.data; }
            },
            lengthMenu: [[parseInt(lengthMenu), -1], [lengthMenu, "All"]],
            drawCallback: function (settings) {
                const api = this.api();
                const rows = api.rows({ page: 'current' }).nodes();
                let last = null;

                api.column(groupColumn, { page: 'current' }).data().each(function (group, i) {
                    if (last !== group) {
                        $(rows).eq(i).before(`<tr class="group"><td colspan="8" class="table-active">${group}</td></tr>`);
                        last = group;
                    }
                });
            },
            rowCallback: function (row, data, index) {
                if (data[7] === 'Expired!') {
                    $("td:nth-child(6)", row).addClass("text-danger");
                }
                if (data[8] !== '') {
                    $("td:eq(6)", row).html(`<a href="${licensingDownloadAPI}${data[8]}" class="link-primary">${downloadIcon}</a>`);
                }
                $("td:eq(0)", row).html(`<a href="${licensingAPI}/${data[1]}" class="link-primary">${data[2]}</a>`);
            }
        });

        /**
         * Adjusts the visibility of columns in a table based on the width of a card element.
         */
        const adjustColumnVisibility = () => {
            const cardWidth = document.getElementById('licensing_card').clientWidth;

            if (cardWidth >= 770) {
                table.columns([2, 3, 4, 5, 6, 7]).visible(true);
            } else {
                table.columns([2, 6, 7]).visible(true);
                table.columns([3, 4, 5, 8]).visible(false);
            }
        }

        $(window).resize(adjustColumnVisibility);
        adjustColumnVisibility();
    }

    document.addEventListener("DOMContentLoaded", initLicensing);
}();