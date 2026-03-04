import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchFlightRecordAttachments = async ({ signal, id }) => {
  const url = `${API_URL}/attachment/list/${id}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch attachments for the flight record');
}

export const fetchAttachments = async ({ signal }) => {
  const url = `${API_URL}/attachment/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch attachments');
}

export const downloadAttachments = async ({ payload }) => {
  const url = `${API_URL}/attachment/zip-download`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot download attachments', false);
}

export const fetchAttachment = async ({ id }) => {
  const url = `${API_URL}/attachment/${id}`;
  const options = {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
  };
  return await handleFetch(url, options, 'Cannot fetch attachment');
}

export const deleteAttachment = async ({ id }) => {
  const url = `${API_URL}/attachment/${id}`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
  };
  return await handleFetch(url, options, 'Cannot delete attachment');
}

export const uploadAttachement = async ({ payload }) => {
  const url = `${API_URL}/attachment/upload`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: payload,
  };
  return await handleFetch(url, options, 'Cannot upload attachment', false);
}