"use strict";

const statsTotals = function () {
    const initPage = async () => {
        let startDate = null;
        let endDate = null;
        const apiStatsTotals = commonUtils.getApi('StatsTotals');
        const firstDay = commonUtils.getPreferences("daterange_picker_first_day");

        // init Totals table
        const tableTotals = $("#totals").DataTable({
            ordering: false,
            info: false,
            ajax: apiStatsTotals,
            scrollX: true,
            columnDefs: [
                { targets: 0, visible: false, searchable: false },
                { targets: 1, className: "fw-bold" },
                { targets: [2, 3, 4, 5, 6, 7], width: "13%" },
            ],
            paging: false,
            searching: false,
            initComplete: function () { statsUtils.loadChart('totals'); } // Show Totals for chart
        });

        // daterange logic
        $('input[name="daterange"]').daterangepicker({
            opens: "left",
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
                firstDay: parseInt(firstDay) || 0,
            }
        }, function (start, end, label) {
            startDate = start;
            endDate = end;
            tableTotals.ajax.url(`${apiStatsTotals}?start_date=${encodeURIComponent(start.format("YYYYMMDD"))}&end_date=${encodeURIComponent(end.format("YYYYMMDD"))}`).load();
        });

        $('input[name="daterange"]').on('apply.daterangepicker', function (ev, picker) {
            $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
        });

        $('input[name="daterange"]').on('cancel.daterangepicker', function (ev, picker) {
            $(this).val('Date filters...');
            startDate = null;
            endDate = null;
            // refresh tables
            tableTotals.ajax.url(apiStatsTotals).load();
        });
    }

    document.addEventListener("DOMContentLoaded", initPage);
}();