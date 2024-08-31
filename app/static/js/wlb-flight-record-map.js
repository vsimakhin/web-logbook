"use strict";

const flightRecordMap = function () {
    /**
     * Converts degrees to radians.
     * @param {number} degrees - The value in degrees to be converted.
     * @returns {number} The value in radians.
     */
    const deg2rad = (degrees) => {
        return degrees * Math.PI / 180;
    };

    /**
     * Calculates the midpoint between two coordinates.
     * @param {number} lat1 - The latitude of the first coordinate.
     * @param {number} lon1 - The longitude of the first coordinate.
     * @param {number} lat2 - The latitude of the second coordinate.
     * @param {number} lon2 - The longitude of the second coordinate.
     * @returns {string} The midpoint coordinates in the format "latitude|longitude".
     */
    const midpoint = (lat1, lon1, lat2, lon2) => {
        lat1 = deg2rad(lat1);
        lon1 = deg2rad(lon1);
        lat2 = deg2rad(lat2);
        lon2 = deg2rad(lon2);

        const dlng = lon2 - lon1;
        const Bx = Math.cos(lat2) * Math.cos(dlng);
        const By = Math.cos(lat2) * Math.sin(dlng);
        const lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2),
            Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
        const lng3 = lon1 + Math.atan2(By, (Math.cos(lat1) + Bx));

        return (lat3 * 180) / Math.PI + '|' + (lng3 * 180) / Math.PI;
    }

    /**
     * Calculates the distance between two coordinates using the Haversine formula.
     * @param {number} lat1 - The latitude of the first coordinate.
     * @param {number} lon1 - The longitude of the first coordinate.
     * @param {number} lat2 - The latitude of the second coordinate.
     * @param {number} lon2 - The longitude of the second coordinate.
     * @returns {number} The distance between the two coordinates in kilometers.
     */
    const distance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        lat1 = deg2rad(lat1);
        lat2 = deg2rad(lat2);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;

        return d;
    }

    const loadMap = async (departure_place, arrival_place) => {
        document.getElementById("map").innerText = "";

        // load deprature & arrival airports
        const api = commonUtils.getApi("Airport");
        const dep = await commonUtils.fetchJSON(`${api}${departure_place}`);
        const arr = await commonUtils.fetchJSON(`${api}${arrival_place}`);

        // calculate center of the map
        const dist = distance(dep["lat"], dep["lon"], arr["lat"], arr["lon"]);

        /* generate a map */
        var map = new ol.Map({
            target: "map",
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            overlays: [mapPopupOverlay.overlay],
            view: new ol.View({
                zoom: 5
            }),
            controls: ol.control.defaults.defaults().extend([
                new ol.control.FullScreen()
            ])
        });

        /* drawing route... */
        const vectorLine = new ol.source.Vector({});
        let center;

        if (!((dep["lon"] === arr["lon"]) && (dep["lat"] === arr["lat"]))) {
            // departure and arrivals are not the same
            const arcGenerator = new arc.GreatCircle(
                { x: dep["lon"], y: dep["lat"] },
                { x: arr["lon"], y: arr["lat"] }
            );
            const arcLine = arcGenerator.Arc(100, { offset: 10 });
            center = ol.proj.transform(arcLine.geometries[0].coords[49], "EPSG:4326", "EPSG:3857");

            arcLine.geometries.forEach(function (geometry) {
                const line = new ol.geom.LineString(geometry.coords);
                line.transform("EPSG:4326", "EPSG:3857");

                vectorLine.addFeature(new ol.Feature({ geometry: line }));
            });
        }

        const vectorLineLayer = new ol.layer.Vector({
            source: vectorLine,
            style: new ol.style.Style({
                fill: new ol.style.Fill({ color: "#888888", weight: 0.4 }),
                stroke: new ol.style.Stroke({ color: "#888888", width: 1 })
            })
        });

        /* drawing markers */
        let points = [];
        points.push([dep["lon"], dep["lat"]])
        points.push([arr["lon"], arr["lat"]])

        const markers = [dep, arr];

        const vectorMarker = new ol.source.Vector({});

        for (let x = 0; x < points.length; x++) {
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
                            color: "#333",
                        })
                    })
                })
            ]

            const featureMarker = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat(points[x])),
                desc: "/static/favicon.ico",
                name: `${markers[x]["icao"]}/${markers[x]["iata"]}`,
                civil_name: markers[x]["name"],
                country: markers[x]["country"],
                city: markers[x]["city"],
                elevation: markers[x]["elevation"],
                coordinates: `${markers[x]["lat"]}, ${markers[x]["lon"]}`,
            });

            featureMarker.setStyle(iconStyle);
            vectorMarker.addFeature(featureMarker);
        }

        const vectorMarkerLayer = new ol.layer.Vector({
            source: vectorMarker,
        });

        map.addLayer(vectorLineLayer);
        map.addLayer(vectorMarkerLayer);

        map.renderSync();

        const extent = vectorMarkerLayer.getSource().getExtent();
        map.getView().fit(extent, { size: map.getSize(), maxZoom: 16, padding: [50, 50, 50, 50] });

        if (center) {
            map.getView().setCenter(center);
        }

        document.getElementById("some_stats").innerText = "Distance: " + Math.floor(dist) + " km / " + Math.floor(dist / 1.852) + " nm";

        map.on("click", function (evt) {
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
                "<strong>Airport:</strong> " + feature.get("name") + "<br>" +
                "<strong>Name:</strong> " + feature.get("civil_name") + "<br>" +
                "<strong>Country:</strong> " + feature.get("country") + "<br>" +
                "<strong>Elevation:</strong> " + feature.get("elevation") + "<br>" +
                "<strong>Lat/Lon:</strong> " + feature.get("coordinates") + "<br>";
            mapPopupOverlay.overlay.setPosition(coordinates);
        });

        map.on("pointermove", function (e) {
            const pixel = map.getEventPixel(e.originalEvent);

            let is_marker = false;
            const features = map.getFeaturesAtPixel(pixel);
            for (let x = 0; x < features.length; x++) {
                if (features[x].get("name") !== undefined) {
                    is_marker = true;
                }
            }

            if (is_marker) {
                const hit = map.hasFeatureAtPixel(pixel);
                document.getElementById("map").style.cursor = hit ? "pointer" : "";
            } else {
                document.getElementById("map").style.cursor = "";
            }
        });
    }

    return {
        loadMap
    }
}();