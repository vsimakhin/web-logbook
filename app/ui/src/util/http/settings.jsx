import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchSettings = async ({ signal }) => {
  const url = `${API_URL}/settings/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch settings');
}

export const updateSettings = async ({ settings }) => {
  const url = `${API_URL}/settings/general`;
  settings.licenses_expiration.warning_period = parseInt(settings.licenses_expiration.warning_period) || 90;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, 'Cannot update settings');
}

export const updateSignature = async ({ settings }) => {
  const url = `${API_URL}/settings/signature`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, 'Cannot update signature');
}

export const updateAirportsDBSettings = async ({ settings }) => {
  const url = `${API_URL}/settings/airports`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, 'Cannot update airports DB settings');
}

export const fetchPdfDefaults = async ({ signal, format }) => {
  const url = `${API_URL}/settings/export/defaults/${format}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch defaults');
}

export const updatePdfSettings = async ({ settings, format }) => {
  const url = `${API_URL}/settings/export/${format}`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, 'Cannot update export settings');
}

export const fetchVersion = async ({ signal }) => {
  const url = `${API_URL}/version`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch version');
}

export const fetchAuthEnabled = async ({ signal }) => {
  const url = `${API_URL}/auth-enabled`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch auth enabled property');
}

export const fetchLatestRelease = async ({ signal }) => {
  const url = 'https://api.github.com/repos/vsimakhin/web-logbook/releases/latest'
  const options = {
    method: 'GET',
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch latest release');
}

export const fetchStandardFields = async ({ signal }) => {
  const url = `${API_URL}/settings/standard-fields`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch standard fields');
}