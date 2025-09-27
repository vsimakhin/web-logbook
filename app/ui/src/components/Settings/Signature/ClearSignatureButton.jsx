// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';

export const ClearSignatureButton = ({ handleChange }) => {
  return (
    <Tooltip title="Clear Signature">
      <IconButton size="small" onClick={() => handleChange('signature_image', null)}><CleaningServicesOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export default ClearSignatureButton;