import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchDBFileName = async ({ signal }) => {
  const url = `${API_URL}/db/filename`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch db filename');
}

export const uploadDBFile = async ({ payload }) => {
  const url = `${API_URL}/db/upload-db`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: payload,
  };
  return await handleFetch(url, options, 'Cannot upload database', false);
}

export const downloadDBFile = async () => {
  const url = `${API_URL}/db/download-db`;
  const options = {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
  };
  return await handleFetch(url, options, 'Cannot download database', false);
}