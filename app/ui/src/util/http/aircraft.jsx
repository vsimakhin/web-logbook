import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchAircraftModels = async ({ signal, navigate }) => {
  const url = `${API_URL}/aircraft/models`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch aircraft models');
}

export const fetchAircraftRegs = async ({ signal, navigate, last = true }) => {
  const url = `${API_URL}/aircraft/list${last ? '/last' : ''}`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, navigate, 'Cannot fetch aircraft regs');
}