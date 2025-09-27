// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
// Custom components

export const ClearTableButton = ({ setData }) => {
  return (
    <Tooltip title="Clear table">
      <IconButton size="small" onClick={() => setData([])} ><CleaningServicesOutlinedIcon /></IconButton>
    </Tooltip>
  );
}

export default ClearTableButton;