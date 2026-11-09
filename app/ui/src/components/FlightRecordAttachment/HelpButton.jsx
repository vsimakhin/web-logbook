// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
// Custom
import HelpButtonDrawer from "../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: 'Add attachment',
    icon: AddBoxOutlinedIcon,
    description: `Add a new attachment to the flight record. 
      Any KML attachment can be converted to a track log using 'Convert to track' option`,
  },
  {
    title: 'Add track log',
    icon: MapOutlinedIcon,
    description: `Add a new track log (KML) to the flight record as attachment.
      It will update the flight map and recalculate the distance.
      If the track log attachment is removed, you will have an option to reset the map and recalculate the distance`,
  },
  {
    title: 'More actions',
    icon: AttachFileOutlinedIcon,
    description: `Click on the attachment icon to see more actions: download, delete, convert to track`,
  },
];

export const HelpButton = () => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
}

export default HelpButton;