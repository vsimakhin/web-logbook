import { useCallback, useEffect, useRef, useState } from 'react';
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
import { GreatCircle } from 'arc/arc';
// MUI UI elements
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
// Custom components and libraries
import { queryClient } from '../../util/http/http';
import { CardHeader } from '../UIElements/CardHeader';
import icon from "../../assets/favicon.ico";
import { fetchAirport } from '../../util/http/airport';

const getAirportData = async (id) => {
  try {
    // Check cache first
    const cachedData = queryClient.getQueryData(["airports", id]);
    if (cachedData) {
      return cachedData;
    }

    const response = await queryClient.fetchQuery({
      queryKey: ["airports", id],
      queryFn: ({ signal }) => fetchAirport({ signal, id }),
      staleTime: 86400000, // 24 hours
      gcTime: 86400000, // 24 hours
    });

    return response;
  } catch {
    return null;
  }
}

const addMarker = (features, airport) => {
  /**
   * Code string for an airport based on its IATA and ICAO codes.
   * If the airport has both IATA and ICAO codes and they are different, 
   * the code will be in the format "ICAO/IATA". Otherwise, it will just be the ICAO code.
   */
  const code = airport.iata && airport.iata !== airport.icao ? `${airport.icao}/${airport.iata}` : airport.icao;

  // Check if marker already exists
  const exists = features.find(f => f.get('code') === code);
  if (exists) return;

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

const drawGreatCircleLine = (departure, arrival, vectorSource) => {
  // Create unique key for the line
  const airports = [departure.icao, arrival.icao].sort();
  const lineKey = `line-${airports[0]}-${airports[1]}`;

  // Check if line already exists
  const exists = vectorSource.getFeatures().some(f => f.get('lineKey') === lineKey);
  if (exists) return;

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
    const feature = new Feature({
      geometry: lineFeature,
      lineKey: lineKey
    });
    vectorSource.addFeature(feature);
  }
}

const drawTrackLog = (flightTrack, vectorSource) => {
  const track = JSON.parse(atob(flightTrack));

  const coordinates = track.map((geometry) =>
    transform([geometry[1], geometry[0]], 'EPSG:4326', 'EPSG:3857')
  );

  const lineFeature = new LineString(coordinates);
  const feature = new Feature({
    geometry: lineFeature,
    lineKey: Math.random(),
  });
  vectorSource.addFeature(feature);
}

export const FlightMap = ({ data, options = { routes: true, tracks: false }, title = "Flight Map", getEnroute, sx }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const closerRef = useRef(null);
  const contentRef = useRef(null);

  const [distance, setDistance] = useState(0);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDistance(0);

        (async () => {
          const features = [];
          const airportPromises = data.map(async (flight) => {
            if (!flight.departure.place || !flight.arrival.place) return null;

            const [departure, arrival] = await Promise.all([
              getAirportData(flight.departure.place),
              getAirportData(flight.arrival.place),
            ]);

            if (!departure || !arrival) return null;

            addMarker(features, departure);
            addMarker(features, arrival);

            const fullRoute = [departure];
            // get airport data for enroute
            const enrouteCodes = getEnroute(flight.custom_fields);
            if (enrouteCodes && Array.isArray(enrouteCodes)) {
              for (const code of enrouteCodes) {
                if (code !== flight.departure.place && code !== flight.arrival.place) {
                  const airport = await getAirportData(code);
                  if (airport) {
                    fullRoute.push(airport);
                    addMarker(features, airport);
                  }
                }
              }
            }
            fullRoute.push(arrival);

            if (options.routes) {
              for (let i = 0; i < fullRoute.length - 1; i++) {
                drawGreatCircleLine(fullRoute[i], fullRoute[i + 1], vectorSource);
              }
            }
            if (options.tracks) {
              if (flight.track) {
                drawTrackLog(flight.track, vectorSource);
              }
            }
            setDistance((prev) => prev + flight.distance);
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
  }, [data, handleMapClick, getEnroute, options.routes, options.tracks]);


  return (
    <>
      {data && (
        <>
          <Card variant="outlined" sx={{
            ...sx,
            height: '85vh',
            position: 'relative'
          }}>
            <CardContent sx={{ height: '100%' }}>
              <CardHeader title={title} />
              <div ref={mapRef} style={{ width: '100%', height: 'calc(100% - 35px)', borderRadius: '4px', overflow: 'hidden' }}></div>
              {distance > 0 && (
                <Typography>{`Distance: ${distance.toLocaleString(undefined, { maximumFractionDigits: 2 })} nm / ${(distance * 1.852).toLocaleString(undefined, { maximumFractionDigits: 2 })} km`}</Typography>
              )}
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