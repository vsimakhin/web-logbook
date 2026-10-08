import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchAircrafts = async ({ signal }) => {
  const url = `${API_URL}/aircraft/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch aircrafts');
}

export const updateAircraftModelsCategories = async ({ payload }) => {
  const url = `${API_URL}/aircraft/models-categories`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot update aircraft');
}

export const fetchAircraftModelsCategories = async ({ signal }) => {
  const url = `${API_URL}/aircraft/models-categories`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch aircraft models and categories');
}

export const updateAircraft = async ({ payload }) => {
  const url = `${API_URL}/aircraft/update`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot update aircraft');
}