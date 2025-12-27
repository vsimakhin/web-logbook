import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
// Custom
import CardHeader from "../UIElements/CardHeader";
import Select from "../UIElements/Select";
import { updateAirportsDBSettings } from "../../util/http/settings";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import UpdateAirportsDBButton from "./UpdateAirportsDBButton";
import useSettings from "../../hooks/useSettings";

const airportsDBOptions = [
  "https://github.com/vsimakhin/Airports/raw/master/airports.json",
  "https://github.com/mwgg/Airports/raw/master/airports.json",
  "https://davidmegginson.github.io/ourairports-data/airports.csv",
];

export const AirportsDB = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({ airports_db_source: "", no_icao_filter: false });
  const { data } = useSettings();

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings(data);
    }
  }, [data]);

  // mutation for autosave db source settings
  const { mutateAsync: saveSettings, isError: isSaveError, error: saveError, isSuccess } = useMutation({
    mutationFn: () => updateAirportsDBSettings({ settings, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  });
  useErrorNotification({ isSaveError, saveError, fallbackMessage: 'Failed to save settings' });
  useSuccessNotification({ isSuccess, message: 'Airports DB Settings saved' });

  const handleChange = useCallback(async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    await saveSettings();
  }, [saveSettings]);

  return (
    <>
      <CardHeader title="Airports DB Source" action={<UpdateAirportsDBButton />} />
      <Grid container spacing={1} >
        <Select gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          id="airports_db_source"
          label="Airport DB Source"
          tooltip="Airport DB Source"
          options={airportsDBOptions}
          handleChange={handleChange}
          value={settings?.airports_db_source ?? ""}
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings?.no_icao_filter ?? false}
              onChange={(event) => handleChange("no_icao_filter", event.target.checked)}
            />
          }
          label="No ICAO Filter"
        />
      </Grid>
    </>
  );
}

export default AirportsDB;