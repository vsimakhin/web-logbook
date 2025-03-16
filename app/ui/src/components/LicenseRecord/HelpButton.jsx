// MUI Icons
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import FolderDeleteOutlinedIcon from '@mui/icons-material/FolderDeleteOutlined';
import HelpButtonDrawer from "../UIElements/HelpButtonDrawer";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

const HELP_CONTENT = [
  {
    title: "License Record Preview",
    description: 'Show preview for PDF and image attached files. Other formats might not be supported.',
  },
  {
    title: 'Delete Attachment',
    icon: FolderDeleteOutlinedIcon,
    description: 'Delete attachment for the license record',
  },
  {
    title: 'Download attachment',
    icon: CloudDownloadOutlinedIcon,
    description: 'Download attachment',
  },
  {
    title: 'Delete License',
    icon: DeleteOutlinedIcon,
    description: 'Delete license record',
  },
];


export const HelpButton = () => {
  return (
    <HelpButtonDrawer content={HELP_CONTENT} />
  );
}

export default HelpButton;