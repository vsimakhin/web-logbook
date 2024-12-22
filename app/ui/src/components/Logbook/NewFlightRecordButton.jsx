// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

export const NewFlightRecordButton = () => {

  return (
    <Tooltip title="Add New Flight Record">
      <IconButton onClick={() => console.log("todo: new flight record")} size="small"><AddBoxOutlinedIcon /></IconButton>
    </Tooltip>
  )
}

export default NewFlightRecordButton;