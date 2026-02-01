import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import CurrencyModal from './CurrencyModal';
import { GridActionsCellItem } from '@mui/x-data-grid';

export const EditCurrencyButton = ({ params }) => {
  const dialogs = useDialogs();

  const handleClick = useCallback(async () => {
    await dialogs.open(CurrencyModal, params.row)
  }, [dialogs, params.row]);

  return (
    <GridActionsCellItem
      icon={<Tooltip title="Edit Currency"><EditOutlinedIcon /></Tooltip>}
      onClick={handleClick}
      label="Edit Currency" showInMenu
    />
  );
};

export default EditCurrencyButton;