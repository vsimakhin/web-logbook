import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient();

const handle401 = (response, navigate) => {
  if (response.status === 401) {
    if (navigate) {
      return navigate('/signin', 401);
    }
  }
  return;
}

export const handleFetch = async (url, options, navigate, errorMessage, returnJson = true) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    handle401(response, navigate);
    const error = new Error(response.statusText || errorMessage);
    error.code = response.status;
    try {
      error.info = await response.json();
    }
    catch (e) {
      console.log(e);
      error.info = { message: `${errorMessage} ${response.statusText && " - " + response.statusText}` };
    }
    throw error;
  }

  return returnJson ? await response.json() : await response.blob();
}