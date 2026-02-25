import { useCallback } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';


export const LoadCustomProfileButton = ({ customProfile, setProfile }) => {
  const handleOnClick = useCallback(() => {
    setProfile(customProfile);
  }, [customProfile, setProfile]);

  return (
    <Tooltip title="Load Custom Profile">
      <IconButton size="small" onClick={handleOnClick}>
        <UploadOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}

export default LoadCustomProfileButton;
