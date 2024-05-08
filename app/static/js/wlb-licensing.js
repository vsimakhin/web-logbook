"use strict";

const licensingUtils = function () {

    const initLicensing = async () => {
        const downloadIcon = `<i class="bi bi-cloud-arrow-down-fill"></i>`;
        const lengthMenu = await commonUtils.getPreferences("licensing_rows") || 15;
        const groupColumn = 0;
        const url = await commonUtils.getApi("LicensingData");
        const licensingDownloadAPI = await commonUtils.getApi("LicensingDownload");
        const licensingAPI = await commonUtils.getApi("Licensing");

        $("#licensing").DataTable({
            columnDefs: [
                { visible: false, targets: groupColumn },
                { targets: [1], visible: false, searchable: false }
            ],
            ordering: false,
            paging: true,
            ajax: {
                url: url,
                dataSrc: function (json) {
                    if (json.data === null) {
                        $("#licensing").dataTable().fnSettings().oLanguage.sEmptyTable = "No records";
                        return [];
                    } else {
                        return json.data;
                    }
                }
            },
            lengthMenu: [[parseInt(lengthMenu), -1], [lengthMenu, "All"]],
            drawCallback: function (settings) {
                const api = this.api();
                const rows = api.rows({ page: 'current' }).nodes();
                let last = null;

                api.column(groupColumn, { page: 'current' }).data().each(function (group, i) {
                    if (last !== group) {
                        $(rows).eq(i).before(
                            '<tr class="group"><td colspan="8" class="table-active">' + group + '</td></tr>'
                        );
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
    }

    document.addEventListener("DOMContentLoaded", initLicensing);
}();