import { useCallback } from "react";
import TextField from "../UIElements/TextField";
import Box from "@mui/material/Box";

export const CustomMinMaxFilter = ({ column, label }) => {
  const [min, max] = column.getFilterValue() || ['', ''];

  const handleChange = (index) => useCallback((event) => {
    const value = event.target.value;
    const filterValues = [...(column.getFilterValue() || ['', ''])];
    filterValues[index] = value;
    column.setFilterValue(filterValues);
  }, [column, index]);

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        label={`${label} Min`}
        placeholder=""
        variant="standard"
        value={min}
        onChange={handleChange(0)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label={`${label} Max`}
        placeholder=""
        variant="standard"
        value={max}
        onChange={handleChange(1)}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
};

export default CustomMinMaxFilter;