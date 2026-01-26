import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
import { ToolbarButton } from '@mui/x-data-grid';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import AddEditPersonModal from './AddEditPersonModal';

export const AddPersonButton = ({ onSave }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    const payload = { uuid: '', first_name: '', middle_name: '', last_name: '', isNew: true };
    const result = await dialogs.open(AddEditPersonModal, payload);
    if (onSave) onSave(result);
  }, [dialogs, onSave]);

  return (
    <Tooltip title="Add Person">
      <ToolbarButton onClick={handleOnClick} color="default" label="Add Person">
        <AddBoxOutlinedIcon />
      </ToolbarButton>
    </Tooltip >
  )
}

export default AddPersonButton;