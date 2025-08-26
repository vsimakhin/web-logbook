import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AddEditPersonModal from './AddEditPersonModal';
// Custom components and libraries


export const AddPersonButton = ({onSave}) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    const payload = { uuid: '', first_name: '', middle_name: '', last_name: '', isNew: true };
    const result = await dialogs.open(AddEditPersonModal, payload);
    if(onSave) onSave(result);
  }, [dialogs, onSave]);

  return (
    <>
      <Tooltip title="New person">
        <IconButton onClick={handleOnClick}>
          <AddBoxOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </>
  )
}

export default AddPersonButton;