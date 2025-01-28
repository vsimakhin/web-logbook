import dayjs from "dayjs";
// MUI UI elements
import Grid from "@mui/material/Grid2";
import TextField from "../UIElements/TextField";
import DatePicker from "../UIElements/DatePicker";

export const LicenseRecordDetails = ({ license, handleChange }) => {

  return (
    <>
      <Grid container spacing={1} >
        <TextField gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
          id="category"
          label="Category"
          handleChange={handleChange}
          value={license.category ?? ""}
          tooltip="Category"
        />
        <TextField gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
          id="name"
          label="Name"
          handleChange={handleChange}
          value={license.name ?? ""}
          tooltip="Name"
        />
        <TextField gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
          id="number"
          label="Number"
          handleChange={handleChange}
          value={license.number ?? ""}
          tooltip="Number"
        />
      </Grid>

      <Grid container spacing={1} sx={{ mt: 1 }}>
        <DatePicker gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
          id="issued"
          label="Issued"
          handleChange={handleChange}
          value={license.issued ? dayjs(license.issued, "DD/MM/YYYY") : null}
          clearable
          tooltip="Issued date"
        />
        <DatePicker gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
          id="valid_from"
          label="Valid From"
          handleChange={handleChange}
          value={license.valid_from ? dayjs(license.valid_from, "DD/MM/YYYY") : null}
          tooltip="Valid from date"
        />
        <DatePicker gsize={{ xs: 12, sm: 4, md: 4, lg: 4, xl: 4 }}
          id="valid_until"
          label="Valid Until"
          handleChange={handleChange}
          value={license.valid_until ? dayjs(license.valid_until, "DD/MM/YYYY") : null}
          tooltip="Valid until date"
        />
      </Grid>

      <Grid container spacing={1} sx={{ mt: 1 }}>
        <TextField gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          id="remarks"
          label="Endorsement & Remarks"
          handleChange={handleChange}
          value={license.remarks ?? ""}
          tooltip="Endorsement & Remarks"
          multiline rows={3}

        />
      </Grid>
    </>
  );
}

export default LicenseRecordDetails;