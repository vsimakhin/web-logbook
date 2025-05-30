import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchCustomFields = async ({ signal, navigate }) => {
  const url = `${API_URL}/custom-fields/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch custom fields');
}

export const fetchCustomField = async ({ uuid, signal, navigate }) => {
  const url = `${API_URL}/custom-fields/${uuid}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch custom field');
}

export const createCustomField = async ({ field, navigate }) => {
  const url = `${API_URL}/custom-fields/new`;

  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(field),
  };
  return await handleFetch(url, options, navigate, 'Cannot create new custom field');
}

export const updateCustomField = async ({ field, navigate }) => {
  const url = `${API_URL}/custom-fields/${field.uuid}`;

  field.time_frame.value = parseInt(field.time_frame.value) || 0;
  field.target_value = parseInt(field.target_value) || 0;

  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(field),
  };
  return await handleFetch(url, options, navigate, 'Cannot update custom field');
}

export const deleteCustomField = async ({ uuid, navigate }) => {
  const url = `${API_URL}/custom-fields/${uuid}`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
  };
  return await handleFetch(url, options, navigate, 'Cannot delete custom field');
}