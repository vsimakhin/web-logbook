import { useCallback } from 'react';
// MUI
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
// MUI Icons
import SettingsIcon from '@mui/icons-material/Settings';
// Custom
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import MapOptionsModal from './MapOptionsModal';

export const MapOptionsButton = () => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    await dialogs.open(MapOptionsModal)
  }, [dialogs]);

  return (
    <Tooltip title="More map options">
      <IconButton size="small" onClick={handleOnClick} >
        <SettingsIcon />
      </IconButton>
    </Tooltip>
  );
};

export default MapOptionsButton;