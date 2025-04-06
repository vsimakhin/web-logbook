// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
// Custom
import HelpButtonDrawer from "../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: "New flight record",
    icon: AddBoxOutlinedIcon,
    description: 'Create a new flight record with the departure field equal to the arrival field of the current flight',
  },
  {
    title: 'Copy flight record',
    icon: ContentCopyOutlinedIcon,
    description: 'Create a new flight record with the same values as the current flight',
  },
  {
    title: 'PIC Name',
    description: 'Double-click the field to set its value to \'Self\'',
  },
  {
    title: 'Time fields',
    description: 'Double-click the field copies value from \'Total time\' field',
  },
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
    title: 'Reset track log',
    icon: RouteOutlinedIcon,
    description: `Reset the flight track and recalculate the distance as a great circle between departure and arrival`
  }
];

export const HelpButton = () => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
}

export default HelpButton;