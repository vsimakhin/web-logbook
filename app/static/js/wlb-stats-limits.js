"use strict";

const statsLimits = function () {
    const drawProgressBar = (data, max) => {
        const intData = commonUtils.convertTime(data);
        const percentData = parseInt(intData / max * 100);

        if (data === "") {
            data = "0:00";
        }

        // progress bar color
        let progressColor = "bg-success";
        if (percentData >= 50 && percentData <= 80) {
            progressColor = "bg-warning";
        } else if (percentData > 80) {
            progressColor = "bg-danger";
        }

        return `<div class="progress" role="progressbar" aria-valuenow="${intData}" aria-valuemin="0" aria-valuemax="${max}" >
                    <div class="progress-bar ${progressColor}" style="width: ${percentData}%">
                </div>`;
    }

    const initChart = (chartId, dataset) => {
        let keys = Object.keys(dataset);
        keys.sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));

        const ctx = document.getElementById(chartId).getContext('2d');
        const chart = new Chart(ctx, {
            type: "line",
            data: {},
            options: {
                responsive: true,
                interaction: { intersect: false, },
                scales: {
                    y: { beginAtZero: true },
                    x: { display: false },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                if (context.parsed.y !== null) {
                                    const label = keys[context.parsed.x];
                                    return `${label}: ${commonUtils.convertNumberToTime(context.parsed.y)}`;
                                }
                            }
                        }
                    }
                }
            }
        });

        let labels = [];
        let values = [];
        for (let key of keys) {
            labels.push(key);
            values.push(commonUtils.convertTime(dataset[key]));
        }
        chart.data.labels = labels;
        chart.data.datasets = [{
            data: values,
            backgroundColor: window.theme.primary,
            borderColor: window.theme.primary,
            borderWidth: 2,
            cubicInterpolationMode: 'monotone',
            pointRadius: 0,
        }]
        chart.update();
    }

    const initPage = async () => {
        const apiStatsLimits = await commonUtils.getApi('StatsLimits');
        const data = await commonUtils.fetchJSON(apiStatsLimits);

        document.getElementById("last28").innerHTML = drawProgressBar(data["totals"]["last28"], 90);
        document.getElementById("last90").innerHTML = drawProgressBar(data["totals"]["last90"], 280);
        document.getElementById("last12m").innerHTML = drawProgressBar(data["totals"]["last12m"], 1000);
        document.getElementById("last1y").innerHTML = drawProgressBar(data["totals"]["last1y"], 900);

        initChart("last28chart", data["detailed"]["last28"]);
        initChart("last90chart", data["detailed"]["last90"]);
        initChart("last12mchart", data["detailed"]["last12m"]);
        initChart("last1ychart", data["detailed"]["last1y"]);

    }

    document.addEventListener("DOMContentLoaded", initPage);
}();