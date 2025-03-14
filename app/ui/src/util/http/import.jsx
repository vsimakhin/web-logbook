import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const runImport = async ({ payload, navigate }) => {
  const url = `${API_URL}/import/run`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, navigate, 'Cannot run import');
}
