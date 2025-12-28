import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchAirport = async ({ signal, id }) => {
  const url = `${API_URL}/airport/${id}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch airport');
}

export const fetchStandardAirports = async ({ signal }) => {
  const url = `${API_URL}/airport/standard-list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch airports');
}

export const fetchCustomAirports = async ({ signal }) => {
  const url = `${API_URL}/airport/custom-list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch airports');
}

export const fetchAirports = async ({ signal }) => {
  const url = `${API_URL}/airport/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch airports');
}

export const updateAirportsDB = async () => {
  const url = `${API_URL}/airport/update-db`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
  };
  return await handleFetch(url, options, 'Cannot update airports DB');
}

export const createCustomAirport = async ({ payload }) => {
  const url = `${API_URL}/airport/custom`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot create custom airport');
}

export const updateCustomAirport = async ({ payload }) => {
  const url = `${API_URL}/airport/custom`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot update custom airport');
}

export const deleteCustomAirport = async ({ payload }) => {
  const url = `${API_URL}/airport/custom`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot delete custom airport');
}