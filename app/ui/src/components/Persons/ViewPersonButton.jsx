import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// MUI Icons
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
// MUI UI elements
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

export const ViewPersonButton = ({ payload }) => {
  const navigate = useNavigate();

  const handleOnClick = useCallback(async () => {
    navigate(`/persons/${payload.uuid}`)
  }, [payload, navigate]);

  return (
    <>
      <Tooltip title="View">
        <IconButton onClick={handleOnClick}>
          <VisibilityOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </>
  );
}

export default ViewPersonButton;