import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchAircraftModels = async ({ signal, navigate }) => {
  const url = `${API_URL}/aircraft/models`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch aircraft models');
}

export const fetchAircraftRegs = async ({ signal, navigate, last = true }) => {
  const url = `${API_URL}/aircraft/logbook${last ? '/last' : ''}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch aircraft regs');
}

export const fetchAircrafts = async ({ signal, navigate }) => {
  const url = `${API_URL}/aircraft/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch aircrafts');
}

export const fetchAircraftCategories = async ({ signal, navigate }) => {
  const url = `${API_URL}/aircraft/categories`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch aircraft categories');
}

export const updateAircraftModelsCategories = async ({ payload, navigate }) => {
  const url = `${API_URL}/aircraft/models-categories`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, navigate, 'Cannot update aircraft');
}

export const fetchAircraftModelsCategories = async ({ signal, navigate }) => {
  const url = `${API_URL}/aircraft/models-categories`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch aircraft models and categories');
}
