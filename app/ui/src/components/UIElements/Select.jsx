import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import Tooltip from '@mui/material/Tooltip';

export const Select = ({ gsize, id, name = id, label, children, handleChange, disableClearable = true, ...props }) => {
  return (
    <Grid size={gsize}>
      <Tooltip title={props.tooltip} disableInteractive>
        <Autocomplete id={id} name={name} disableClearable={disableClearable}
          sx={{
            '& .MuiAutocomplete-inputRoot': {
              flexWrap: 'nowrap', // Prevents wrapping
            },
            '& .MuiChip-root': {
              maxWidth: '100%', // Ensures the chips don't exceed the container width
            },
            '& .MuiAutocomplete-endAdornment': {
              position: 'absolute', // Keeps the end adornment at the right position
              right: 0,
            },
          }}
          onChange={(event, value) => handleChange(name, props.multiple ? value.join(", ") : value)}
          size="small" {...props}
          renderInput={(params) => (
            <TextField fullWidth label={label} {...params}>{children}</TextField>)
          }
        />
      </Tooltip>
    </Grid>
  );
}

export default Select;