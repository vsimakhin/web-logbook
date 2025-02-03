import { removeAuthData, getAuthToken } from '../util/auth';
import { API_URL } from '../constants/constants';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const LogoutPage = () => {
  const navigate = useNavigate();
  const token = getAuthToken();

  useEffect(() => {
    const fetchLogout = async () => {
      await fetch(`${API_URL}/logout`, {
        method: 'post',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    fetchLogout();
    removeAuthData();
    navigate('/signin');
  }, [token, navigate]);
}

export default LogoutPage;