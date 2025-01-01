import { redirect } from 'react-router-dom';

const TOKEN_KEY = 'token';

export const removeAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
}

export const setAuthData = (data) => {
  localStorage.setItem(TOKEN_KEY, data.token);
}

export const getAuthToken = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  return token;
}

export const authLoader = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) { return redirect('/signin') }

  return { token };
}
