import { useState } from 'react';
// MUI UI elements
import IconButton from "@mui/material/IconButton";
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip'
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
// Custom
import HelpButton from "./MenuButtons/HelpButton";
import NewFlightRecordButton from "./MenuButtons/NewFlightRecordButton";
import CopyFlightRecordButton from "./MenuButtons/CopyFlightRecordButton";
import SaveFlightRecordButton from "./MenuButtons/SaveFlightRecordButton";
import DeleteFlightRecordButton from "./MenuButtons/DeleteFlightRecordButton";
import ResetTrackButton from "./MenuButtons/ResetTrackButton";
import ShowHideFieldsButton from './MenuButtons/ShowHideFieldsButton';
import SignFlightRecordButton from './MenuButtons/SignFlightRecordButton';
import ReturnFlightRecordButton from './MenuButtons/ReturnFlightRecordButton';
import EditLayoutButton from './MenuButtons/EditLayoutButton';
import SaveLayoutButton from './MenuButtons/SaveLayoutButton';
import ResetLayoutButton from './MenuButtons/ResetLayoutButton';
import NewPDFPageButton from './MenuButtons/NewPDFPageButton';

export const FlightRecordMenuButtons = ({ flight, handleChange, editingLayout, setEditingLayout, layouts, setLayouts }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [layoutAnchorEl, setLayoutAnchorEl] = useState(null);

  const handleCloseMenu = () => setAnchorEl(null);
  const handleCloseLayoutMenu = () => setLayoutAnchorEl(null);

  if (editingLayout) {
    return (
      <>
        <ResetLayoutButton setLayouts={setLayouts} />
        <SaveLayoutButton setEditingLayout={setEditingLayout} layouts={layouts} />
      </>
    );
  }

  const isSaved = flight.uuid !== "new";

  return (
    <>
      <HelpButton />
      <SaveFlightRecordButton flight={flight} handleChange={handleChange} />

      <Tooltip title="More actions">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
          <MoreVertOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {isSaved && [
          <SignFlightRecordButton key="sign" uuid={flight.uuid} handleCloseMenu={handleCloseMenu} />,
          <NewFlightRecordButton key="new" flight={flight} handleCloseMenu={handleCloseMenu} />,
          <ReturnFlightRecordButton key="return" flight={flight} handleCloseMenu={handleCloseMenu} />,
          <CopyFlightRecordButton key="copy" flight={flight} handleCloseMenu={handleCloseMenu} />,
          <NewPDFPageButton key="new_pdf_page" flight={flight} handleChange={handleChange} handleCloseMenu={handleCloseMenu} />,
        ]}
        {flight.track && <ResetTrackButton uuid={flight.uuid} handleChange={handleChange} handleCloseMenu={handleCloseMenu} />}
        {isSaved && <DeleteFlightRecordButton uuid={flight.uuid} handleCloseMenu={handleCloseMenu} />}
      </Menu>

      <Tooltip title="Fields Layout">
        <IconButton onClick={(e) => setLayoutAnchorEl(e.currentTarget)} size="small">
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={layoutAnchorEl}
        open={Boolean(layoutAnchorEl)}
        onClose={handleCloseLayoutMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <ShowHideFieldsButton handleCloseMenu={handleCloseLayoutMenu} />
        <EditLayoutButton handleCloseMenu={handleCloseLayoutMenu} setEditingLayout={setEditingLayout} />
      </Menu>
    </>
  );
};

export default FlightRecordMenuButtons;