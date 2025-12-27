import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// MUI UI elements
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import { CUSTOM_FIELD_INITIAL_STATE } from '../../../constants/constants';
import CustomField from './CustomFieldModal';

export const NewCustomFieldButton = () => {
  const dialogs = useDialogs();

  const handleClick = useCallback(async () => {
    await dialogs.open(CustomField, CUSTOM_FIELD_INITIAL_STATE)
  }, [dialogs]);

  return (
    <Tooltip title="New Custom Field">
      <IconButton onClick={handleClick}>
        <AddBoxOutlinedIcon fontSize='small' />
      </IconButton>
    </Tooltip >
  );
};

export default NewCustomFieldButton;