import { SignInPage } from '@toolpad/core/SignInPage';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../constants/constants';
import { setAuthData } from '../util/auth';

const providers = [{ id: 'credentials', name: 'Email and Password' }];

export const SignIn = () => {
  const navigate = useNavigate();

  return (
    <SignInPage
      signIn={async (provider, formData) => {
        const payload = {
          login: formData.get('email'),
          password: formData.get('password'),
        };

        if (!payload.login || !payload.password) {
          return {
            type: 'CredentialsSignin',
            error: 'Email and password are required.',
          };
        }

        try {
          const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json(); // Assuming the server sends error details in the response body
            return {
              type: 'CredentialsSignin',
              error: errorData.message || response.statusText || 'Invalid credentials.',
            };
          }

          const data = await response.json();
          setAuthData(data);
          navigate('/');
        } catch (error) {
          return {
            type: 'CredentialsSignin',
            error: error.message || 'An unknown error occurred.',
          };
        }
      }}
      slotProps={{
        emailField: { variant: 'standard' },
        passwordField: { variant: 'standard' },
        submitButton: { variant: 'outlined' },
      }}
      providers={providers}
    />
  );
};

export default SignIn;