import * as toGeoJSON from "@mapbox/togeojson";

// Generic function to parse both KML and GPX files
const parseTrackFileContent = (fileText, fileType) => {
  if (fileText.startsWith('\uFEFF') || fileText.charCodeAt(0) === 0xEF) {
    fileText = fileText.slice(3); // UTF-8 BOM
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(fileText, "text/xml");

  // Use appropriate toGeoJSON method based on file type
  const geojson = fileType === 'kml' ? toGeoJSON.kml(xmlDoc) : toGeoJSON.gpx(xmlDoc);

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
    } else if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach((lineCoords) => {
        processCoordinates(lineCoords);
      });
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

// Generic parser that detects file type and uses appropriate parser
export const parseTrackFile = (fileText, fileName) => {
  const extension = fileName.toLowerCase().split('.').pop();

  if (extension === 'kml' || extension === 'gpx') {
    return parseTrackFileContent(fileText, extension);
  } else {
    throw new Error(`Unsupported file format: ${extension}`);
  }
};

