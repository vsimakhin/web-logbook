import * as toGeoJSON from "@mapbox/togeojson";

// Generic function to parse both KML and GPX files
const parseTrackFileContent = (fileText, fileType) => {
  if (fileText.startsWith('\uFEFF') || fileText.charCodeAt(0) === 0xEF) {
    fileText = fileText.slice(3); // UTF-8 BOM
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(fileText, "text/xml");

  // For KML files, first try to handle gx:Track data directly
  if (fileType === 'kml') {
    const tracks = xmlDoc.getElementsByTagName('gx:Track');
    if (tracks.length > 0) {
      const extractedPoints = [];

      // Process track points with timestamps
      for (const track of tracks) {
        const whens = track.getElementsByTagName('when');
        const coords = track.getElementsByTagName('gx:coord');

        for (let i = 0; i < Math.min(whens.length, coords.length); i++) {
          const timestamp = new Date(whens[i].textContent).getTime();
          const [lng, lat, alt] = coords[i].textContent.split(' ').map(Number);
          extractedPoints.push({ timestamp, coords: [lat, lng] });
        }
      }

      // Process Placemarks (takeoffs, landings, etc.)
      const placemarks = xmlDoc.getElementsByTagName('Placemark');
      for (const placemark of placemarks) {
        const name = placemark.getElementsByTagName('name')[0]?.textContent;
        if (name && (name.includes('Takeoff:') || name.includes('Landing:'))) {
          const timeMatch = name.match(/\d{2} \w+ \d{4} \d{2}:\d{2}/);
          if (timeMatch) {
            const point = placemark.getElementsByTagName('coordinates')[0];
            if (point) {
              const [lng, lat] = point.textContent.trim().split(',').map(Number);
              const timestamp = new Date(timeMatch[0] + ' Z').getTime();
              extractedPoints.push({ timestamp, coords: [lat, lng] });
            }
          }
        }
      }

      if (extractedPoints.length > 0) {
        // Sort points by timestamp to maintain proper sequence
        extractedPoints.sort((a, b) => a.timestamp - b.timestamp);
        return extractedPoints.map(point => point.coords);
      }
    }
  }

  // Fallback to toGeoJSON for other cases
  const geojson = fileType === 'kml' ? toGeoJSON.kml(xmlDoc) : toGeoJSON.gpx(xmlDoc);

  const pointsWithTime = [];

  const processCoordinates = (coords, time, isPoint = false) => {
    try {
      if (isPoint) {
        // Handle different coordinate formats
        if (Array.isArray(coords)) {
          const [lng, lat] = coords;
          pointsWithTime.push({ coords: [lat, lng], time });
        } else if (typeof coords === 'string') {
          // Handle comma-separated string format (like in FlightRadar24 KMLs)
          const [lng, lat] = coords.split(',').map(Number);
          pointsWithTime.push({ coords: [lat, lng], time });
        }
      } else {
        if (Array.isArray(coords)) {
          coords.forEach(coord => {
            if (Array.isArray(coord)) {
              const [lng, lat] = coord;
              pointsWithTime.push({ coords: [lat, lng], time });
            } else if (typeof coord === 'string') {
              const [lng, lat] = coord.split(',').map(Number);
              pointsWithTime.push({ coords: [lat, lng], time });
            }
          });
        } else if (typeof coords === 'string') {
          // Handle single string of coordinates
          const [lng, lat] = coords.split(',').map(Number);
          pointsWithTime.push({ coords: [lat, lng], time });
        }
      }
    } catch (error) {
      console.error('Error processing coordinates:', error);
      // Continue processing other coordinates even if one fails
    }
  };

  geojson.features.forEach((feature) => {
    const { geometry, properties } = feature;
    if (!geometry) return;

    // Try to extract timestamp from properties
    let timestamp = null;
    if (properties) {
      // Common timestamp fields in KML/GPX
      if (properties.time || properties.timestamp) {
        timestamp = properties.time || properties.timestamp;
      }
      // Handle SkyDemon style timestamps in names
      else if (properties.name && properties.name.match(/\d{2} \w+ \d{4} \d{2}:\d{2}/)) {
        timestamp = new Date(properties.name.match(/\d{2} \w+ \d{4} \d{2}:\d{2}/)[0] + ' Z').getTime();
      }
      // Handle FlightRadar24 style timestamps in description (ATD/ETA format)
      else if (properties.description && properties.description.includes('UTC')) {
        const timeMatch = properties.description.match(/(\d{2}:\d{2})\s+UTC/);
        if (timeMatch) {
          // Extract date from description if available, otherwise use current date
          let dateMatch = properties.description.match(/(\d{4}-\d{2}-\d{2})/);
          let date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
          timestamp = new Date(`${date}T${timeMatch[1]}Z`).getTime();
        }
      }
    }

    if (geometry.type === 'Point') {
      processCoordinates(geometry.coordinates, timestamp, true);
    } else if (geometry.type === 'LineString') {
      processCoordinates(geometry.coordinates, timestamp);
    } else if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach((lineCoords) => {
        processCoordinates(lineCoords, timestamp);
      });
    } else if (geometry.type === 'MultiGeometry' && geometry.geometries) {
      geometry.geometries.forEach((g) => {
        if (g.type === 'Point') {
          processCoordinates(g.coordinates, timestamp, true);
        } else if (g.type === 'LineString') {
          processCoordinates(g.coordinates, timestamp);
        }
      });
    }
  });

  // Sort points by timestamp if available, otherwise keep original order
  if (pointsWithTime.some(p => p.time !== null)) {
    pointsWithTime.sort((a, b) => {
      if (a.time === null) return 1;
      if (b.time === null) return -1;
      return a.time - b.time;
    });
  }

  return pointsWithTime.map(p => p.coords);
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

