import { useDialogs } from '@toolpad/core/useDialogs';
import { useCallback } from 'react';
// MUI Icons
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';

export const CopyAirportButton = ({ payload }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    await dialogs.open(AddEditCustomAirportModal, { ...payload, isNew: true });
  }, [dialogs, payload]);

  return (
    <>
      <Tooltip title="Copy to Custom Airport">
        <IconButton onClick={handleOnClick}>
          <ContentCopyOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </>
  )
}

export default CopyAirportButton;