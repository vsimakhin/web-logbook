import { useCallback } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { useDialogs } from '../../hooks/useDialogs/useDialogs';

export const SaveCustomProfileButton = ({ profile, setCustomProfile }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    const confirmed = await dialogs.confirm('Create new custom import profile?', {
      title: 'Save custom profile',
      severity: 'info',
      okText: 'Yes, continue',
      cancelText: 'Arrr, no',
    });

    if (confirmed) {
      setCustomProfile(profile);
    }
  }, [profile, setCustomProfile, dialogs]);

  return (
    <Tooltip title="Save Custom Profile">
      <IconButton size="small" onClick={handleOnClick}><DownloadOutlinedIcon /></IconButton>
    </Tooltip>
  );
};

export default SaveCustomProfileButton;