import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

export const AboutPage = () => {
  useEffect(() => {
    window.location.replace("https://github.com/vsimakhin/web-logbook");
  }, []);

  return (
    <>
      <LinearProgress />
      <Typography variant="body1">
        Redirecting to <Link to="https://github.com/vsimakhin/web-logbook">https://github.com/vsimakhin/web-logbook...</Link>
      </Typography>
    </>
  );
}

export default AboutPage;