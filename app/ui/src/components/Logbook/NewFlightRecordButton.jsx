import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { ToolbarButton } from '@mui/x-data-grid';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';

export const NewFlightRecordButton = () => {
  const navigate = useNavigate();

  const handleOnClick = useCallback(() => {
    navigate("/logbook/new");
  }, [navigate]);

  return (
    <Tooltip title="Add New Flight Record">
      <ToolbarButton onClick={handleOnClick} color="default" label='Add New Flight Record'>
        <AddBoxOutlinedIcon />
      </ToolbarButton>
    </Tooltip>
  )
}

export default NewFlightRecordButton;