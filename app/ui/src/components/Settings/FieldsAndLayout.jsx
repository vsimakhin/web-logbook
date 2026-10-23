import { useCallback, useEffect, useState } from "react";
// MUI
import Grid from "@mui/material/Grid";
import LinearProgress from '@mui/material/LinearProgress';
// Custom
import StandardFields from "./StandardFields/StandardFields";
import useSettings from "../../hooks/useSettings";
import CustomFieldsTable from "./CustomFields/CustomFieldsTable";
import LogbookLayout from "./LogbookLayout/LogbookLayout";

export const FieldsAndLayout = () => {
  const { data, isLoading, fieldName } = useSettings();
  const [settings, setSettings] = useState(data);

  useEffect(() => {
    if (!isLoading && data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings(data);
    }
  }, [isLoading, data]);

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
  }, [setSettings]);

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <StandardFields settings={settings} handleChange={handleChange} />
          <CustomFieldsTable />
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <LogbookLayout settings={settings} handleChange={handleChange} fieldName={fieldName} />
        </Grid>
      </Grid>
    </>
  );
};

export default FieldsAndLayout;