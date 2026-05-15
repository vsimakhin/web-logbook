import { useEffect, useRef, useState } from 'react';
// css
import 'ol/ol.css';
// openlayers
import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import FullScreen from 'ol/control/FullScreen';
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
import { DEFAULT_MAP_OPTIONS, drawGreatCircleLine, drawTrackLog, addMarker, MAP_OPTIONS_NAME, getMapBase } from './helpers';
import MapOptionsButton from './MapOptionsButton';
import { CODEC_JSON, useLocalStorageState } from '../../hooks/useLocalStorageState';

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

export const FlightMap = ({ data, title = "Flight Map", sx, airportsMap }) => {
  const [options] = useLocalStorageState(MAP_OPTIONS_NAME, DEFAULT_MAP_OPTIONS, { codec: CODEC_JSON });

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

    const mapLayer = getMapBase(options.map_base);

    const mapInstance = new Map({
      target: mapRef.current,
      layers: [mapLayer, vectorLayer],
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
  }, [options.map_base]);

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

        if (options.routes.enabled) {
          for (let i = 0; i < fullRoute.length - 1; i++) {
            drawGreatCircleLine(fullRoute[i], fullRoute[i + 1], vectorSourceRef.current, options.routes.color, options.routes.thickness);
          }
        }

        if (options.tracks.enabled && flight.track) {
          drawTrackLog(flight.track, vectorSourceRef.current, flight.uuid || flight.id, options.tracks.color, options.tracks.thickness);
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
          <CardHeader title={title}
            action={
              <>
                <DownloadMapButton map={map} />
                <MapOptionsButton />
              </>
            } />
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