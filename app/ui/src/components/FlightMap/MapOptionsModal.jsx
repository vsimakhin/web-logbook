import { useCallback, useRef } from 'react';
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
// Custom
import CardHeader from "../UIElements/CardHeader";
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { DEFAULT_MAP_OPTIONS, MAP_ICONS, MAP_OPTIONS_NAME } from './helpers';

const CloseDialogButton = ({ onClose }) => {
  return (
    <Tooltip title="Close">
      <IconButton size="small" onClick={onClose}><DisabledByDefaultOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

const MapOptionItem = ({ label, values, onChange }) => {
  const colorInputRef = useRef(null);

  return (
    <>
      <Grid size={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}>
        <FormControlLabel sx={{ m: 0 }}
          label={label}
          control={
            <Switch
              checked={values?.enabled ?? false}
              onChange={(event) => onChange("enabled", event.target.checked)}
            />
          }
          labelPlacement="start"
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
          max={10}
          step={0.1}
          value={values?.thickness ?? 1}
          onChange={(_, value) => onChange('thickness', value)}
        />
      </Grid>
    </>
  );
};

export const MapOptionsModal = ({ open, onClose }) => {
  const [options, setOptions] = useLocalStorageState(MAP_OPTIONS_NAME, DEFAULT_MAP_OPTIONS, { codec: CODEC_JSON });

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
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
              <FormControlLabel sx={{ m: 0 }}
                label={"Airport Codes"}
                control={
                  <Switch
                    checked={options?.airport?.ids ?? false}
                    onChange={(event) => handleChange("airport.ids", event.target.checked)}
                  />
                }
                labelPlacement="start"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}>
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
                    {MAP_ICONS.map((icon, index) => (
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
          </Grid>
          <Divider sx={{ m: 1 }} />
          <Grid container>
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
              <FormControlLabel
                sx={{ m: 0, width: '100%', display: 'flex', justifyContent: 'space-between' }}
                control={
                  <ToggleButtonGroup
                    size="small"
                    sx={{ ml: 1 }}
                    value={parseInt(options?.map_base) || 0}
                    onChange={(_, value) => handleChange('map_base', parseInt(value))}
                    exclusive
                  >
                    <ToggleButton value={0}>Standard</ToggleButton>
                    <ToggleButton value={1}>Satellite</ToggleButton>
                    <ToggleButton value={2}>Terrain</ToggleButton>
                  </ToggleButtonGroup>
                }
                label="Map Base"
                labelPlacement="start"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card >
    </Dialog>
  );
}

export default MapOptionsModal;