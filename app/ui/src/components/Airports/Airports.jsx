// MUI
import Grid from "@mui/material/Grid";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import StandardAirportsTable from "./StandardAirportsTable";
import AirportsDB from "./AirportsDB";
import CustomAirportsTable from "./CustomAirportsTable";

export const Airports = () => {
  return (
    <>
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <StandardAirportsTable />
            </CardContent>
          </Card >
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <AirportsDB />
            </CardContent>
          </Card >

          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CustomAirportsTable />
            </CardContent>
          </Card >
        </Grid>
      </Grid>
    </>
  );
}

export default Airports;