import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// MUI UI elements
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import { CURRENCY_INITIAL_STATE } from '../../constants/constants';
import CurrencyModal from './CurrencyModal';

export const NewCurrencyButton = () => {
  const dialogs = useDialogs();

  const handleClick = useCallback(async () => {
    await dialogs.open(CurrencyModal, CURRENCY_INITIAL_STATE)
  }, [dialogs]);

  return (
    <Tooltip title="New Currency">
      <IconButton onClick={handleClick}>
        <AddBoxOutlinedIcon fontSize='small' />
      </IconButton>
    </Tooltip >
  );
};

export default NewCurrencyButton;