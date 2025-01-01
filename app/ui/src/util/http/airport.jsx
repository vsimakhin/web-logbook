import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchAirport = async ({ signal, id, navigate }) => {
  const url = `${API_URL}/airport/${id}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch airport');
}