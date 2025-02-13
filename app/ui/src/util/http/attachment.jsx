import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchAttachments = async ({ signal, id, navigate }) => {
  const url = `${API_URL}/attachment/list/${id}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch attachments');
}

export const fetchAttachment = async ({ id, navigate }) => {
  const url = `${API_URL}/attachment/${id}`;
  const options = {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch attachment');
}

export const deleteAttachment = async ({ id, navigate }) => {
  const url = `${API_URL}/attachment/${id}`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
  };
  return await handleFetch(url, options, navigate, 'Cannot delete attachment');
}

export const uploadAttachement = async ({ payload, navigate }) => {
  const url = `${API_URL}/attachment/upload`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: payload,
  };
  return await handleFetch(url, options, navigate, 'Cannot upload attachment', false);
}