import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// MUI
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
// MUI Icons
import FlightTakeoffOutlinedIcon from '@mui/icons-material/FlightTakeoffOutlined';
// Custom
import { API_URL } from '../constants/constants';
import { setAuthData } from '../util/auth';

export const SignIn = () => {
  const navigate = useNavigate();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setError('');

    if (!login || !password) {
      setError('Login and password are required.');
      return;
    }

    setLoading(true);
    const payload = { login: login, password: password };

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || response.statusText || 'Invalid credentials.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAuthData(data);
      navigate('/');
    } catch (err) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  }, [login, password, navigate]);

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Avatar sx={{ m: 1 }}><FlightTakeoffOutlinedIcon /></Avatar>
          <Typography component="h1" variant="h5">Sign in to Web Logbook</Typography>
          {error && (<Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>)}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="login"
              label="Login"
              name="login"
              autoComplete="login"
              autoFocus
              variant="standard"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              variant="standard"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="outlined"
              sx={{ mt: 3, mb: 2, p: 1 }}
              disabled={loading}
              color='inherit'
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignIn;