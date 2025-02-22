// MUI
import Grid from "@mui/material/Grid2";
// Custom
import TextField from "../UIElements/TextField";

const size = { xs: 4, sm: 2, md: 4, lg: 2, xl: 2 };

const COLUMN_CONFIG = [
  { id: "col1", label: "Date" },
  { id: "col2", label: "Departure Place" },
  { id: "col3", label: "Departure Time" },
  { id: "col4", label: "Arrival Place" },
  { id: "col5", label: "Arrival Time" },
  { id: "col6", label: "Aircraft Type" },
  { id: "col7", label: "Aircraft Reg" },
  { id: "col8", label: "SE Time" },
  { id: "col9", label: "ME Time" },
  { id: "col10", label: "MCC Time" },
  { id: "col11", label: "Total Time" },
  { id: "col12", label: "PIC Name" },
  { id: "col13", label: "Day Landings" },
  { id: "col14", label: "Night Landings" },
  { id: "col15", label: "Night Time" },
  { id: "col16", label: "IFR Time" },
  { id: "col17", label: "PIC Time" },
  { id: "col18", label: "Co-Pilot Time" },
  { id: "col19", label: "Dual Time" },
  { id: "col20", label: "Instructor Time" },
  { id: "col21", label: "FSTD Type" },
  { id: "col22", label: "FSTD Time" },
  { id: "col23", label: "Remarks" },
];


export const LogbookColumnWidth = ({ columnSettings, handleChange }) => {
  return (
    <>
      <Grid container spacing={1} >
        {COLUMN_CONFIG.map(({ id, label }) => (
          <TextField key={id}
            gsize={size}
            id={id}
            label={label}
            handleChange={handleChange}
            value={columnSettings[id] ?? ""}
            tooltip={`${label} column width`}
          />
        ))}
      </Grid>
    </>
  );
}

export default LogbookColumnWidth;