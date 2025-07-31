import { handleFetch } from './http';
import { API_URL, tableJSONCodec } from '../../constants/constants';
import { getAuthToken } from '../auth';

const prepareFlightDataForAPI = (flight) => {
  // Ensure custom_fields is properly marshalled as JSON string
  // If it's already a string, parse it first to avoid double stringification
  let customFieldsObj;
  if (typeof flight.custom_fields === 'string') {
    try {
      customFieldsObj = JSON.parse(flight.custom_fields);
    } catch {
      customFieldsObj = {};
    }
  } else {
    customFieldsObj = flight.custom_fields || {};
  }
  flight.custom_fields = JSON.stringify(customFieldsObj);

  flight.landings.day = parseInt(flight.landings.day) || 0;
  flight.landings.night = parseInt(flight.landings.night) || 0;

  return flight;
}

export const fetchLogbookData = async ({ signal, navigate }) => {
  const url = `${API_URL}/logbook/data`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  const response = await handleFetch(url, options, navigate, 'Cannot fetch logbook data');

  return response?.map(flight => ({
    ...flight,
    custom_fields: tableJSONCodec.parse(flight.custom_fields)
  })) || response;
}

export const fetchLogbookMapData = async ({ signal, navigate }) => {
  const url = `${API_URL}/logbook/mapdata`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch logbook map data');
}

export const fetchFlightData = async ({ signal, id, navigate }) => {
  const url = `${API_URL}/logbook/${id}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };

  const response = await handleFetch(url, options, navigate, 'Cannot fetch flight data');

  if (response) {
    return {
      ...response,
      custom_fields: tableJSONCodec.parse(response.custom_fields)
    };
  }

  return response;
}

export const fetchNightTime = async ({ signal, flight, navigate }) => {
  const url = `${API_URL}/logbook/night`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(prepareFlightDataForAPI(flight)),
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch night time');
}

export const deleteFlightRecord = async ({ signal, id, navigate }) => {
  const url = `${API_URL}/logbook/${id}`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot delete flight record');
}

export const createFlightRecord = async ({ signal, flight, navigate }) => {
  const url = `${API_URL}/logbook/new`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    signal: signal,
    body: JSON.stringify(prepareFlightDataForAPI(flight)),
  };
  return await handleFetch(url, options, navigate, 'Cannot create flight record');
}

export const updateFlightRecord = async ({ signal, flight, navigate }) => {
  const url = `${API_URL}/logbook/${flight.uuid}`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    signal: signal,
    body: JSON.stringify(prepareFlightDataForAPI(flight)),
  };
  return await handleFetch(url, options, navigate, 'Cannot update flight record');
}

export const uploadTrackLog = async ({ id, track, navigate }) => {
  const url = `${API_URL}/logbook/track/${id}`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(track),
  };
  return await handleFetch(url, options, navigate, 'Cannot upload track log');
}

export const resetTrackLog = async ({ id, navigate }) => {
  const url = `${API_URL}/logbook/track/${id}`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
  };
  return await handleFetch(url, options, navigate, 'Cannot reset track log');
}

export const fetchDistance = async ({ signal, departure, arrival, navigate }) => {
  if (!departure || !arrival) {
    return 0;
  }

  const url = `${API_URL}/distance/${departure}/${arrival}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch distance');
}