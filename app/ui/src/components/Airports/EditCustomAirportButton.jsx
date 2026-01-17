import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';

export const EditCustomAirportButton = ({ params }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    await dialogs.open(AddEditCustomAirportModal, params.row);
  }, [dialogs, params.row]);

  return (
    <GridActionsCellItem
      icon={<Tooltip title="Edit"><EditOutlinedIcon /></Tooltip>}
      onClick={handleOnClick}
      label="Edit" showInMenu
    />
  );
}

export default EditCustomAirportButton;