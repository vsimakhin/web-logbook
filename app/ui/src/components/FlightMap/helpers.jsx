// openlayers
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import FullScreen from 'ol/control/FullScreen';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Icon, Fill, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import { transform } from 'ol/proj';

import icon1 from "../../assets/favicon.ico";
import icon2 from "../../assets/map-pin.png";
import icon3 from "../../assets/map-pin2.png";

export const icons = [
  { src: icon1, displacement: [0, 0] },
  { src: icon2, displacement: [0, 14] },
  { src: icon3, displacement: [0, 14] },
];

const createGreatCircleLine = (start, end, segments = 64) => {
  const lon1 = start.lon * Math.PI / 180
  const lat1 = start.lat * Math.PI / 180
  const lon2 = end.lon * Math.PI / 180
  const lat2 = end.lat * Math.PI / 180

  const coords = []

  const d = 2 * Math.asin(Math.sqrt(Math.sin((lat1 - lat2) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon1 - lon2) / 2) ** 2))

  for (let i = 0; i <= segments; i++) {
    const f = i / segments
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2)
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
    const lon = Math.atan2(y, x)

    coords.push(transform([lon * 180 / Math.PI, lat * 180 / Math.PI], 'EPSG:4326', 'EPSG:3857'))
  }

  return new LineString(coords)
}

export const drawGreatCircleLine = (departure, arrival, vectorSource) => {
  const geometry = createGreatCircleLine(departure, arrival)
  const routeFeature = new Feature({ geometry, type: 'route' })
  vectorSource.addFeature(routeFeature)
}

export const drawTrackLog = (flightTrack, vectorSource, flightId) => {
  const track = JSON.parse(atob(flightTrack));

  const coordinates = track.map((geometry) =>
    transform([geometry[1], geometry[0]], 'EPSG:4326', 'EPSG:3857')
  );

  const lineFeature = new LineString(coordinates);
  const feature = new Feature({
    geometry: lineFeature,
    lineKey: `track-${flightId}`,
  });
  vectorSource.addFeature(feature);
}
