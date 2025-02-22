// MUI
import Grid from "@mui/material/Grid2";
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

export const PageSettings = ({ format, pdfSettings, handleChange }) => {
  return (
    <>
      <Grid container spacing={1} >
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
    </>
  );
}

export default PageSettings;