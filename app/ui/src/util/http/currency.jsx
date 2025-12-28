import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const fetchCurrency = async ({ signal }) => {
  const url = `${API_URL}/currency/list`;
  const options = {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    signal: signal,
  };
  return await handleFetch(url, options, 'Cannot fetch currencies');
}

export const createCurrency = async ({ currency }) => {
  const url = `${API_URL}/currency/new`;

  currency.time_frame.value = parseInt(currency.time_frame.value) || 0;
  currency.target_value = parseInt(currency.target_value) || 0;

  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(currency),
  };
  return await handleFetch(url, options, 'Cannot create new currency');
}

export const updateCurrency = async ({ currency }) => {
  const url = `${API_URL}/currency/${currency.uuid}`;

  currency.time_frame.value = parseInt(currency.time_frame.value) || 0;
  currency.target_value = parseInt(currency.target_value) || 0;

  const options = {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(currency),
  };
  return await handleFetch(url, options, 'Cannot update currency');
}

export const deleteCurrency = async ({ uuid }) => {
  const url = `${API_URL}/currency/${uuid}`;
  const options = {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
  };
  return await handleFetch(url, options, 'Cannot delete currency');
}