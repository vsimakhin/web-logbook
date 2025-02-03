import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
// MUI
import Grid from "@mui/material/Grid2";
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import { fetchSettings } from "../../util/http/settings";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import CardHeader from "../UIElements/CardHeader";
import GeneralSettings from "./GeneralSettings";
import SaveSettingsButton from "./SaveSettingsButton";
import LogbookSignature from "./LogbookSignature";
import ClearSignatureButton from "./ClearSignatureButton";
import PickColorButton from "./PickColorButton";
import SaveSignatureButton from "./SaveSignatureButton";
import UploadSignatureButton from "./UploadSignatureButton";

export const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['settings'],
    queryFn: ({ signal }) => fetchSettings({ signal, navigate }),
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to load settings' });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleChange = (key, value) => {
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
  };

  console.log(settings)

  return (
    <>
      {isLoading && <LinearProgress />}
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Settings"
                action={
                  <>
                    <SaveSettingsButton settings={settings} />
                    {/* <HelpButton />
                    <SaveLicenseRecordButton license={license} handleChange={handleChange} />
                    <DeleteLicenseRecordButton license={license} />
                    <DeleteLicenseRecordButtonAttachment license={license} /> */}
                  </>
                }
              />
              <GeneralSettings settings={settings} handleChange={handleChange} />
            </CardContent>
          </Card >

          <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent>
              <CardHeader title="Logbook Signature"
                action={
                  <>
                    <UploadSignatureButton handleChange={handleChange} />
                    <SaveSignatureButton settings={settings} />
                    <ClearSignatureButton handleChange={handleChange} />
                    <PickColorButton handleChange={handleChange} />
                  </>
                }
              />
              <LogbookSignature settings={settings} handleChange={handleChange} />
            </CardContent>
          </Card >
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>

        </Grid>
      </Grid>
    </>
  );
}

export default Settings;