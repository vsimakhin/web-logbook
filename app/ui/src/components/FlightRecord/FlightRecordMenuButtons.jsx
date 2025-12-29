import { useCallback, useMemo, useState } from 'react';
// MUI UI elements
import IconButton from "@mui/material/IconButton";
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip'
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
// Custom
import HelpButton from "./HelpButton";
import NewFlightRecordButton from "./NewFlightRecordButton";
import CopyFlightRecordButton from "./CopyFlightRecordButton";
import SaveFlightRecordButton from "./SaveFlightRecordButton";
import DeleteFlightRecordButton from "./DeleteFlightRecordButton";
import ResetTrackButton from "./ResetTrackButton";
import ShowHideFieldsButton from './ShowHideFieldsButton';
import SignFlightRecordButton from './SignFlightRecordButton';

export const FlightRecordMenuButtons = ({ flight, handleChange, setFlight }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleCloseMenu = useCallback(() => setAnchorEl(null), []);

  const moreActions = useMemo(() => {
    return (
      <>
        <Tooltip title="More actions">
          <IconButton onClick={handleClick} size="small"><MoreVertOutlinedIcon /></IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          {flight.uuid !== "new" && <SignFlightRecordButton payload={flight.uuid} handleCloseMenu={handleCloseMenu} />}
          {flight.uuid !== "new" && <NewFlightRecordButton setFlight={setFlight} handleCloseMenu={handleCloseMenu} />}
          {flight.uuid !== "new" && <CopyFlightRecordButton setFlight={setFlight} handleCloseMenu={handleCloseMenu} />}
          {flight.track && <ResetTrackButton flight={flight} handleChange={handleChange} handleCloseMenu={handleCloseMenu} />}
          {flight.uuid !== "new" && <DeleteFlightRecordButton flight={flight} handleCloseMenu={handleCloseMenu} />}
          <ShowHideFieldsButton handleCloseMenu={handleCloseMenu} />
        </Menu>
      </>
    )
  }, [handleClick, anchorEl, handleCloseMenu, flight, setFlight, handleChange]);

  return (
    <>
      <HelpButton />
      <SaveFlightRecordButton flight={flight} handleChange={handleChange} />
      {moreActions}
    </>
  );
};

export default FlightRecordMenuButtons;