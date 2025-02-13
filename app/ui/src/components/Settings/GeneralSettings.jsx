// MUI UI elements
import Grid from "@mui/material/Grid2";
// Custom
import TextField from "../UIElements/TextField";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

export const GeneralSettings = ({ settings, handleChange }) => {
  const enableAuth = (enabled) => {
    handleChange("auth_enabled", enabled);

    if (enabled) {
      // Generate 32 random bytes (256 bits)
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const base64Key = btoa(String.fromCharCode.apply(null, array));
      handleChange("secret_key", base64Key);
    }
  }

  return (
    <>
      <Grid container spacing={1}>
        <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="owner_name"
          label="Owner Name"
          handleChange={handleChange}
          value={settings.owner_name ?? ""}
          tooltip="Owner Name"
        />
        <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="license_number"
          label="License Number"
          handleChange={handleChange}
          value={settings.license_number ?? ""}
          tooltip="License Number"
        />
        <TextField gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          id="address"
          label="Address"
          handleChange={handleChange}
          value={settings.address ?? ""}
          tooltip="Address"
        />
        <TextField gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          id="signature_text"
          label="Signature Text"
          handleChange={handleChange}
          value={settings.signature_text ?? ""}
          tooltip="Signature Text"
        />
      </Grid >

      <Divider sx={{ m: 1 }} />

      <FormControlLabel
        control={
          <Switch
            checked={settings?.auth_enabled ?? false}
            onChange={(event) => enableAuth(event.target.checked)}
          />
        }
        label="Enable Authentication"
      />
      <Grid container spacing={1}>
        <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="login"
          label="Login"
          handleChange={handleChange}
          value={settings.login ?? ""}
          tooltip="Login"
          disabled={!settings.auth_enabled}
        />
        <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="password"
          label="Password"
          handleChange={handleChange}
          value={settings.password ?? ""}
          tooltip="Password"
          disabled={!settings.auth_enabled}
          type="password"
        />
        <TextField gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          id="secret_key"
          label="Secret Key"
          handleChange={handleChange}
          value={settings.secret_key ?? ""}
          tooltip="Secret Key"
          disabled={!settings.auth_enabled}
        />
      </Grid>
    </>
  );
}

export default GeneralSettings;