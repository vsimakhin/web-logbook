import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker';
import Grid from '@mui/material/Grid2';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';

export const DatePicker = ({ gsize, id, name = id, label, handleChange, ...props }) => {
  return (
    <Grid size={gsize}>
      <Tooltip title={props.tooltip} disableInteractive>
        <div>
          <MUIDatePicker
            id={id}
            name={name}
            label={label}
            format="DD/MM/YYYY"
            onChange={(value) => {
              handleChange(id, value ? dayjs(value).format("DD/MM/YYYY") : "")
            }}
            fullWidth
            slotProps={{ field: { size: "small", fullWidth: true, clearable: props.clearable } }}
            variant="outlined"
            {...props}
          />
        </div>
      </Tooltip>
    </Grid >
  )
}

export default DatePicker;