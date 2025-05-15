import { useNavigate } from 'react-router-dom';
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import NavigateNextOutlinedIcon from '@mui/icons-material/NavigateNextOutlined';
import NavigateBeforeOutlinedIcon from '@mui/icons-material/NavigateBeforeOutlined';
import { Box } from '@mui/material';

export const FlightTitle = ({ flight }) => {
  const navigate = useNavigate();

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {"Flight Record "}
        {flight.prev_uuid && (
          <Tooltip title="Previous flight record">
            <IconButton size="small" onClick={() => navigate(`/logbook/${flight.prev_uuid}`)}>
              <NavigateBeforeOutlinedIcon />
            </IconButton>
          </Tooltip>
        )}
        {flight.next_uuid && (
          <Tooltip title="Next flight record">
            <IconButton size="small" onClick={() => navigate(`/logbook/${flight.next_uuid}`)}>
              <NavigateNextOutlinedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </>
  )
}

export default FlightTitle;