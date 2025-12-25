import { TOKEN_KEY, USERNAME_KEY } from '../constants/constants';

export const removeAuthData = () => {
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export const setAuthData = (data) => {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USERNAME_KEY, data.username);
}

export const getAuthToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token;
}

export const authLoader = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const username = localStorage.getItem(USERNAME_KEY);
  return { token, username };
}
