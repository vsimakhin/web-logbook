// MUI Icons
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
// Custom
import HelpButtonDrawer from "../UIElements/HelpButtonDrawer";

const HELP_CONTENT = [
  {
    title: "New flight record",
    icon: AddBoxOutlinedIcon,
    description: 'Creates a new flight record with the departure field equal to the arrival field of the current flight',
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
];

export const HelpButton = () => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
}

export default HelpButton;