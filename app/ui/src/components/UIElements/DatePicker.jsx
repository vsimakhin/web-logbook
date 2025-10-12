import { useCallback } from 'react';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker';
import Grid from '@mui/material/Grid2';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';

export const DatePicker = ({ gsize, id, name = id, label, handleChange, tooltip = label, ...props }) => {

  const onDateChange = useCallback((value) => {
    handleChange(id, value ? dayjs(value).format("DD/MM/YYYY") : "")
  }, [handleChange, id])

  return (
    <Grid size={gsize}>
      <Tooltip title={tooltip} disableInteractive>
        <div>
          <MUIDatePicker
            id={id}
            name={name}
            label={label}
            format="DD/MM/YYYY"
            onChange={onDateChange}
            slotProps={{ field: { size: "small", fullWidth: true, clearable: props.clearable } }}
            minDate={dayjs('17/12/1903', 'DD/MM/YYYY')} // pilots looking down at people since 17/12/1903
            {...props}
          />
        </div>
      </Tooltip>
    </Grid >
  )
}

export default DatePicker;