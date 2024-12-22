import MUITextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid2';
import Tooltip from '@mui/material/Tooltip';

export const TextField = ({ gsize, id, name = id, label, handleChange, ...props }) => {
  return (
    <Grid size={gsize}>
      <Tooltip title={props.tooltip}>
        <div>
          <MUITextField id={id} name={name} label={label}
            onChange={(event) => handleChange(id, event.target.value)}
            fullWidth size="small" variant="outlined"
            {...props} />
        </div>
      </Tooltip>
    </Grid >
  )
}

export default TextField;