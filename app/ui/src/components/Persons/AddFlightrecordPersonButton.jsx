import { useCallback } from "react";
// MUI
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// Icons
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
// Custom components
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import AddEditFlightrecordPersonModal from "./AddEditFlightrecordPersonModal";

export const AddFlightrecordPersonButton = ({ id }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    const payload = { isNew: true, person_uuid: '', role: '', log_uuid: id }
    await dialogs.open(AddEditFlightrecordPersonModal, payload);
  }, [dialogs, id]);

  return (
    <Tooltip title="Add new person">
      <IconButton size="small" component="label" onClick={handleOnClick}>
        <AddBoxOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

export default AddFlightrecordPersonButton;
