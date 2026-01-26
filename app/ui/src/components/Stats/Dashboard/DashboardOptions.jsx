import { useCallback } from "react";
// MUI UI elements
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
// MUI Icons
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const STATS_FILTERS = [
  { id: 'total_time', label: 'Total Time' },
  { id: 'se_time', label: 'SE Time' },
  { id: 'me_time', label: 'ME Time' },
  { id: 'mcc_time', label: 'MCC Time' },
  { id: 'night_time', label: 'Night Time' },
  { id: 'ifr_time', label: 'IFR Time' },
  { id: 'pic_time', label: 'PIC Time' },
  { id: 'co_pilot_time', label: 'Co-Pilot Time' },
  { id: 'dual_time', label: 'Dual Time' },
  { id: 'instructor_time', label: 'Instructor Time' },
  { id: 'cc_time', label: 'Cross-Country Time' },
  { id: 'sim_time', label: 'Simulator Time' },
];

export const DashboardOptions = ({ dashboardOptions, setDashboardOptions }) => {
  const handleChange = useCallback((key, value) => {
    setDashboardOptions({ ...dashboardOptions, [key]: value });
  }, [dashboardOptions, setDashboardOptions]);

  return (
    <Grid container spacing={1} sx={{ mb: 1 }}>
      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
        <Accordion variant="outlined" sx={{ width: '100%' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="overline">Dashboard Options</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {STATS_FILTERS.map(({ id, label }) => (
              <FormControlLabel key={id} label={`Show ${label}`} id={id} sx={{ width: '100%' }}
                control={
                  <Switch
                    checked={dashboardOptions[id] ?? true}
                    onChange={(event) => handleChange(id, event.target.checked)}
                  />
                }
              />
            ))}
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );
};

export default DashboardOptions;