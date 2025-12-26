import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useCallback } from "react";
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
