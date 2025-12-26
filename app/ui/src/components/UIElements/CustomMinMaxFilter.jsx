import { useCallback } from "react";
import TextField from "../UIElements/TextField";
import Box from "@mui/material/Box";

export const CustomMinMaxFilter = ({ column, label }) => {
  const [min, max] = column.getFilterValue() || ['', ''];

  const handleMinChange = useCallback((event) => {
    const filterValues = [...(column.getFilterValue() || ['', ''])];
    filterValues[0] = event.target.value;
    column.setFilterValue(filterValues);
  }, [column]);

  const handleMaxChange = useCallback((event) => {
    const filterValues = [...(column.getFilterValue() || ['', ''])];
    filterValues[1] = event.target.value;
    column.setFilterValue(filterValues);
  }, [column]);

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        label={`${label} Min`}
        placeholder=""
        variant="standard"
        value={min}
        onChange={handleMinChange}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label={`${label} Max`}
        placeholder=""
        variant="standard"
        value={max}
        onChange={handleMaxChange}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
};

export default CustomMinMaxFilter;