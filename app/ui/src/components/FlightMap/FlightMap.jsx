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
// MUI UI elements
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
// Custom components and libraries
import { CardHeader } from '../UIElements/CardHeader';
import { queryClient } from '../../util/http/http';
import { fetchAirport } from '../../util/http/airport';
import { DownloadMapButton } from './DownloadMapButton';
import useCustomFields from '../../hooks/useCustomFields';

import icon1 from "../../assets/favicon.ico";
import icon2 from "../../assets/map-pin.png";

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

const createGeodesicLine = (start, end, segments = 64) => {
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

const drawGreatCircleLine = (departure, arrival, vectorSource) => {
  const geometry = createGeodesicLine(departure, arrival)
  const routeFeature = new Feature({ geometry, type: 'route' })
  vectorSource.addFeature(routeFeature)
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

export const FlightMap = ({ data, options = DEFAULT_OPTIONS, title = "Flight Map", sx, airportsMap }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // OpenLayers persistent objects
  const mapRefInstance = useRef(null);
  const vectorSourceRef = useRef(new VectorSource());
  const overlayRef = useRef(null);

  const customFieldsHook = useCustomFields() || {};

  const [map, setMap] = useState(null);
  const [distance, setDistance] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    overlayRef.current = new Overlay({ element: containerRef.current });
    const vectorLayer = new VectorLayer({ source: vectorSourceRef.current });

    const mapInstance = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view: new View({
        center: transform([10, 45], "EPSG:4326", "EPSG:3857"),
        zoom: 4,
      }),
      controls: [new FullScreen()],
      overlays: [overlayRef.current],
    });

    mapInstance.on("singleclick", (evt) => {
      const feature = mapInstance.forEachFeatureAtPixel(evt.pixel, (f) => f);

      if (feature && feature.get("name")) {
        setSelectedFeature({
          coordinate: evt.coordinate,
          code: feature.get("code"),
          name: feature.get("name"),
          country: feature.get("country"),
          city: feature.get("city"),
          elevation: feature.get("elevation"),
          coordinates: feature.get("coordinates"),
        });

        overlayRef.current.setPosition(evt.coordinate);
      } else {
        setSelectedFeature(null);
        overlayRef.current.setPosition(undefined);
      }
    });

    mapRefInstance.current = mapInstance;
    setMap(mapInstance);

    return () => {
      mapInstance.setTarget(null);
      mapRefInstance.current = null;
      setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map || !data) return;

    let cancelled = false;

    const updateMapData = async () => {
      setDistance(0);
      vectorSourceRef.current.clear();

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

        if (Array.isArray(enrouteCodes)) {
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
            drawGreatCircleLine(fullRoute[i], fullRoute[i + 1], vectorSourceRef.current);
          }
        }

        if (options.tracks && flight.track) {
          drawTrackLog(flight.track, vectorSourceRef.current, flight.uuid || flight.id);
        }

        totalDistance += flight.distance;

        return { departure, arrival };
      });

      await Promise.all(airportPromises);
      if (cancelled) return;

      setDistance(totalDistance);

      if (features.length > 0) {
        vectorSourceRef.current.addFeatures(features);
        map.updateSize();
        map.getView().fit(vectorSourceRef.current.getExtent(), {
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
  }, [map, data, options, airportsMap, customFieldsHook.getEnroute]);

  const handleClosePopup = (e) => {
    e?.preventDefault();
    setSelectedFeature(null);
    overlayRef.current?.setPosition(undefined);
  };

  if (!data) return null;

  return (
    <>
      <Card variant="outlined" sx={{ ...sx, height: "85vh", position: "relative" }}>
        <CardContent sx={{ height: "100%" }}>
          <CardHeader title={title} action={map ? <DownloadMapButton map={map} /> : null} />
          <div ref={mapRef} style={{ width: "100%", height: "calc(100% - 50px)", borderRadius: "4px", overflow: "hidden" }} />
          {distance > 0 && (
            <Typography sx={{ mt: 1 }}>
              {`Distance: ${distance.toLocaleString(undefined, { maximumFractionDigits: 2, })} nm / ${(distance * 1.852).toLocaleString(undefined, { maximumFractionDigits: 2, })} km`}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card ref={containerRef} sx={{ display: selectedFeature ? "block" : "none" }}>
        <CardContent sx={{ position: "relative", pt: 4 }}>
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
  );
};

export default FlightMap;