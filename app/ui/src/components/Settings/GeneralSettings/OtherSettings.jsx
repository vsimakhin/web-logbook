import { useCallback } from "react";
// MUI
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
// Custom
import TextField from "../../UIElements/TextField";
import Select from "../../UIElements/Select";
import { defaultPersonRoles } from "../../UIElements/PersonRole";

export const OtherSettings = ({ settings, handleChange }) => {
  const getDefaultPagination = useCallback(() => {
    // Return default pagination if the setting is empty or undefined
    return settings.logbook_pagination && settings.logbook_pagination.trim() !== ''
      ? settings.logbook_pagination
      : "5, 10, 15, 20, 25, 30, 50, 100";
  }, [settings.logbook_pagination]);

  const onFormatChange = useCallback((_, value) => {
    handleChange('time_fields_auto_format', parseInt(value));
  }, [handleChange]);

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
  );
};

export default OtherSettings;