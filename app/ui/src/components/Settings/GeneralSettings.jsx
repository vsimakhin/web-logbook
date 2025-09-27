import { memo, useCallback } from "react";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import TextField from "../UIElements/TextField";
import CardHeader from "../UIElements/CardHeader";
import SaveSettingsButton from "./SaveSettingsButton";
import Select from "../UIElements/Select";
import { defaultPersonRoles } from "../UIElements/PersonRole";

const ActionButtons = memo(({ settings }) => (
  <SaveSettingsButton settings={settings} />
));

const OwnerInfoFields = memo(({ settings, handleChange }) => (
  <Grid container spacing={1}>
    <TextField
      gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
      id="owner_name"
      label="Owner Name"
      handleChange={handleChange}
      value={settings.owner_name ?? ""}
      tooltip="Owner Name"
    />
    <TextField
      gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
      id="license_number"
      label="License Number"
      handleChange={handleChange}
      value={settings.license_number ?? ""}
      tooltip="License Number"
    />
    <TextField
      gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
      id="address"
      label="Address"
      handleChange={handleChange}
      value={settings.address ?? ""}
      tooltip="Address"
    />
    <TextField
      gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
      id="signature_text"
      label="Signature Text"
      handleChange={handleChange}
      value={settings.signature_text ?? ""}
      tooltip="Signature Text"
    />
  </Grid>
));

const OtherSettings = memo(({ settings, handleChange }) => {
  const getDefaultPagination = () => {
    // Return default pagination if the setting is empty or undefined
    return settings.logbook_pagination && settings.logbook_pagination.trim() !== ''
      ? settings.logbook_pagination
      : "5, 10, 15, 20, 25, 30, 50, 100";
  };

  return (
    <Grid container spacing={1} sx={{ mt: 2 }}>
      <TextField
        gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
        id="logbook_pagination"
        label="Logbook Pagination"
        handleChange={handleChange}
        value={getDefaultPagination()}
        tooltip="Logbook Pagination (comma-separated values, e.g. 5,10,15)"
      />
      <Select gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
        id="person_roles"
        label="Person Roles"
        handleChange={handleChange}
        value={settings.person_roles ? settings.person_roles.split(",").map(role => role.trim()) : []}
        tooltip={"Person roles (type the role in and press enter or select from the default list)"}
        options={defaultPersonRoles}
        freeSolo={true}
        multiple
      />
    </Grid>
  );
});

const TimeFormatSelector = memo(({ settings, onFormatChange }) => (
  <Grid container spacing={1}>
    <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
      <FormControlLabel
        sx={{ m: 0, width: '100%', display: 'flex', justifyContent: 'space-between' }}
        control={
          <ToggleButtonGroup
            size="small"
            sx={{ ml: 1 }}
            value={parseInt(settings.time_fields_auto_format) || 0}
            onChange={onFormatChange}
            exclusive
          >
            <ToggleButton value={0}>None</ToggleButton>
            <ToggleButton value={1}>HH:MM</ToggleButton>
            <ToggleButton value={2}>H:MM</ToggleButton>
          </ToggleButtonGroup>
        }
        label="Logbook table time fields autoformat"
        labelPlacement="start"
      />
    </Grid>
  </Grid>
));

const AuthSettings = memo(({ settings, handleChange, onAuthToggle }) => (
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
));

export const GeneralSettings = memo(({ settings, handleChange }) => {
  const enableAuth = useCallback((enabled) => {
    handleChange("auth_enabled", enabled);

    if (enabled) {
      // Generate 32 random bytes (256 bits)
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const base64Key = btoa(String.fromCharCode.apply(null, array));
      handleChange("secret_key", base64Key);
    }
  }, [handleChange]);

  const handleTimeFormatChange = useCallback((_, value) => {
    handleChange('time_fields_auto_format', parseInt(value));
  }, [handleChange]);

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="Settings" action={<ActionButtons settings={settings} />} />

        <OwnerInfoFields settings={settings} handleChange={handleChange} />
        <Divider sx={{ m: 1 }} />
        <OtherSettings settings={settings} handleChange={handleChange} />
        <TimeFormatSelector settings={settings} onFormatChange={handleTimeFormatChange} />
        <Divider sx={{ m: 1 }} />
        <AuthSettings settings={settings} handleChange={handleChange} onAuthToggle={enableAuth} />

      </CardContent>
    </Card>
  );
});

export default GeneralSettings;