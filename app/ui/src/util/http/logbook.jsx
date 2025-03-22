import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchLogbookData = async ({ signal, navigate }) => {
  const url = `${API_URL}/logbook/data`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch logbook data');
}

export const fetchFlightData = async ({ signal, id, navigate }) => {
  const url = `${API_URL}/logbook/${id}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch flight data');
}

export const fetchNightTime = async ({ signal, flight, navigate }) => {
  const url = `${API_URL}/logbook/night`;

  flight.landings.day = parseInt(flight.landings.day) || 0;
  flight.landings.night = parseInt(flight.landings.night) || 0;

  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(flight),
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

  flight.landings.day = parseInt(flight.landings.day) || 0;
  flight.landings.night = parseInt(flight.landings.night) || 0;

  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    signal: signal,
    body: JSON.stringify(flight),
  };
  return await handleFetch(url, options, navigate, 'Cannot create flight record');
}

export const updateFlightRecord = async ({ signal, flight, navigate }) => {
  const url = `${API_URL}/logbook/${flight.uuid}`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    signal: signal,
    body: JSON.stringify(flight),
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
