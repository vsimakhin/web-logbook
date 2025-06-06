import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

export const NewFlightRecordButton = () => {
  const navigate = useNavigate();

  const handleOnClick = useCallback(() => {
    navigate("/logbook/new");
  }, [navigate]);

  return (
    <Tooltip title="Add New Flight Record">
      <IconButton onClick={handleOnClick} size="small"><AddBoxOutlinedIcon /></IconButton>
    </Tooltip>
  )
}

export default NewFlightRecordButton;