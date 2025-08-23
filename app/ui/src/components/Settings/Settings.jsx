import { memo, useCallback, useEffect, useState } from "react";
// MUI
import Grid from "@mui/material/Grid2";
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import GeneralSettings from "./GeneralSettings";
import LogbookSignature from "./Signature/LogbookSignature";
import CustomFields from "./CustomFields/CustomFields";
import StandardFields from "./StandardFields/StandardFields";
import useSettings from "../../hooks/useSettings";

export const Settings = memo(() => {
  const [settings, setSettings] = useState({ standard_fields_headers: {} });
  const { data, isLoading } = useSettings();

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleChange = useCallback((key, value) => {
    setSettings((settings) => {
      const keys = key.split('.'); // Split key by dots to handle nesting
      let updatedsettings = { ...settings }; // Create a shallow copy of the settings object
      let current = updatedsettings;

      // Traverse and create nested objects as needed
      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          // Update the final key with the new value
          current[k] = value;
        } else {
          // Ensure the next level exists
          current[k] = current[k] ? { ...current[k] } : {};
          current = current[k];
        }
      });

      return updatedsettings;
    });
  }, []);

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <GeneralSettings settings={settings} handleChange={handleChange} />
          <LogbookSignature settings={settings} handleChange={handleChange} />
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <StandardFields settings={settings} handleChange={handleChange} />
          <CustomFields />
        </Grid>
      </Grid>
    </>
  );
});

export default Settings;