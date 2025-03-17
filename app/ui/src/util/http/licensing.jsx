import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchLicenses = async ({ signal, navigate }) => {
  const url = `${API_URL}/licensing/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch licenses');
}

export const fetchLicense = async ({ signal, navigate, id }) => {
  const url = `${API_URL}/licensing/${id}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch license');
}

export const createLicenseRecord = async ({ payload, navigate }) => {
  const url = `${API_URL}/licensing/new`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: payload,
  };
  return await handleFetch(url, options, navigate, 'Cannot create license record', false);
}

export const updateLicenseRecord = async ({ uuid, payload, navigate }) => {
  const url = `${API_URL}/licensing/${uuid}`;
  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: payload,
  };
  return await handleFetch(url, options, navigate, 'Cannot update license record', false);
}

export const fetchLicenseCategory = async ({ signal, navigate }) => {
  const url = `${API_URL}/licensing/categories`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch categories');
}

export const deleteLicenseRecord = async ({ signal, id, navigate }) => {
  const url = `${API_URL}/licensing/${id}`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot delete license record');
}

export const deleteLicenseRecordAttachment = async ({ signal, id, navigate }) => {
  const url = `${API_URL}/licensing/${id}/attachment`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot delete license record attachment');
}