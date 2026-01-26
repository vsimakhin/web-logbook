import { useCallback } from "react";
// MUI UI elements
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
// MUI Icons
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// Custom

import icon1 from "../../assets/favicon.ico";
import icon2 from "../../assets/map-pin.png";

export const MapOptions = ({ options, setOptions }) => {

  const handleChange = useCallback((key, value) => {
    setOptions({ ...options, [key]: value });
  }, [options, setOptions]);

  return (
    <Grid container spacing={1} sx={{ mb: 1 }}>
      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
        <Accordion variant="outlined" sx={{ width: '100%' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="overline">Map Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel label="Route Lines" sx={{ width: '100%' }}
              control={
                <Switch checked={options?.routes ?? false} onChange={(event) => handleChange("routes", event.target.checked)} />
              }
            />
            <FormControlLabel label="Tracks" sx={{ width: '100%' }}
              control={
                <Switch checked={options?.tracks ?? false} onChange={(event) => handleChange("tracks", event.target.checked)} />
              }
            />
            <FormControlLabel label="Airport IDs" sx={{ width: '100%' }}
              control={
                <Switch checked={options?.airport_ids ?? true} onChange={(event) => handleChange("airport_ids", event.target.checked)} />
              }
            />
            <FormControlLabel sx={{ width: '100%' }} label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Icon:</Typography>
                <Box component="img" src={icon2} sx={{ width: 16, height: 16 }} />
                <Typography variant="body2">/</Typography>
                <Box component="img" src={icon1} sx={{ width: 16, height: 16 }} />
              </Box>
            }
              control={
                <Switch checked={options?.icon === 'ico'} onChange={(event) => handleChange("icon", event.target.checked ? 'ico' : 'pin')} />
              }
            />
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );
}

export default MapOptions;
