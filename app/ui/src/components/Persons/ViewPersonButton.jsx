import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// MUI Icons
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import { GridActionsCellItem } from '@mui/x-data-grid';

export const ViewPersonButton = ({ params }) => {
  const navigate = useNavigate();

  const handleOnClick = useCallback(async () => {
    navigate(`/persons/${params.row.uuid}`)
  }, [params.row.uuid, navigate]);

  return (
    <GridActionsCellItem
      icon={<Tooltip title="View"><VisibilityOutlinedIcon /></Tooltip>}
      onClick={handleOnClick}
      label="View" showInMenu
    />
  );
}

export default ViewPersonButton;