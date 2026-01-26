import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import AddEditPersonModal from './AddEditPersonModal';

export const EditPersonButton = ({ params, payload, showInMenu }) => {
  const dialogs = useDialogs();
  // Support both params (from DataGrid) and payload (from standalone usage)
  const personData = params?.row || payload;

  const handleOnClick = useCallback(async () => {
    await dialogs.open(AddEditPersonModal, personData);
  }, [dialogs, personData]);

  // If showInMenu is true, use GridActionsCellItem (only works inside DataGrid)
  if (showInMenu) {
    return (
      <GridActionsCellItem
        icon={<Tooltip title="Edit"><EditOutlinedIcon /></Tooltip>}
        onClick={handleOnClick}
        label="Edit"
        showInMenu
      />
    );
  }

  // Otherwise, use IconButton (works anywhere)
  return (
    <Tooltip title="Edit">
      <IconButton onClick={handleOnClick} size="small">
        <EditOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}

export default EditPersonButton;