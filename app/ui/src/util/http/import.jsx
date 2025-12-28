import { handleFetch } from './http';
import { API_URL } from '../../constants/constants';
import { getAuthToken } from '../auth';

export const runImport = async ({ payload }) => {
  const url = `${API_URL}/import/run`;
  const options = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    body: JSON.stringify(payload),
  };
  return await handleFetch(url, options, 'Cannot run import');
}

