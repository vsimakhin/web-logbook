import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// css
import 'ol/ol.css';
import './map.css';
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
// MUI UI elements
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom components and libraries
import { queryClient } from '../../util/http/http';

import { GreatCircle } from 'arc/arc';
import { CardHeader } from '../UIElements/CardHeader';

import icon from "../../assets/favicon.ico";
import { fetchAirport } from '../../util/http/airport';

const getAirportData = async (id, navigate) => {
  const response = await queryClient.fetchQuery({
    queryKey: ["airport", id],
    queryFn: ({ signal }) => fetchAirport({ signal, id, navigate }),
  });

  // if response type Response
  if (response instanceof Response) {
    // looks like airport is not found
    if (response.status === 404) {
      return null;
    }
  }

  return response;
}

const addMarker = (features, airport) => {
  const code = `${airport.icao}${airport.iata ? '/' + airport.iata : ''}`;

  const feature = new Feature({
    geometry: new Point([airport.lon, airport.lat]).transform('EPSG:4326', 'EPSG:3857'),
    code: code,
    name: airport.name,
    country: airport.country,
    city: airport.city,
    elevation: airport.elevation,
    coordinates: `${airport.lat}, ${airport.lon}`,
  });

  feature.setStyle(
    new Style({
      image: new Icon({ src: icon }),
      text: new Text({
        text: code,
        offsetY: -12,
        scale: 1.3,
        fill: new Fill({
          color: '#333',
        }),
      }),
    }),
  );

  features.push(feature);
}

export const FlightMap = ({ data, title = "Flight Map", sx }) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const closerRef = useRef(null);
  const contentRef = useRef(null);

  const handleMapClick = useCallback((evt, map, overlay) => {
    const coordinate = evt.coordinate;
    const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);

    if (!feature || !feature.get("name")) {
      closerRef.current.onclick();
      return;
    }

    contentRef.current.innerHTML = `
      <strong>Airport:</strong> ${feature.get('code')}<br>
      <strong>Name:</strong> ${feature.get('name')}<br>
      <strong>Country:</strong> ${feature.get('country')}<br>
      <strong>City:</strong> ${feature.get('city')}<br>
      <strong>Elevation:</strong> ${feature.get('elevation')}<br>
      <strong>Lat/Lon:</strong> ${feature.get('coordinates')}<br>
    `;
    overlay.setPosition(coordinate);
  }, []);

  useEffect(() => {
    let map;

    if (mapRef.current) {
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({ source: vectorSource });

      const overlay = new Overlay({
        element: containerRef.current,
        autoPan: { animation: { duration: 250 } },
      });

      closerRef.current.onclick = function () {
        overlay.setPosition(undefined);
        closerRef.current.blur();
        return false;
      };

      map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({ source: new OSM() }),
          vectorLayer,
        ],
        view: new View({
          center: transform([10, 45], 'EPSG:4326', 'EPSG:3857'),
          zoom: 4,
        }),
        controls: [new FullScreen()],
        overlays: [overlay],
      });

      if (data) {
        (async () => {
          const features = [];
          const airportPromises = data.map(async (flight) => {
            if (!flight.departure.place || !flight.arrival.place) return null;

            const [departure, arrival] = await Promise.all([
              getAirportData(flight.departure.place, navigate),
              getAirportData(flight.arrival.place, navigate),
            ]);

            if (!departure || !arrival) return null;

            addMarker(features, departure);
            addMarker(features, arrival);

            // Add line between departure and arrival (great circle)
            const arcGenerator = new GreatCircle(
              { x: departure.lon, y: departure.lat },
              { x: arrival.lon, y: arrival.lat }
            );
            const arcLine = arcGenerator.Arc(100, { offset: 10 });
            if (arcLine.geometries.length > 0) {
              const coordinates = arcLine.geometries[0].coords.map((geometry) =>
                transform([geometry[0], geometry[1]], 'EPSG:4326', 'EPSG:3857')
              );

              const lineFeature = new LineString(coordinates);
              vectorSource.addFeature(new Feature({ geometry: lineFeature }));
            }

            return { departure, arrival };
          });

          const results = await Promise.all(airportPromises);
          const validResults = results.filter(Boolean);
          if (validResults.length === 0) return;

          const lons = validResults.reduce((sum, { departure, arrival }) => sum + departure.lon + arrival.lon, 0) / (validResults.length * 2);
          const lats = validResults.reduce((sum, { departure, arrival }) => sum + departure.lat + arrival.lat, 0) / (validResults.length * 2);

          if (lats !== 0 || lons !== 0) {
            map.getView().setCenter(transform([lons, lats], 'EPSG:4326', 'EPSG:3857'));
          }

          vectorSource.addFeatures(features);
          map.getView().fit(vectorSource.getExtent(), { size: map.getSize(), maxZoom: 16, padding: [30, 30, 30, 30] });
        })();
      }

      map.on('singleclick', (evt) => handleMapClick(evt, map, overlay));
    }

    return () => {
      if (map) {
        map.setTarget(null);
      }
    };
  }, [data, navigate, handleMapClick]);

  return (
    <>
      {data && (
        <>
          <Card variant="outlined" sx={sx}>
            <CardContent>
              <CardHeader title={title} />
              <div ref={mapRef} style={{ width: '100%', height: '500px', borderRadius: '4px', overflow: 'hidden' }}></div>
            </CardContent>
          </Card>
          <Card ref={containerRef} className="ol-popup">
            <CardContent>
              <a ref={closerRef} href="#" id="popup-closer" className="ol-popup-closer"></a>
              <div ref={contentRef} id="popup-content"></div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
};

export default FlightMap;