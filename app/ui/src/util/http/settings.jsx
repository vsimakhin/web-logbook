import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchSettings = async ({ signal, navigate }) => {
  const url = `${API_URL}/settings/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch settings');
}

export const updateSettings = async ({ signal, settings, navigate }) => {
  const url = `${API_URL}/settings/general`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    signal: signal,
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, navigate, 'Cannot update settings');
}

export const updateSignature = async ({ signal, settings, navigate }) => {
  const url = `${API_URL}/settings/signature`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    signal: signal,
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, navigate, 'Cannot update signature');
}