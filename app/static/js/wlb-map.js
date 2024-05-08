"use strict";

const mapUtils = function () {
    let start = moment().startOf('year');
    let end = moment().endOf('year');

    const loadMap = async (parameters) => {
        document.getElementById("map").innerText = "";
        document.getElementById("some_stats").innerText = "Routes: 0\nAirports: 0";

        const mapDataApi = await commonUtils.getApi("MapData");
        const data = await commonUtils.fetchJSON(`${mapDataApi}${parameters}`);

        const lines = data["lines"];
        const markers = data["markers"];

        /* generate a map */
        const map = new ol.Map({
            target: "map",
            layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
            overlays: [mapPopupOverlay.overlay],
            view: new ol.View({ zoom: 5 }),
            controls: ol.control.defaults.defaults().extend([
                new ol.control.FullScreen()
            ])
        });

        let some_stats = "";

        // for centering the map (very average point)
        let lats = 0;
        let lons = 0;
        let center;

        /* generate line points */
        let points = [];
        if (lines) { // lines can be empty if filter no-routes is true
            for (let x = 0; x < lines.length; x++) {
                points.push([lines[x]["point1"], lines[x]["point2"]]);
            }

            /* drawing routes... */
            const vectorLine = new ol.source.Vector({});

            for (let x = 0; x < points.length; x++) {

                lons += points[x][0][0];
                lats += points[x][0][1];

                const arcGenerator = new arc.GreatCircle(
                    { x: points[x][0][0], y: points[x][0][1] },
                    { x: points[x][1][0], y: points[x][1][1] }
                );
                const arcLine = arcGenerator.Arc(100, { offset: 10 });

                arcLine.geometries.forEach(function (geometry) {
                    const line = new ol.geom.LineString(geometry.coords);
                    line.transform('EPSG:4326', 'EPSG:3857');

                    vectorLine.addFeature(new ol.Feature({ geometry: line }));
                });
            }

            lons = lons / points.length;
            lats = lats / points.length;
            center = ol.proj.transform([lons, lats], 'EPSG:4326', 'EPSG:3857');

            const vectorLineLayer = new ol.layer.Vector({
                source: vectorLine,
                style: new ol.style.Style({
                    fill: new ol.style.Fill({ color: '#888888', weight: 0.4 }),
                    stroke: new ol.style.Stroke({ color: '#888888', width: 1 })
                })
            });
            map.addLayer(vectorLineLayer);

            some_stats += "Routes: " + lines.length + "\n";
        }

        /* drawing markers */
        const vectorMarker = new ol.source.Vector({});
        if (markers) {
            for (let x = 0; x < markers.length; x++) {
                const iconStyle = [
                    new ol.style.Style({
                        image: new ol.style.Icon(/** @type {module:ol/style/Icon~Options} */({
                            src: "/static/favicon.ico"
                        }))
                    }),
                    new ol.style.Style({
                        text: new ol.style.Text({
                            text: markers[x]["name"],
                            offsetY: -12,
                            scale: 1.3,
                            fill: new ol.style.Fill({
                                color: '#333',
                            })
                        })
                    })
                ]

                const featureMarker = new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat(markers[x]["point"])),
                    desc: "/static/favicon.ico",
                    name: markers[x]["name"],
                    civil_name: markers[x]["civil_name"],
                    country: markers[x]["country"],
                    city: markers[x]["city"],
                    elevation: markers[x]["elevation"],
                    coordinates: `${markers[x]["point"][1]}, ${markers[x]["point"][0]}`
                });

                featureMarker.setStyle(iconStyle);
                vectorMarker.addFeature(featureMarker);
            }

            some_stats += "Airports: " + markers.length;
        } else {
            map.renderSync();
            return;
        }

        const vectorMarkerLayer = new ol.layer.Vector({ source: vectorMarker });
        map.addLayer(vectorMarkerLayer);
        map.renderSync();

        const extent = vectorMarkerLayer.getSource().getExtent();
        map.getView().fit(extent, { size: map.getSize(), maxZoom: 16, padding: [20, 20, 20, 20] });

        if (center) {
            map.getView().setCenter(center);
        }

        document.getElementById("some_stats").innerText = some_stats;

        map.on('click', function (evt) {
            const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                return feature;
            });

            // cliked somewhere on the map
            if (!feature) {
                mapPopupOverlay.closerOnClick();
                return;
            }

            // clicked but not on the marker
            if (feature.get("name") === undefined) {
                mapPopupOverlay.closerOnClick();
                return;
            }

            // show airport/marker info
            const coordinates = feature.getGeometry().getCoordinates();
            mapPopupOverlay.content.innerHTML =
                '<strong>Airport:</strong> ' + feature.get('name') + '<br>' +
                '<strong>Name:</strong> ' + feature.get('civil_name') + '<br>' +
                '<strong>Country:</strong> ' + feature.get('country') + '<br>' +
                '<strong>Elevation:</strong> ' + feature.get('elevation') + '<br>' +
                '<strong>Lat/Lon:</strong> ' + feature.get('coordinates') + '<br>';
            mapPopupOverlay.overlay.setPosition(coordinates);
        });

        map.on('pointermove', function (e) {
            const pixel = map.getEventPixel(e.originalEvent);

            let is_marker = false;
            const features = map.getFeaturesAtPixel(pixel);
            for (var x = 0; x < features.length; x++) {
                if (features[x].get("name") !== undefined) {
                    is_marker = true;
                }
            }

            if (is_marker) {
                const hit = map.hasFeatureAtPixel(pixel);
                document.getElementById('map').style.cursor = hit ? 'pointer' : '';
            } else {
                document.getElementById('map').style.cursor = '';
            }
        });
    }

    const refresh = async () => {
        let filter_noroutes = document.getElementById("filter_noroutes").checked;
        let filter_reg = document.getElementById("filter_registration").value;
        let filter_model = document.getElementById("filter_model").value;
        let filter_class = document.getElementById("filter_class").value;
        let filter_place = document.getElementById("filter_place").value;

        const data = {
            start_date: encodeURIComponent(start.format("YYYYMMDD")),
            end_date: encodeURIComponent(end.format("YYYYMMDD")),
            filter_noroutes: encodeURIComponent(filter_noroutes),
            reg: encodeURIComponent(filter_reg),
            model: encodeURIComponent(filter_model),
            class: encodeURIComponent(filter_class),
            place: encodeURIComponent(filter_place)
        };

        const parameters = "?" + new URLSearchParams(data);
        await loadMap(parameters)
    }

    const setrange = (start, end) => {
        $('input[name="daterange"]').val(start.format('DD/MM/YYYY') + ' - ' + end.format('DD/MM/YYYY'));
        refresh();
    }

    const initDatePickers = async () => {
        setrange(start, end);
        const firstDay = await commonUtils.getPreferences("daterange_picker_first_day");


        // daterange logic
        $('input[name="daterange"]').daterangepicker({
            opens: 'right',
            autoUpdateInput: true,
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                'This Year': [moment().startOf('year'), moment().endOf('year')],
                'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')],
                'Ever': [moment().subtract(100, 'years'), moment()]
            },
            alwaysShowCalendars: true,
            linkedCalendars: false,
            startDate: start,
            endDate: end,
            locale: {
                firstDay: parseInt(firstDay) || 0
            }
        });

        $('input[name="daterange"]').on('apply.daterangepicker', function (ev, picker) {
            start = picker.startDate
            end = picker.endDate
            setrange(start, end);
        });

        $('input[name="daterange"]').on('change', function () {
            start = $('input[name="daterange"]').data('daterangepicker').startDate
            end = $('input[name="daterange"]').data('daterangepicker').endDate
        });
    }

    const assignEventListeners = () => {
        document.getElementById("refresh").addEventListener("click", refresh);

    }

    const initPage = async () => {
        assignEventListeners();
        await initDatePickers();
    }

    document.addEventListener("DOMContentLoaded", initPage);
}();