"use strict";

const statsTotalsByType = function () {
    const initPage = async () => {
        let startDate = null;
        let endDate = null;

        const apiStatsTotalsByType = await commonUtils.getApi('StatsTotalsByType');
        const hide_stats_se = await commonUtils.getPreferences("hide_stats_se");
        const hide_stats_me = await commonUtils.getPreferences("hide_stats_me");
        const hide_stats_mcc = await commonUtils.getPreferences("hide_stats_mcc");
        const hide_stats_night = await commonUtils.getPreferences("hide_stats_night");
        const hide_stats_ifr = await commonUtils.getPreferences("hide_stats_ifr");
        const hide_stats_pic = await commonUtils.getPreferences("hide_stats_pic");
        const hide_stats_copilot = await commonUtils.getPreferences("hide_stats_copilot");
        const hide_stats_dual = await commonUtils.getPreferences("hide_stats_dual");
        const hide_stats_instructor = await commonUtils.getPreferences("hide_stats_instructor");
        const hide_stats_sim = await commonUtils.getPreferences("hide_stats_sim");
        const hide_stats_crosscountry = await commonUtils.getPreferences("hide_stats_crosscountry");
        const hide_stats_landings = await commonUtils.getPreferences("hide_stats_landings");
        const hide_stats_distance = await commonUtils.getPreferences("hide_stats_distance");
        const firstDay = await commonUtils.getPreferences("daterange_picker_first_day");

        // init Totals By Type table
        const tableTotalsByType = $('#totals_by_type').DataTable({
            orderFixed: [0, "asc"],
            ordering: false,
            info: false,
            ajax: apiStatsTotalsByType,
            scrollX: true,
            columnDefs: [
                { targets: 0, className: "fw-bold" },
                { targets: 1, visible: !hide_stats_se, searchable: false },
                { targets: 2, visible: !hide_stats_me, searchable: false },
                { targets: 3, visible: !hide_stats_mcc, searchable: false },
                { targets: 4, visible: !hide_stats_night, searchable: false },
                { targets: 5, visible: !hide_stats_ifr, searchable: false },
                { targets: 6, visible: !hide_stats_pic, searchable: false },
                { targets: 7, visible: !hide_stats_copilot, searchable: false },
                { targets: 8, visible: !hide_stats_dual, searchable: false },
                { targets: 9, visible: !hide_stats_instructor, searchable: false },
                { targets: 10, visible: !hide_stats_sim, searchable: false },
                { targets: 11, visible: !hide_stats_crosscountry, searchable: false },
                { targets: 12, visible: !hide_stats_landings, searchable: false },
                { targets: 13, visible: !hide_stats_distance, searchable: false },
            ],
            paging: false,
            searching: false,
            initComplete: function () { statsUtils.loadChart('totals_by_type'); }, // Show Totals for chart
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
            tableTotalsByType.ajax.url(`${apiStatsTotalsByType}?start_date=${encodeURIComponent(start.format("YYYYMMDD"))}&end_date=${encodeURIComponent(end.format("YYYYMMDD"))}`).load();
        });

        $('input[name="daterange"]').on('apply.daterangepicker', function (ev, picker) {
            $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
        });

        $('input[name="daterange"]').on('cancel.daterangepicker', function (ev, picker) {
            $(this).val('Date filters...');
            startDate = null;
            endDate = null;
            // refresh tables
            tableTotalsByType.ajax.url(apiStatsTotalsByType).load();
        });
    }

    document.addEventListener("DOMContentLoaded", initPage);
}();