import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import TextField from "../../UIElements/TextField";

export const LicensesExpiration = ({ settings, handleChange }) => {
  return (
    <Grid container spacing={1} sx={{ mt: 1 }}>
      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ display: { xs: "none", sm: "flex" } }}>Licenses Expiration & Notifications in Navigation Bar</Typography>
          <Typography sx={{ display: { xs: "flex", sm: "none" } }}>Licenses Expiration</Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>
      </Grid>
      <TextField gsize={{ xs: 12, sm: 3, md: 3, lg: 3, xl: 3 }}
        id="licenses_expiration.warning_period"
        label="Warning Period (days)"
        handleChange={handleChange}
        value={settings?.licenses_expiration?.warning_period || 90}
        tooltip="Number of days before expiration to start showing warnings (Navigation Bar and Licensing Table)"
        type="number"
        inputProps={{ min: 1 }}
      />
      <Grid size={{ sm: 1, md: 1, lg: 1, xl: 1 }} sx={{ display: { xs: "none", sm: "flex" } }}><Box sx={{ width: '100%' }}></Box></Grid>
      <Grid size={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
        <FormControlLabel label="Show Warning" sx={{ width: '100%' }}
          control={
            <Switch checked={settings?.licenses_expiration?.show_warning ?? false} onChange={(event) => handleChange("licenses_expiration.show_warning", event.target.checked)} />
          }
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
        <FormControlLabel label="Show Expired" sx={{ width: '100%' }}
          control={
            <Switch checked={settings?.licenses_expiration?.show_expired ?? false} onChange={(event) => handleChange("licenses_expiration.show_expired", event.target.checked)} />
          }
        />
      </Grid>
    </Grid>
  );
};

export default LicensesExpiration;