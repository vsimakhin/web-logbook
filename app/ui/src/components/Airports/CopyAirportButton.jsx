import { useDialogs } from '@toolpad/core/useDialogs';
// MUI Icons
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import AddEditCustomAirportModal from './AddEditCustomAirportModal';

export const CopyAirportButton = ({ payload }) => {
  const dialogs = useDialogs();

  return (
    <>
      <Tooltip title="Copy to Custom Airport">
        <IconButton onClick={async () => await dialogs.open(AddEditCustomAirportModal, { ...payload, isNew: true })}>
          <ContentCopyOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </>
  )
}

export default CopyAirportButton;