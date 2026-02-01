import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import CustomFieldModal from './CustomFieldModal';
import { GridActionsCellItem } from '@mui/x-data-grid';

export const EditCustomFieldButton = ({ params }) => {
  const dialogs = useDialogs();

  const handleClick = useCallback(async () => {
    await dialogs.open(CustomFieldModal, params.row)
  }, [dialogs, params.row]);

  return (
    <GridActionsCellItem
      icon={<Tooltip title="Edit Custom Field"><EditOutlinedIcon /></Tooltip>}
      onClick={handleClick}
      label="Edit Custom Field" showInMenu
    />
  );
};

export default EditCustomFieldButton;