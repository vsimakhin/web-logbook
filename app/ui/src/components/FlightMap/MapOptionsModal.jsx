import { useCallback, useMemo, useRef } from 'react';
import { useLocalStorageState, CODEC_JSON } from '../../hooks/useLocalStorageState';
// MUI UI elements
import Dialog from '@mui/material/Dialog';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
// MUI Icons
import DisabledByDefaultOutlinedIcon from '@mui/icons-material/DisabledByDefaultOutlined';
import ColorizeOutlinedIcon from "@mui/icons-material/ColorizeOutlined";

// Custom
import CardHeader from "../UIElements/CardHeader";
import TextField from '../UIElements/TextField';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { icons } from './helpers';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

const defaultOptions = {
  routes: {
    enabled: true,
    thickness: 1,
    color: '#1f08ffff',
  },
  tracks: {
    enabled: false,
    thickness: 1,
    color: '#004c29ff',
  },
  airport: {
    ids: true,
    icon: 0,
  }
}

const MapOptionItem = ({ label, values, onChange }) => {
  const colorInputRef = useRef(null);

  return (
    <>
      <Grid size={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}>
        <FormControlLabel
          label={label}
          control={
            <Switch
              checked={values?.enabled ?? false}
              onChange={(event) => onChange("enabled", event.target.checked)}
            />
          }
        />
      </Grid>
      <Grid size={{ xs: 2, sm: 2, md: 2, lg: 2, xl: 2 }}>
        <Box sx={{ backgroundColor: values?.color, height: 30, width: 30, cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}
          onClick={() => colorInputRef.current.click()}
        />
        <input
          ref={colorInputRef}
          type="color"
          onChange={(event) => onChange("color", event.target.value)}
          style={{ display: "none" }}
        />
      </Grid>
      <Grid size={{ xs: 10, sm: 6, md: 6, lg: 6, xl: 6 }}>
        <Slider
          defaultValue={1}
          min={1}
          max={100}
          step={1}
          value={values?.thickness ?? 1}
          onChange={(_, value) => onChange('thickness', value)}
        />
      </Grid>
    </>
  );
};

export const MapOptionsModal = ({ open, onClose }) => {
  const [options, setOptions] = useLocalStorageState("map-options", defaultOptions, { codec: CODEC_JSON });

  const handleChange = useCallback((key, value) => {
    setOptions((options) => {
      const keys = key.split('.'); // Split key by dots to handle nesting
      let updatedOptions = { ...options }; // Create a shallow copy of the flight object
      let current = updatedOptions;

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

      return updatedOptions;
    });
  }, [setOptions]);

  return (
    <Dialog fullWidth open={open} onClose={() => onClose()}>
      <Card variant="outlined" sx={{ m: 2 }}>
        <CardContent>
          <CardHeader title="Map Options" action={<CloseDialogButton onClose={onClose} />} />
          <Grid container spacing={1} alignItems="center">
            <MapOptionItem
              label="Route Lines"
              values={options?.routes}
              onChange={(field, value) => handleChange(`routes.${field}`, value)}
            />
            <MapOptionItem
              label="Track Lines"
              values={options?.tracks}
              onChange={(field, value) => handleChange(`tracks.${field}`, value)}
            />
          </Grid>
          <Divider sx={{ m: 1 }} />
          <Grid container>
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
              <FormControlLabel
                label={"Show Airport Codes"}
                control={
                  <Switch
                    checked={options?.airport?.ids ?? false}
                    onChange={(event) => handleChange("airport.ids", event.target.checked)}
                  />
                }
              />
            </Grid>
          </Grid>
          <Divider sx={{ m: 1 }} />
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
            <FormControlLabel
              sx={{ m: 0, width: '100%', display: 'flex', justifyContent: 'space-between' }}
              control={
                <ToggleButtonGroup
                  size="small"
                  sx={{ ml: 1 }}
                  value={parseInt(options?.airport?.icon) || 0}
                  onChange={(_, value) => handleChange('airport.icon', parseInt(value))}
                  exclusive
                >
                  {icons.map((icon, index) => (
                    <ToggleButton key={index} value={index}>
                      <img src={icon.src} style={{ width: 20, height: 20 }} />
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              }
              label="Airport Icon"
              labelPlacement="start"
            />
          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  );
}

export default MapOptionsModal;