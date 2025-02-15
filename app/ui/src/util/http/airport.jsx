import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchAirport = async ({ signal, id, navigate }) => {
  const url = `${API_URL}/airport/${id}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch airport');
}

export const fetchStandardAirports = async ({ signal, navigate }) => {
  const url = `${API_URL}/airport/standard-list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch airports');
}

export const fetchCustomAirports = async ({ signal, navigate }) => {
  const url = `${API_URL}/airport/custom-list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch airports');
}

export const fetchAirports = async ({ signal, navigate }) => {
  const url = `${API_URL}/airport/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch airports');
}

export const updateAirportsDB = async ({ navigate }) => {
  const url = `${API_URL}/airport/update-db`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
  };
  return await handleFetch(url, options, navigate, 'Cannot update airports DB');
}

export const createCustomAirport = async ({ payload, navigate }) => {
  const url = `${API_URL}/airport/custom`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, navigate, 'Cannot create custom airport');
}

export const updateCustomAirport = async ({ payload, navigate }) => {
  const url = `${API_URL}/airport/custom`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, navigate, 'Cannot update custom airport');
}

export const deleteCustomAirport = async ({ payload, navigate }) => {
  const url = `${API_URL}/airport/custom`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, navigate, 'Cannot delete custom airport');
}