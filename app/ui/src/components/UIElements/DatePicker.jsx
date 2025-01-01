import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker';
import Grid from '@mui/material/Grid2';
import dayjs from 'dayjs';

export const DatePicker = ({ gsize, id, name = id, label, handleChange, ...props }) => {
  return (
    <Grid size={gsize}>
      <MUIDatePicker id={id} name={name} label={label}
        format="DD/MM/YYYY"
        onChange={(value) => { handleChange(id, dayjs(value).format("DD/MM/YYYY")) }}
        fullWidth slotProps={{ field: { size: "small", fullWidth: true } }} variant="outlined"
        {...props} />
    </Grid >
  )
}

export default DatePicker;