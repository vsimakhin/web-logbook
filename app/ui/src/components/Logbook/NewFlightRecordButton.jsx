import { useNavigate } from 'react-router-dom';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

export const NewFlightRecordButton = () => {
  const navigate = useNavigate();

  return (
    <Tooltip title="Add New Flight Record">
      <IconButton onClick={() => navigate("/logbook/new")} size="small"><AddBoxOutlinedIcon /></IconButton>
    </Tooltip>
  )
}

export default NewFlightRecordButton;