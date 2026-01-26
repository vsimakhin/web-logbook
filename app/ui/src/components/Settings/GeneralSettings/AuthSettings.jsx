import { useCallback } from "react";
// MUI UI elements
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
// Custom
import TextField from "../../UIElements/TextField";

export const AuthSettings = ({ settings, handleChange }) => {

  const onAuthToggle = useCallback((enabled) => {
    handleChange("auth_enabled", enabled);

    if (enabled) {
      // Generate 32 random bytes (256 bits)
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const base64Key = btoa(String.fromCharCode.apply(null, array));
      handleChange("secret_key", base64Key);
    }
  }, [handleChange]);

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            checked={settings?.auth_enabled ?? false}
            onChange={(event) => onAuthToggle(event.target.checked)}
          />
        }
        label="Enable Authentication"
      />
      <Grid container spacing={1}>
        <TextField
          gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="login"
          label="Login"
          handleChange={handleChange}
          value={settings.login ?? ""}
          tooltip="Login"
          disabled={!settings.auth_enabled}
        />
        <TextField
          gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
          id="password"
          label="Password"
          handleChange={handleChange}
          value={settings.password ?? ""}
          tooltip="Password"
          disabled={!settings.auth_enabled}
          type="password"
        />
        <TextField
          gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
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
};

export default AuthSettings;