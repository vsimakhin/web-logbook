"use strict";

const statsUtils = function () {
    let distanceColumnClicked = false;

    const ctx = document.getElementById('myChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: "bar",
        data: {},
        options: {
            maintainAspectRatio: false,
            responsive: true,
            interaction: { intersect: false, },
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
            if (tb.rows[i].cells[cl] !== undefined) {
                values.push(commonUtils.convertTime(tb.rows[i].cells[cl].innerText));
            }
        }

        chart.data.datasets = [{
            data: values,
            backgroundColor: window.theme.primary,
            borderColor: window.theme.primary,
            borderWidth: 1
        }]
        chart.update();
        chartResize();
    }

    const loadChart = (table_name) => {
        const tb = document.getElementById(table_name);
        const cols = tb.rows[0].cells.length;
        onStatsClick(table_name, cols - 1);
    }

    /**
     * Resizes the chart based on the window size and the height of the stats card.
     * It will not resize the chart if the window width is less than 1200px (mobile devices)
     * It will set the default height of the chart to 250px if the calculated height is too small
     */
    const chartResize = () => {
        const defaultHeight = '250px';
        const offset = 250
        const statsCard = document.getElementById('table_stats');

        if (window.innerWidth < 1200 || !statsCard) {
            chart.canvas.parentNode.style.height = defaultHeight;
            return; // do not apply resizing for small screens
        }

        const windowHeight = window.innerHeight;

        const height = windowHeight - statsCard.clientHeight - offset;
        if (height < 250) {
            chart.canvas.parentNode.style.height = defaultHeight;
            return; // ignore further reduction if any
        }

        chart.canvas.parentNode.style.height = `${height}px`;;
    }

    window.addEventListener('resize', () => {
        chartResize();
    });



    return { onStatsClick, loadChart }
}();