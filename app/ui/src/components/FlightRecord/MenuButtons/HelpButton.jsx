// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
// Custom
import HelpButtonDrawer from "../../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: "Sign flight record",
    icon: DrawOutlinedIcon,
    description: 'Sign the flight record. Signature will be visible in the PDF export.',
  },
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
    title: 'Return flight record',
    icon: AssignmentReturnOutlinedIcon,
    description: `Create a new flight record based on the current flight: 
      swap the Departure/Arrival Place, copy over the aircraft/reg, PIC and any persons`,
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