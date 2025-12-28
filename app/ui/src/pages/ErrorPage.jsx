import { useRouteError, useNavigate, Link } from "react-router-dom";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  console.error(error);

  return (
    <Container maxWidth="md" style={{ textAlign: 'center', marginTop: '20vh' }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        <ErrorOutlineIcon style={{ fontSize: 100 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Arrr!
        </Typography>
        <Typography variant="body1" gutterBottom>
          Something unexpected has occurred.
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2, mb: 4 }}>
          {error.status} - {error.statusText || error.message}
        </Typography>
        <Typography variant="body1" gutterBottom>
          If you think this is a bug, please report it here&nbsp;
          <Link to="https://github.com/vsimakhin/web-logbook/issues"
            style={{ textDecoration: 'underline', color: "inherit" }}>
            https://github.com/vsimakhin/web-logbook/issues
          </Link>
          &nbsp; with an error message and steps to reproduce.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 4 }}>
          <i>{JSON.stringify(error)}</i>
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Go to Logbook
        </Button>
      </Box>
    </Container>
  );
}
export default ErrorPage;