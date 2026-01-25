// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
// MUI Icons
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import { ToolbarButton } from "@mui/x-data-grid";
// Custom components

export const ClearTableButton = ({ setData }) => {
  return (
    <Tooltip title="Clear table">
      <ToolbarButton size="small" onClick={() => setData([])} color="default" label="Clear table">
        <CleaningServicesOutlinedIcon />
      </ToolbarButton>
    </Tooltip>
  );
}

export default ClearTableButton;