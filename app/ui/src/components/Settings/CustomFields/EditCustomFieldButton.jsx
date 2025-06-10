import { useDialogs } from '@toolpad/core/useDialogs';
import { memo, useCallback } from 'react';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import CustomFieldModal from './CustomFieldModal';

export const EditCustomFieldButton = memo(({ payload }) => {
  const dialogs = useDialogs();

  const handleClick = useCallback(async () => {
    await dialogs.open(CustomFieldModal, payload)
  }, [dialogs, payload]);

  return (
    <Tooltip title="Edit Custom Field">
      <IconButton onClick={handleClick}>
        <EditOutlinedIcon fontSize='small' />
      </IconButton>
    </Tooltip >
  );
});

export default EditCustomFieldButton;