import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";

const OptionSwitch = ({
  id,
  gsize = { xs: 12 },
  label,
  checked,
  disabled = false,
  handleChange,
  key,
  ...switchProps
}) => (
  <Grid size={gsize} key={key}>
    <FormControlLabel
      id={id}
      disabled={disabled}
      control={
        <Switch
          checked={checked}
          onChange={(_, checked) => handleChange(id, checked)}
          {...switchProps}
        />
      }
      label={label}
    />
  </Grid>
);

export default OptionSwitch;