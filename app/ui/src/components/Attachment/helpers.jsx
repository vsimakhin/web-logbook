import * as toGeoJSON from "@mapbox/togeojson";

export const parseKML = (fileText) => {
  if (fileText.startsWith('\uFEFF') || fileText.charCodeAt(0) === 0xEF) {
    fileText = fileText.slice(3); // UTF-8 BOM
  }

  const parser = new DOMParser();
  const kml = parser.parseFromString(fileText, "text/xml");
  const geojson = toGeoJSON.kml(kml);

  const extractedCoordinates = [];

  const processCoordinates = (coords, isPoint = false) => {
    if (isPoint) {
      const [lng, lat] = coords;
      extractedCoordinates.push([lat, lng]);
    } else {
      coords.forEach(([lng, lat]) => {
        extractedCoordinates.push([lat, lng]);
      });
    }
  };

  geojson.features.forEach((feature) => {
    const { geometry } = feature;
    if (!geometry) return;

    if (geometry.type === 'Point') {
      processCoordinates(geometry.coordinates, true);
    } else if (geometry.type === 'LineString') {
      processCoordinates(geometry.coordinates);
    } else if (geometry.type === 'MultiGeometry' && geometry.geometries) {
      geometry.geometries.forEach((g) => {
        if (g.type === 'Point') {
          processCoordinates(g.coordinates, true);
        } else if (g.type === 'LineString') {
          processCoordinates(g.coordinates);
        }
      });
    }
  });

  return extractedCoordinates;
};

