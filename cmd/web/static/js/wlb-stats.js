"use strict";

const statsUtils = function () {
    let distanceColumnClicked = false;
    let startDate = null;
    let endDate = null;

    const ctx = document.getElementById('myChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: "bar",
        data: {},
        options: {
            scales: { y: { beginAtZero: true } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';

                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (distanceColumnClicked) {
                                    // format distance value with spaces
                                    label += context.parsed.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " nm";
                                } else {
                                    label += commonUtils.convertNumberToTime(context.parsed.y);
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });


    // func onStatsClick redraw the chart based on the column/stats selection
    const onStatsClick = async (table_name, cl) => {

        const tb = document.getElementById(table_name);
        let rows = tb.rows.length - 1;

        // check if column name is Distance
        distanceColumnClicked = tb.rows[0].cells[cl].innerText === "Distance";
        if (table_name === "totals") {
            // correction for this table to exclude landings and distance
            // since these values breaks the chart, especially the distance -
            // it's too huge comparing to the flight hours

            // iterate through the table and check if there are Landings or Distance in the rows of the first column
            for (let i = 1; i <= rows; i++) {
                if (tb.rows[i].cells[0].innerText === "Landings (day/night)" || tb.rows[i].cells[0].innerText === "Distance") {
                    // remove the row from the chart
                    rows--;
                    i--;
                }
            }
        }

        let labels = [];
        for (let i = 1; i <= rows; i++) {
            labels.push(tb.rows[i].cells[0].innerText);
        }
        chart.data.labels = labels;

        let values = [];
        for (var i = 1; i <= rows; i++) {
            values.push(commonUtils.convertTime(tb.rows[i].cells[cl].innerText));
        }

        chart.data.datasets = [{
            data: values,
            backgroundColor: 'rgba(36, 112, 220, 0.7)',
            borderColor: 'rgba(36, 112, 220, 0.7)',
            borderWidth: 1
        }]
        chart.update();
    }

    // func onStatsTabChange get the amount of columns and calls the onStatsClick
    const onStatsTabChange = (table_name) => {
        const tb = document.getElementById(table_name);
        const cols = tb.rows[0].cells.length;
        onStatsClick(table_name, cols - 1);
    }

    const showRangeField = (flag) => {
        const range_field = document.getElementById("range_field");
        flag ? range_field.classList.remove("d-none") : range_field.classList.add("d-none");
    }

    // func drawProgressBar generates html to show in the stats limit cell
    const drawProgressBar = (data, max) => {
        const intData = commonUtils.convertTime(data);
        const percentData = parseInt(intData / max * 100);

        if (data === "") {
            data = "0:00";
        }
        // inner and outer text for progress bar
        // depends on the % the text will be inside or outside the filled area
        // otherwise the area could be small and text not visible
        let innerText = "";
        let outerText = "";

        if (percentData <= 40) {
            outerText = `${data} of ${max}:00`
        } else {
            innerText = `${data} of ${max}:00`
        }

        // progress bar color
        let progressColor = "bg-success";
        if (percentData >= 50 && percentData <= 80) {
            progressColor = "bg-warning";
        } else if (percentData > 80) {
            progressColor = "bg-danger";
        }

        return `<div class="progress" role="progressbar" aria-valuenow="${intData}" aria-valuemin="0" aria-valuemax="${max}">
            <div class="progress-bar ${progressColor}" style="width: ${percentData}%">${innerText}</div>${outerText}</div>`;
    }

    const initTablesAndDateRangePickers = async () => {
        const apiStatsTotals = await commonUtils.getApi('StatsTotals');
        const apiStatsLimits = await commonUtils.getApi('StatsLimits');
        const apiStatsTotalsByType = await commonUtils.getApi('StatsTotalsByType');
        const apiStatsTotalsByClass = await commonUtils.getApi('StatsTotalsByClass');

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

        // init Totals table
        const tableTotals = $("#totals").DataTable({
            ordering: false,
            info: false,
            ajax: apiStatsTotals,
            columnDefs: [
                { targets: 0, visible: false, searchable: false },
                { targets: 1, className: "datatable-bold-column" },
                { targets: [2, 3, 4, 5, 6, 7], width: "13%" },
            ],
            paging: false,
            searching: false,
            initComplete: function () { onStatsClick('totals', 6); } // Show Totals for chart
        });

        // init Limitations table
        const tableLimits = $('#limits').DataTable({
            ordering: false,
            info: false,
            ajax: apiStatsLimits,
            columnDefs: [
                { targets: [0, 1, 2, 3], width: "25%" },
            ],
            paging: false,
            searching: false,
            rowCallback: function (row, data, index) {
                $("td:eq(0)", row).html(drawProgressBar(data[0], 90));
                $("td:eq(1)", row).html(drawProgressBar(data[1], 280));
                $("td:eq(2)", row).html(drawProgressBar(data[2], 1000));
                $("td:eq(3)", row).html(drawProgressBar(data[3], 900));
            },
        });

        // init Totals By Type table
        const tableTotalsByType = $('#totals_by_type').DataTable({
            orderFixed: [0, "asc"],
            info: false,
            ajax: apiStatsTotalsByType,
            columnDefs: [
                { targets: 0, className: "datatable-bold-column" },
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
            searching: false
        });

        // init Totals By Class table
        var tableTotalsByClass = $("#totals_by_class").DataTable({
            orderFixed: [0, "asc"],
            info: false,
            ajax: apiStatsTotalsByClass,
            columnDefs: [
                { targets: 0, className: "datatable-bold-column" },
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
            searching: false
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
            // refresh tables
            tableTotals.ajax.url(`${apiStatsTotals}?start_date=${encodeURIComponent(start.format("YYYYMMDD"))}&end_date=${encodeURIComponent(end.format("YYYYMMDD"))}`).load();
            tableTotalsByType.ajax.url(`${apiStatsTotalsByType}?start_date=${encodeURIComponent(start.format("YYYYMMDD"))}&end_date=${encodeURIComponent(end.format("YYYYMMDD"))}`).load();
            tableTotalsByClass.ajax.url(`${apiStatsTotalsByClass}?start_date=${encodeURIComponent(start.format("YYYYMMDD"))}&end_date=${encodeURIComponent(end.format("YYYYMMDD"))}`).load();
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
            tableTotalsByType.ajax.url(apiStatsTotalsByType).load();
            tableTotalsByClass.ajax.url(apiStatsTotalsByClass).load();
        });
    }

    const initPage = async () => {
        // assignEventListeners();
        await initTablesAndDateRangePickers();
    }

    document.addEventListener("DOMContentLoaded", initPage);

    return { onStatsClick, onStatsTabChange, showRangeField, drawProgressBar }
}();