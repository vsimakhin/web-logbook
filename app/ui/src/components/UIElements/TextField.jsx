import { useCallback } from 'react';
import MUITextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';

export const TextField = ({ gsize, id, name = id, label, handleChange, tooltip = label, ...props }) => {
  const handleTextFieldChange = useCallback((event) => {
    handleChange(id, event.target.value);
  }, [id, handleChange]);

  return (
    <Grid size={gsize}>
      <Tooltip title={tooltip} disableInteractive>
        <div>
          <MUITextField
            id={id}
            name={name}
            label={label}
            onChange={handleTextFieldChange}
            fullWidth
            size="small"
            variant="outlined"
            {...props}
            aria-label={label}
          />
        </div>
      </Tooltip>
    </Grid >
  )
}

export default TextField;