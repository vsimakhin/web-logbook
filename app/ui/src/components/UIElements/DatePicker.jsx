import { useCallback } from 'react';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import useSettings from '../../hooks/useSettings';

export const DatePicker = ({ gsize, id, name = id, label, handleChange, tooltip = label, ...props }) => {
  const onDateChange = useCallback((value) => {
    handleChange(id, value ? dayjs(value).format("YYYY-MM-DD") : "")
  }, [handleChange, id])

  const { dateFieldsFormat } = useSettings();

  return (
    <Grid size={gsize}>
      <Tooltip title={tooltip} disableInteractive>
        <div>
          <MUIDatePicker
            id={id}
            name={name}
            label={label}
            format={dateFieldsFormat}
            onChange={onDateChange}
            slotProps={{ field: { size: "small", fullWidth: true, clearable: props.clearable } }}
            minDate={dayjs('1903-12-17', 'YYYY-MM-DD')} // pilots looking down at people since 1903-12-17
            {...props}
          />
        </div>
      </Tooltip>
    </Grid >
  )
}

export default DatePicker;