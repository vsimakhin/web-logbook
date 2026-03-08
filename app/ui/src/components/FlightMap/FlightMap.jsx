import { useEffect, useRef, useState } from 'react';
// css
import 'ol/ol.css';
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
import { CardHeader } from '../UIElements/CardHeader';
import { queryClient } from '../../util/http/http';
import { fetchAirport } from '../../util/http/airport';

import icon1 from "../../assets/favicon.ico";
import icon2 from "../../assets/map-pin.png";
import useCustomFields from '../../hooks/useCustomFields';

const icons = {
  ico: { src: icon1, displacement: [0, 0] },
  pin: { src: icon2, displacement: [0, 14] }
};

const getAirportData = async (id, airportsMap) => {
  if (airportsMap) {
    const airport = airportsMap.get(id);
    if (airport) {
      return airport;
    }
  }

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

const addMarker = (features, airport, options) => {
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
      image: new Icon({ ...icons[options.icon] }),
      text: options.airport_ids ? new Text({
        text: code,
        offsetY: -12,
        scale: 1.3,
        fill: new Fill({
          color: '#333',
        }),
      }) : null,
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

const drawTrackLog = (flightTrack, vectorSource, flightId) => {
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

const DEFAULT_OPTIONS = { routes: true, tracks: false, airport_ids: true, icon: 'ico' };

export const FlightMap = ({
  data,
  options = DEFAULT_OPTIONS,
  title = "Flight Map",
  sx,
  airportsMap
}) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Persistent OpenLayers instances
  const mapInstance = useRef(null);
  const vectorSource = useRef(new VectorSource());
  const overlay = useRef(null);

  const customFieldsHook = useCustomFields() || {};
  const [distance, setDistance] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map once on mount
  useEffect(() => {
    if (!mapRef.current) return;

    overlay.current = new Overlay({ element: containerRef.current });
    const vectorLayer = new VectorLayer({ source: vectorSource.current });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view: new View({
        center: transform([10, 45], 'EPSG:4326', 'EPSG:3857'),
        zoom: 4,
      }),
      controls: [new FullScreen()],
      overlays: [overlay.current],
    });

    map.on('singleclick', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature && feature.get("name")) {
        setSelectedFeature({
          coordinate: evt.coordinate,
          code: feature.get('code'),
          name: feature.get('name'),
          country: feature.get('country'),
          city: feature.get('city'),
          elevation: feature.get('elevation'),
          coordinates: feature.get('coordinates'),
        });
        overlay.current.setPosition(evt.coordinate);
      } else {
        setSelectedFeature(null);
        overlay.current.setPosition(undefined);
      }
    });

    mapInstance.current = map;
    Promise.resolve().then(() => setIsMapReady(true));

    return () => {
      map.setTarget(null);
      mapInstance.current = null;
      setIsMapReady(false);
    };
  }, []);

  // Sync data and options to the map
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !data) return;

    let cancelled = false;

    const updateMapData = async () => {
      setDistance(0);
      vectorSource.current.clear();
      const features = [];

      let totalDistance = 0;
      const getEnroute = customFieldsHook.getEnroute || (() => []);

      const airportPromises = data.map(async (flight) => {
        if (!flight.departure.place || !flight.arrival.place) return null;

        const [departure, arrival] = await Promise.all([
          getAirportData(flight.departure.place, airportsMap),
          getAirportData(flight.arrival.place, airportsMap),
        ]);

        if (!departure || !arrival) return null;

        addMarker(features, departure, options);
        addMarker(features, arrival, options);

        const fullRoute = [departure];
        const enrouteCodes = getEnroute(flight.custom_fields);

        if (enrouteCodes && Array.isArray(enrouteCodes)) {
          for (const code of enrouteCodes) {
            if (code !== flight.departure.place && code !== flight.arrival.place) {
              const airport = await getAirportData(code, airportsMap);
              if (airport) {
                fullRoute.push(airport);
                addMarker(features, airport, options);
              }
            }
          }
        }

        fullRoute.push(arrival);

        if (options.routes) {
          for (let i = 0; i < fullRoute.length - 1; i++) {
            drawGreatCircleLine(fullRoute[i], fullRoute[i + 1], vectorSource.current);
          }
        }

        if (options.tracks && flight.track) {
          drawTrackLog(flight.track, vectorSource.current, flight.uuid || flight.id);
        }

        totalDistance += flight.distance;

        return { departure, arrival };
      });

      await Promise.all(airportPromises);
      if (cancelled) return;

      setDistance(totalDistance);

      if (features.length > 0) {
        vectorSource.current.addFeatures(features);

        mapInstance.current.updateSize();
        mapInstance.current.getView().fit(vectorSource.current.getExtent(), {
          maxZoom: 16,
          padding: [30, 30, 30, 30],
          duration: 100,
        });
      }
    };

    updateMapData();

    return () => {
      cancelled = true;
    };
  }, [data, options, airportsMap, customFieldsHook.getEnroute, isMapReady]);

  const handleClosePopup = (e) => {
    e?.preventDefault();
    setSelectedFeature(null);
    overlay.current?.setPosition(undefined);
  };

  return (
    <>
      {data && (
        <>
          <Card variant="outlined" sx={{ ...sx, height: '85vh', position: 'relative' }}>
            <CardContent sx={{ height: '100%' }}>
              <CardHeader title={title} />
              <div ref={mapRef} style={{ width: '100%', height: 'calc(100% - 50px)', borderRadius: '4px', overflow: 'hidden' }}></div>
              {distance > 0 && (
                <Typography sx={{ mt: 1 }}>{`Distance: ${distance.toLocaleString(undefined, { maximumFractionDigits: 2 })} nm / ${(distance * 1.852).toLocaleString(undefined, { maximumFractionDigits: 2 })} km`}</Typography>
              )}
            </CardContent>
          </Card>
          <Card ref={containerRef} sx={{ display: selectedFeature ? 'block' : 'none' }}>
            <CardContent sx={{ position: 'relative', pt: 4 }}>
              <a href="#" id="popup-closer" onClick={handleClosePopup}></a>
              {selectedFeature && (
                <div id="popup-content">
                  <Typography variant="subtitle2" sx={{ mb: 1 }}><strong>Airport:</strong> {selectedFeature.code}</Typography>
                  <Typography variant="body2"><strong>Name:</strong> {selectedFeature.name}</Typography>
                  <Typography variant="body2"><strong>Country:</strong> {selectedFeature.country}</Typography>
                  <Typography variant="body2"><strong>City:</strong> {selectedFeature.city}</Typography>
                  <Typography variant="body2"><strong>Elevation:</strong> {selectedFeature.elevation}</Typography>
                  <Typography variant="body2"><strong>Lat/Lon:</strong> {selectedFeature.coordinates}</Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
};

export default FlightMap;