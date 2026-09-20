import { useMemo } from "react";
// MUI
import Grid from "@mui/material/Grid";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Custom
import CardHeader from "../../UIElements/CardHeader";
import SaveSettingsButton from '../SaveSettingsButton';
import useSettings from "../../../hooks/useSettings";
import { getValue } from "../../../util/helpers";
import TextField from "../../UIElements/TextField";
import HelpButton from './HelpButton';
import TimeField from "../../FlightRecord/TimeField";

const gsize = { xs: 8, sm: 3 }

const ActionButtons = ({ settings }) => (
  <>
    <HelpButton />
    <SaveSettingsButton settings={settings} />
  </>
);

export const PreviousExperience = ({ settings, handleChange }) => {
  const { fieldNameF, settings: userSettings } = useSettings();
  const fieldFormat = userSettings.time_fields_auto_format;

  const timeFields = useMemo(() => (
    [
      { id: "previous_experience.total_time", label: fieldNameF("total") },
      { id: "previous_experience.se_time", label: `SP ${fieldNameF("se")}` },
      { id: "previous_experience.me_time", label: `SP ${fieldNameF("me")}` },
      { id: "previous_experience.mcc_time", label: fieldNameF("mcc") },
      { id: "previous_experience.night_time", label: fieldNameF("night") },
      { id: "previous_experience.ifr_time", label: fieldNameF("ifr") },
      { id: "previous_experience.pic_time", label: fieldNameF("pic") },
      { id: "previous_experience.co_pilot_time", label: fieldNameF("cop") },
      { id: "previous_experience.dual_time", label: fieldNameF("dual") },
      { id: "previous_experience.instructor_time", label: fieldNameF("instr") },
      { id: "previous_experience.sim_time", label: `${fieldNameF("fstd")} ${fieldNameF("sim_time")}` },
      { id: "previous_experience.me_total_time", label: `Total ${fieldNameF("me")}` },
      { id: "previous_experience.cc_time", label: "Cross Country" }
    ]
  ), [fieldNameF]);

  const landingFields = useMemo(() => (
    [
      { id: "previous_experience.landings_day", label: `${fieldNameF("land_day")} ${fieldNameF("landings")}` },
      { id: "previous_experience.landings_night", label: `${fieldNameF("land_night")} ${fieldNameF("landings")}` },
    ]
  ), [fieldNameF]);

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="Previous Flight Experience" action={<ActionButtons settings={settings} />} />
        <Grid container spacing={1} sx={{ mt: 1 }} columns={24}>
          {timeFields.map((field) => (
            <TimeField
              gsize={gsize}
              key={field.id} id={field.id} label={field.label}
              handleChange={handleChange}
              fieldFormat={fieldFormat}
              maxLength={9}
              value={getValue(settings, field.id) || 0} />
          ))}
          {landingFields.map((field) => (
            <TextField
              gsize={gsize}
              key={field.id} id={field.id} label={field.label}
              handleChange={handleChange}
              value={getValue(settings, field.id) || ""} />
          ))}
        </Grid>

      </CardContent>
    </Card>
  )
}

export default PreviousExperience;