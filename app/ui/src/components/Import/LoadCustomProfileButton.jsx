import { useCallback } from "react";
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';


export const LoadCustomProfileButton = ({ customProfile, setProfile, headers }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    if (!customProfile || Object.keys(customProfile).length === 0) {
      await dialogs.alert("No custom profile found.", { title: 'Load custom profile' });
      return;
    }

    const missingHeaders = Object.entries(customProfile)
      .filter(([key, value]) => key !== 'pic_self_replace' && value !== "")
      .map(([, value]) => value)
      .filter((value) => !headers.includes(value));

    if (missingHeaders.length > 0) {
      await dialogs.alert(`The following columns are in the custom profile but missing in the CSV: ${missingHeaders.join(", ")}`, { title: 'Load custom profile' });
    }

    // load profile withouth missing headers and keep pic_self_replace
    const profile = Object.entries(customProfile)
      .reduce((acc, [key, value]) => {
        if (headers.includes(value) || key === 'pic_self_replace') {
          acc[key] = value;
        }
        return acc;
      }, {});

    setProfile(profile);
  }, [customProfile, setProfile, headers, dialogs]);

  return (
    <Tooltip title="Load Custom Profile">
      <IconButton size="small" onClick={handleOnClick}>
        <UploadOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}

export default LoadCustomProfileButton;
