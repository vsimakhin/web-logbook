import { useMemo } from "react";
// MUI
import Grid from "@mui/material/Grid";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from "../../UIElements/CardHeader";
// Custom
import SaveSettingsButton from '../SaveSettingsButton';
import useSettings from "../../../hooks/useSettings";
import { getValue } from "../../../util/helpers";
import TextField from "../../UIElements/TextField";
// import HelpButton from './HelpButton';

const gsize = { xs: 8, sm: 3, md: 3, lg: 3, xl: 3 }

const FLIGHT_TIME_SLOT_PROPS = {
  htmlInput: {
    maxLength: 8, // HHHHH:MM format requires max length of 8
    onInput: (e) => {
      let value = e.target.value;

      // Remove invalid characters
      value = value.replace(/[^0-9]/g, '');

      // Automatically add colon after 1 or 2 digits for hours
      if (value.length > 2) {
        value = `${value.slice(0, value.length - 2)}:${value.slice(-2)}`;
      }

      // Allow clearing or partial input
      e.target.value = value;
    },
    inputMode: 'numeric'
  },
};

const ActionButtons = ({ settings }) => (
  <>
    {/* <HelpButton /> */}
    <SaveSettingsButton settings={settings} />
  </>
);

export const PreviousExperience = ({ settings, handleChange }) => {
  const { fieldNameF } = useSettings();

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
            <TextField
              gsize={gsize}
              key={field.id} id={field.id} label={field.label}
              handleChange={handleChange}
              placeholder="HHHH:MM"
              slotProps={FLIGHT_TIME_SLOT_PROPS}
              value={getValue(settings, field.id) || ""} />
          ))}
          {landingFields.map((field) => (
            <TextField
              gsize={gsize}
              key={field.id} id={field.id} label={field.label}
              handleChange={handleChange}
              value={getValue(settings, field.id) || 0} />
          ))}
        </Grid>

      </CardContent>
    </Card>
  )
}

export default PreviousExperience;