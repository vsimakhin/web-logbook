import Grid from "@mui/material/Grid2";
import TextField from "../../UIElements/TextField";

export const OwnerInfoFields = ({ settings, handleChange }) => {
  return (
    <Grid container spacing={1}>
      <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
        id="owner_name"
        label="Owner Name"
        handleChange={handleChange}
        value={settings.owner_name ?? ""}
        tooltip="Owner Name"
      />
      <TextField gsize={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}
        id="license_number"
        label="License Number"
        handleChange={handleChange}
        value={settings.license_number ?? ""}
        tooltip="License Number"
      />
      <TextField gsize={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}
        id="address"
        label="Address"
        handleChange={handleChange}
        value={settings.address ?? ""}
        tooltip="Address"
      />
      <TextField gsize={{ xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }}
        id="signature_text"
        label="Signature Text"
        handleChange={handleChange}
        value={settings.signature_text ?? ""}
        tooltip="Signature Text"
      />
    </Grid>
  );
};

export default OwnerInfoFields;