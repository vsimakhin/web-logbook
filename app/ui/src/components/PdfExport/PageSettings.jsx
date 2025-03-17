// MUI
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { useTheme } from '@mui/material/styles';
// Custom
import TextField from "../UIElements/TextField";

const size = { xs: 4, sm: 2, md: 4, lg: 2, xl: 2 };

const PAGE_SETTINGS_CONFIG = [
  { id: "logbook_rows", label: "Logbook Rows", tooltip: "Logbook rows per page" },
  { id: "fill", label: "Fill Row", tooltip: "Every X row will be filled gray" },
  { id: "left_margin", label: "Left Margin", tooltip: "Page left margin", showIf: (format) => format === "A4" },
  { id: "left_margin_a", label: "Left Margin (L)", tooltip: "Left page left margin", showIf: (format) => format === "A5" },
  { id: "left_margin_b", label: "Left Margin (R)", tooltip: "Right page left margin", showIf: (format) => format === "A5" },
  { id: "top_margin", label: "Top Margin", tooltip: "Page top margin" },
  { id: "body_row_height", label: "Row Height", tooltip: "Logbook row height" },
  { id: "footer_row_height", label: "Footer Row Height", tooltip: "Logbook footer row height" },
  { id: "page_breaks", label: "Page breaks", tooltip: "Page breaks, when the page counter start from 1", placeholder: "X,Y,Z" },
];

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
    size: { xs: 12, sm: 6, md: 12, lg: 6, xl: 6 },
    group: [{ id: "remarks", label: "Remarks", size: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }],
  },
];

export const PageSettings = ({ format, pdfSettings, handleChange, handleColumnChange, handleHeaderChange }) => {
  const theme = useTheme();
  const borderRadius = theme.shape.borderRadius;

  return (
    <>
      <Grid container spacing={1} columns={16} >
        {PAGE_SETTINGS_CONFIG.map(({ id, label, tooltip, placeholder, showIf }) => (
          (!showIf || showIf(format)) && (
            <TextField
              key={id}
              gsize={size}
              id={id}
              label={label}
              handleChange={handleChange}
              value={pdfSettings[id] ?? ""}
              tooltip={tooltip}
              placeholder={placeholder}
            />
          )
        ))}
      </Grid>
      <Typography variant="overline" sx={{ display: 'block', mb: 1, mt: 1 }}>Logbook Columns Width</Typography>
      <Grid container spacing={1} columns={16} >
        {COLUMN_CONFIG.map(({ id, label }) => (
          <TextField key={id}
            gsize={size}
            id={id}
            label={label}
            handleChange={handleColumnChange}
            value={pdfSettings.columns[id] ?? ""}
            tooltip={`${label} column width`}
          />
        ))}
      </Grid>
      <Typography variant="overline" sx={{ display: 'block', mb: 1, mt: 1 }}>Logbook Columns Header</Typography>
      <Grid container spacing={1}>
        {HEADERS_CONFIG.map(({ size, group }, groupIndex) => (
          <Grid size={size} key={`group-${groupIndex}`}>
            <Grid container spacing={0}>
              {group.map(({ id, label, size: fieldSize }, fieldIndex) => (
                <TextField key={id}
                  id={id}
                  label={label}
                  handleChange={handleHeaderChange}
                  value={pdfSettings.headers[id] ?? ""}
                  gsize={fieldSize}
                  tooltip={label}
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
    </>
  );
}

export default PageSettings;