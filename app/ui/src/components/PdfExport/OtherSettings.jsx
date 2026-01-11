// MUI
import Grid from "@mui/material/Grid";
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export const OtherSettings = ({ pdfSettings, handleChange }) => {

  return (
    <>
      <Grid container spacing={1} >
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
          <FormControlLabel sx={{ width: '100%' }}
            label='Replace SE and ME values for single pilot time with "✓" symbol (Part FCL.050 format)'
            control={
              <Switch
                checked={pdfSettings.replace_sp_time ?? false}
                onChange={(event) => handleChange("replace_sp_time", event.target.checked)}
              />
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
          <FormControlLabel sx={{ width: '100%' }}
            label='Include signature'
            control={
              <Switch
                checked={pdfSettings.include_signature ?? false}
                onChange={(event) => handleChange("include_signature", event.target.checked)}
              />
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
          <FormControlLabel sx={{ width: '100%' }}
            label='Extended format, it will add Date column to the FSTD section and will reduce Remarks column. This format fully matches Part FCL.050 format'
            control={
              <Switch
                checked={pdfSettings.is_extended ?? false}
                onChange={(event) => handleChange("is_extended", event.target.checked)}
              />
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
          <FormControlLabel sx={{ m: 0, width: '100%', display: 'flex', justifyContent: 'space-between' }}
            control={
              <ToggleButtonGroup
                size="small"
                sx={{ ml: 1 }}
                value={parseInt(pdfSettings.time_fields_auto_format) || 0}
                onChange={(_, value) => handleChange('time_fields_auto_format', parseInt(value))}
                exclusive
              >
                <ToggleButton value={0}>None</ToggleButton>
                <ToggleButton value={1}>HH:MM</ToggleButton>
                <ToggleButton value={2}>H:MM</ToggleButton>
              </ToggleButtonGroup>
            }
            label="Time fields autoformat" labelPlacement="start"
          />
        </Grid>
      </Grid>
    </>
  );
}

export default OtherSettings;