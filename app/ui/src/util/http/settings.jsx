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

export const updateSettings = async ({ settings, navigate }) => {
  const url = `${API_URL}/settings/general`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, navigate, 'Cannot update settings');
}

export const updateSignature = async ({ settings, navigate }) => {
  const url = `${API_URL}/settings/signature`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, navigate, 'Cannot update signature');
}

export const updateAirportsDBSettings = async ({ settings, navigate }) => {
  const url = `${API_URL}/settings/airports`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, navigate, 'Cannot update airports DB settings');
}

export const fetchPdfDefaults = async ({ signal, format, navigate }) => {
  const url = `${API_URL}/settings/export/defaults/${format}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch defaults');
}

export const updatePdfSettings = async ({ settings, format, navigate }) => {
  const url = `${API_URL}/settings/export/${format}`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  };
  return await handleFetch(url, options, navigate, 'Cannot update export settings');
}

export const fetchVersion = async ({ signal, navigate }) => {
  const url = `${API_URL}/version`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch version');
}

export const fetchAuthEnabled = async ({ signal, navigate }) => {
  const url = `${API_URL}/auth-enabled`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch auth enabled property');
}

export const fetchLatestRelease = async ({ signal }) => {
  const url = 'https://api.github.com/repos/vsimakhin/web-logbook/releases/latest'
  const options = {
    method: 'GET',
    signal: signal,
  };
  return await handleFetch(url, options, null, 'Cannot fetch latest release');
}

export const fetchStandardFields = async ({ signal, navigate }) => {
  const url = `${API_URL}/settings/standard-fields`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch standard fields');
}