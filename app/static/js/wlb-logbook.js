'use strict';

const logbookUtils = function () {
    let startDate = null
    let endDate = null

    // inits the main table
    const initLogbookTable = async () => {
        const remarksL = Math.round((document.documentElement.clientWidth - 1700) / 10);
        const lengthMenu = await commonUtils.getPreferences("logbook_rows") || 15;
        const url = await commonUtils.getApi("LogbookData");
        const logbookAPI = await commonUtils.getApi("Logbook");
        const firstDay = await commonUtils.getPreferences("daterange_picker_first_day");

        const table = $('#logbook').DataTable({
            responsive: {
                details: false,
            },
            bAutoWidth: false,
            ordering: false,
            scrollX: true,
            ajax: {
                url: url,
                dataSrc: function (json) {
                    if (json.data === null) {
                        $("#logbook").dataTable().fnSettings().oLanguage.sEmptyTable = "No flight records";
                        return [];
                    } else {
                        return json.data;
                    }
                }
            },
            lengthMenu: [[parseInt(lengthMenu), -1], [lengthMenu, "All"]],
            columnDefs: [
                { targets: [0], visible: false, searchable: false },
                { targets: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 22], className: "dt-body-center" },
                { targets: [1], width: "1%" }, //date
                { targets: [2, 3, 4, 5], width: "3%" }, //places
                { targets: [8, 9, 10, 11, 15, 16, 17, 18, 19, 20, 22], width: "3%" }, //time
                { targets: [6, 7, 21], width: "4%" }, //aircraft
                { targets: [13, 14], width: "3%" }, //landings
                { targets: [12], width: "9%" }, //pic
                {
                    targets: [23], render: function (data, type, row) {
                        if (data.length > remarksL) {
                            var txt = data.substr(0, remarksL) + '…'
                            return `<span data-bs-toggle="tooltip" data-bs-placement="bottom" title="${commonUtils.escapeHtml(data)}">${commonUtils.escapeHtml(txt)}</span>`;
                        } else {
                            return data;
                        }
                    }
                }
            ],
            layout: {
                topStart: function () {
                    // daterange field
                    let toolbar = document.createElement('div');
                    toolbar.innerHTML = '<input class="form-control form-control-sm" type="text" id="daterange" name="daterange" value="Date filters...">';

                    return toolbar;
                }
            },
            rowCallback: function (row, data, index) {
                $("td:eq(0)", row).html(`<a href="${logbookAPI}/${data[0]}" class="link-primary">${data[1]}</a>`);
            },
            footerCallback: function (row, data, start, end, display) {
                let api = this.api();
                let offset = 7;

                let getNumbers = function (i) {
                    return typeof i === 'string'
                        ? commonUtils.convertTime(i)
                        : typeof i === 'number'
                            ? i
                            : 0;
                };

                const calculateTotals = function (id, time = true) {
                    if (!api.column(id).visible()) { return; }

                    // Total over all pages
                    const total = api
                        .column(id, { search: 'applied' })
                        .data().reduce((a, b) => getNumbers(a) + getNumbers(b), 0);

                    // Total over this page
                    const pageTotal = api
                        .column(id, { page: 'current' })
                        .data().reduce((a, b) => getNumbers(a) + getNumbers(b), 0);

                    // Update footer
                    if (time) {
                        $(`#s${id}`).html(commonUtils.convertNumberToTime(pageTotal));
                        $(`#t${id}`).html(commonUtils.convertNumberToTime(total));
                    } else {
                        $(`#s${id}`).html(pageTotal);
                        $(`#t${id}`).html(total);
                    }
                }

                calculateTotals(8); // se time
                calculateTotals(9); // me time
                calculateTotals(10); // mcc
                calculateTotals(11); // total time
                calculateTotals(13, false); // day landings
                calculateTotals(14, false); // night landings
                calculateTotals(15); // night
                calculateTotals(16); // ifr
                calculateTotals(17); // pic
                calculateTotals(18); // cop
                calculateTotals(19); // dual
                calculateTotals(20); // instr
                calculateTotals(22); // sim
            },
            initComplete: function () {
                // daterange logic
                $('input[name="daterange"]').daterangepicker({
                    opens: 'left',
                    autoUpdateInput: false,
                    ranges: {
                        'Today': [moment(), moment()],
                        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                        'This Month': [moment().startOf('month'), moment().endOf('month')],
                        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                        'This Year': [moment().startOf('year'), moment().endOf('year')],
                        'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')]
                    },
                    alwaysShowCalendars: true,
                    linkedCalendars: false,
                    locale: {
                        cancelLabel: 'Clear',
                        firstDay: firstDay
                    }
                }, function (start, end, label) {
                    startDate = start;
                    endDate = end;
                    table.draw();
                });

                $('input[name="daterange"]').on('apply.daterangepicker', function (ev, picker) {
                    $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
                });

                $('input[name="daterange"]').on('cancel.daterangepicker', function (ev, picker) {
                    $(this).val('Date filters...');
                    startDate = null;
                    endDate = null;
                    table.draw();
                });
            }
        });

        /**
         * Adjusts the visibility of columns in a table based on the width of a card element.
         */
        const adjustColumnVisibility = () => {
            const cardWidth = document.getElementById('logbook_card').clientWidth;

            if (cardWidth >= 1500) {
                table.columns([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]).visible(true);
            } else if (cardWidth >= 1000 && cardWidth < 1500) {
                table.columns([1, 2, 3, 4, 5, 6, 7, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22]).visible(true);
                table.columns([8, 9, 10, 13, 14, 23]).visible(false);
            } else if (cardWidth >= 770 && cardWidth < 1000) {
                table.columns([1, 2, 3, 4, 5, 6, 7, 11, 12, 21, 22]).visible(true);
                table.columns([8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20, 23]).visible(false);
            } else {
                table.columns([1, 2, 3, 4, 5, 11]).visible(true);
                table.columns([6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]).visible(false);
            }

            // redraw the table to apply the changes and adjust the footer
            table.draw("page");
        }

        $(window).resize(adjustColumnVisibility);
        adjustColumnVisibility();

        // Custom filtering function for datatables
        $.fn.dataTable.ext.search.push(
            function (settings, data, dataIndex) {
                if (startDate === null || endDate === null) {
                    return true;
                }

                var mdate = data[1].split("/");
                var date = new Date(`${mdate[2]}-${mdate[1]}-${mdate[0]}T00:00:00Z`);

                if (startDate <= date && date <= endDate) {
                    return true;
                } else {
                    return false;
                }
            }
        );
    }

    document.addEventListener("DOMContentLoaded", initLogbookTable);
}();