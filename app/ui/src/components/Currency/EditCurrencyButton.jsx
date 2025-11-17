import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import CurrencyModal from './CurrencyModal';

export const EditCurrencyButton = ({ payload }) => {
  const dialogs = useDialogs();

  const handleClick = useCallback(async () => {
    await dialogs.open(CurrencyModal, payload)
  }, [dialogs, payload]);

  return (
    <Tooltip title="Edit Currency">
      <IconButton onClick={handleClick}>
        <EditOutlinedIcon fontSize='small' />
      </IconButton>
    </Tooltip >
  );
};

export default EditCurrencyButton;