import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchExport = async (format) => {
  const url = `${API_URL}/export/${format}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
  };
  const blob = await handleFetch(url, options, null, 'Cannot export logbook data', false);
  return blob;
}

export const uploadCustomTitle = async ({ payload, navigate }) => {
  const url = `${API_URL}/export/custom-title`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: payload,
  };
  return await handleFetch(url, options, navigate, 'Cannot upload custom title', false);
}