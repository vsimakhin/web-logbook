// MUI
import Grid from "@mui/material/Grid2";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";
import AircraftsTable from "./AircraftsTable";
import CategoriesTable from "./CategoriesTable";

export const Aircrafts = () => {

  return (
    <>
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Aircrafts" />
              <AircraftsTable />
            </CardContent>
          </Card >
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Types & Categories" />
              <CategoriesTable />
            </CardContent>
          </Card >
        </Grid>
      </Grid>
    </>
  );
}

export default Aircrafts;