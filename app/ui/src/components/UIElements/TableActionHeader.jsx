import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import Tooltip from '@mui/material/Tooltip';

export const TableActionHeader = () => {
  return (
    <Tooltip title="Actions" disableInteractive><MoreVertOutlinedIcon fontSize="small" /></Tooltip>
  );
};

export default TableActionHeader;
