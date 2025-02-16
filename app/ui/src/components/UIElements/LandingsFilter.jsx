import TextField from "../UIElements/TextField";
import Box from "@mui/material/Box";

export const LandingFilter = ({ column }) => {
  const [min, max] = column.getFilterValue() || ['', ''];

  const handleChange = (index) => (event) => {
    const value = event.target.value;
    const filterValues = [...(column.getFilterValue() || ['', ''])];
    filterValues[index] = value;
    column.setFilterValue(filterValues);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        label={`Landings ${column.columnDef.header} Min`}
        placeholder=""
        variant="standard"
        value={min}
        onChange={handleChange(0)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label={`Landings ${column.columnDef.header} Max`}
        placeholder=""
        variant="standard"
        value={max}
        onChange={handleChange(1)}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
};