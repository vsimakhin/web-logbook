import { useTheme } from '@mui/material/styles';
import { useCallback } from 'react';
// MUI
import Grid from "@mui/material/Grid";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from "../../UIElements/CardHeader";
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
// Custom
import TextField from "../../UIElements/TextField";
import SaveSettingsButton from '../SaveSettingsButton';
import RestoreDefaultsButton from './RestoreDefaultsButton';
import HelpButton from './HelpButton';

const HEADERS_CONFIG = [
  {
    size: { xs: 12, sm: 2, md: 3, lg: 2, xl: 2 },
    group: [{ id: "date", label: "Date", size: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }],
  },
  {
    size: { xs: 12, sm: 5, md: 9, lg: 5, xl: 5 },
    group: [
      { id: "departure", label: "Departure Header", size: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6 } },
      { id: "dep_place", label: "Place", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
      { id: "dep_time", label: "Time", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
    ],
  },
  {
    size: { xs: 12, sm: 5, md: 12, lg: 5, xl: 5 },
    group: [
      { id: "arrival", label: "Arrival Header", size: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6 } },
      { id: "arr_place", label: "Place", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
      { id: "arr_time", label: "Time", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
    ],
  },
  {
    size: { xs: 12, sm: 6, md: 12, lg: 6, xl: 6 },
    group: [
      { id: "aircraft", label: "Aircraft Header", size: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6 } },
      { id: "model", label: "Type", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
      { id: "reg", label: "Reg", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
    ],
  },
  {
    size: { xs: 12, sm: 6, md: 12, lg: 6, xl: 6 },
    group: [
      { id: "spt", label: "Single Pilot Header", size: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6 } },
      { id: "se", label: "SE", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
      { id: "me", label: "ME", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
    ],
  },
  {
    size: { xs: 12, sm: 4, md: 4, lg: 3, xl: 3 },
    group: [{ id: "mcc", label: "MCC Time", size: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }],
  },
  {
    size: { xs: 12, sm: 4, md: 4, lg: 3, xl: 3 },
    group: [{ id: "total", label: "Total Time", size: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }],
  },
  {
    size: { xs: 12, sm: 4, md: 4, lg: 3, xl: 3 },
    group: [{ id: "pic_name", label: "PIC Name", size: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }],
  },
  {
    size: { xs: 12, sm: 5, md: 12, lg: 5, xl: 5 },
    group: [
      { id: "landings", label: "Landings", size: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6 } },
      { id: "land_day", label: "Day", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
      { id: "land_night", label: "Night", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
    ],
  },
  {
    size: { xs: 12, sm: 7, md: 12, lg: 7, xl: 7 },
    group: [
      { id: "oct", label: "Operational Condition Time", size: { xs: 8, sm: 8, md: 8, lg: 8, xl: 8 } },
      { id: "night", label: "Night", size: { xs: 2, sm: 2, md: 2, lg: 2, xl: 2 } },
      { id: "ifr", label: "IFR", size: { xs: 2, sm: 2, md: 2, lg: 2, xl: 2 } },
    ],
  },
  {
    size: { xs: 12, sm: 12, md: 12, lg: 10, xl: 10 },
    group: [
      { id: "pft", label: "Pilot Function Time", size: { xs: 4, sm: 4, md: 4, lg: 4, xl: 4 } },
      { id: "pic", label: "PIC", size: { xs: 2, sm: 2, md: 2, lg: 2, xl: 2 } },
      { id: "cop", label: "CoPilot", size: { xs: 2, sm: 2, md: 2, lg: 2, xl: 2 } },
      { id: "dual", label: "Dual", size: { xs: 2, sm: 2, md: 2, lg: 2, xl: 2 } },
      { id: "instr", label: "Instr", size: { xs: 2, sm: 2, md: 2, lg: 2, xl: 2 } },
    ],
  },
  {
    size: { xs: 12, sm: 6, md: 12, lg: 6, xl: 6 },
    group: [
      { id: "fstd", label: "FSTD", size: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6 } },
      { id: "sim_type", label: "Type", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
      { id: "sim_time", label: "Time", size: { xs: 3, sm: 3, md: 3, lg: 3, xl: 3 } },
    ],
  },
  {
    size: { xs: 12, sm: 6, md: 12, lg: 3, xl: 3 },
    group: [{ id: "remarks", label: "Remarks", size: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }],
  },
  {
    size: { xs: 12, sm: 6, md: 12, lg: 3, xl: 3 },
    group: [{ id: "tags", label: "Tags", size: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }],
  },
];

const ActionButtons = ({ settings, handleChange }) => (
  <>
    <HelpButton />
    <RestoreDefaultsButton handleChange={handleChange} />
    <SaveSettingsButton settings={settings} />
  </>
);

export const StandardFields = ({ settings = {}, handleChange }) => {
  const theme = useTheme();
  const borderRadius = theme.shape.borderRadius;

  const handleHeaderChange = useCallback((id, value) => {
    handleChange(`standard_fields_headers.${id}`, value);
  }, [handleChange]);

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <CardHeader title="Standard Fields" action={<ActionButtons settings={settings} handleChange={handleHeaderChange} />} />
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings?.enable_custom_names ?? false}
                onChange={(event) => handleChange("enable_custom_names", event.target.checked)}
              />
            }
            label="Enable custom names for standard fields"
          />
        </Grid>
        <Grid container spacing={1}>
          {HEADERS_CONFIG.map(({ size, group }, groupIndex) => (
            <Grid size={size} key={`group-${groupIndex}`}>
              <Grid container spacing={0}>
                {group.map(({ id, label, size: fieldSize }, fieldIndex) => (
                  <TextField key={id}
                    id={id}
                    label={label}
                    handleChange={handleHeaderChange}
                    value={settings.standard_fields_headers[id] ?? ""}
                    gsize={fieldSize}
                    tooltip={label}
                    disabled={!settings?.enable_custom_names}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 0,
                        borderTopLeftRadius: fieldIndex === 0 ? borderRadius : 0,
                        borderBottomLeftRadius: fieldIndex === 0 ? borderRadius : 0,
                        borderTopRightRadius: fieldIndex === group.length - 1 ? borderRadius : 0,
                        borderBottomRightRadius: fieldIndex === group.length - 1 ? borderRadius : 0,
                      }
                    }}
                  />
                ))}
              </Grid>
            </Grid>
          ))
          }
        </Grid >
      </CardContent>
    </Card>
  );
}

export default StandardFields;