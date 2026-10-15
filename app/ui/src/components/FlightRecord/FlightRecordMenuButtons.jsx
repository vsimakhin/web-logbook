import { useCallback, useMemo, useState } from 'react';
// MUI UI elements
import IconButton from "@mui/material/IconButton";
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip'
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import Divider from '@mui/material/Divider';
// Custom
import HelpButton from "./HelpButton";
import NewFlightRecordButton from "./NewFlightRecordButton";
import CopyFlightRecordButton from "./CopyFlightRecordButton";
import SaveFlightRecordButton from "./SaveFlightRecordButton";
import DeleteFlightRecordButton from "./DeleteFlightRecordButton";
import ResetTrackButton from "./ResetTrackButton";
import ShowHideFieldsButton from './ShowHideFieldsButton';
import SignFlightRecordButton from './SignFlightRecordButton';
import ReturnFlightRecordButton from './ReturnFlightRecordButton';
import EditLayoutButton from './MenuButtons/EditLayoutButton';
import SaveLayoutButton from './MenuButtons/SaveLayoutButton';
import ResetLayoutButton from './MenuButtons/ResetLayoutButton';

export const FlightRecordMenuButtons = ({ flight, handleChange, editingLayout, setEditingLayout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleCloseMenu = useCallback(() => setAnchorEl(null), []);

  const moreActions = useMemo(() => {
    if (editingLayout) return null;

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
          {flight.uuid !== "new" && <SignFlightRecordButton uuid={flight.uuid} handleCloseMenu={handleCloseMenu} />}
          {flight.uuid !== "new" && <NewFlightRecordButton flight={flight} handleCloseMenu={handleCloseMenu} />}
          {flight.uuid !== "new" && <ReturnFlightRecordButton flight={flight} handleCloseMenu={handleCloseMenu} />}
          {flight.uuid !== "new" && <CopyFlightRecordButton flight={flight} handleCloseMenu={handleCloseMenu} />}
          {flight.track && <ResetTrackButton uuid={flight.uuid} handleChange={handleChange} handleCloseMenu={handleCloseMenu} />}
          {flight.uuid !== "new" && <DeleteFlightRecordButton uuid={flight.uuid} handleCloseMenu={handleCloseMenu} />}
          <Divider />
          <ShowHideFieldsButton handleCloseMenu={handleCloseMenu} />
          <EditLayoutButton handleCloseMenu={handleCloseMenu} setEditingLayout={setEditingLayout} />
        </Menu>
      </>
    )
  }, [handleClick, anchorEl, handleCloseMenu, handleChange, flight, setEditingLayout, editingLayout]);

  const standardMenuButtons = useMemo(() => {
    if (editingLayout) return null;

    return (
      <>
        <HelpButton />
        <SaveFlightRecordButton flight={flight} handleChange={handleChange} />
      </>
    )
  }, [handleChange, flight, editingLayout])

  const manageProfileLayoutButtons = useMemo(() => {
    if (!editingLayout) return null;

    return (
      <>
        <ResetLayoutButton setEditingLayout={setEditingLayout} />
        <SaveLayoutButton setEditingLayout={setEditingLayout} />
      </>
    )
  }, [editingLayout, setEditingLayout])

  return (
    <>
      {manageProfileLayoutButtons}
      {standardMenuButtons}
      {moreActions}
    </>
  );
};

export default FlightRecordMenuButtons;