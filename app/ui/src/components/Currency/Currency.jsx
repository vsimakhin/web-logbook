// MUI
import Grid from "@mui/material/Grid2";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../UIElements/CardHeader";
import CurrencyTable from "./CurrencyTable";

export const Currency = () => {

  return (
    <Grid container spacing={1} >
      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <CardHeader title="Currency" />
            <CurrencyTable />
          </CardContent>
        </Card >
      </Grid>
    </Grid>
  );
}

export default Currency;