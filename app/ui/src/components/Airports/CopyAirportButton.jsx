import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
// MUI Icons
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';

export const CopyAirportButton = ({ params }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    await dialogs.open(AddEditCustomAirportModal, { ...params.row, isNew: true });
  }, [dialogs, params.row]);

  return (
    <GridActionsCellItem
      icon={<Tooltip title="Copy to Custom Airport"><ContentCopyOutlinedIcon /></Tooltip>}
      onClick={handleOnClick}
      label="Copy to Custom Airport"
    />
  )
}

export default CopyAirportButton;