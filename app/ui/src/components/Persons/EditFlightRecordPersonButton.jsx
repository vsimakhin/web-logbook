import { useDialogs } from "@toolpad/core/useDialogs";
// MUI
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MenuItem from '@mui/material/MenuItem';
// Custom
import { useCallback } from "react";
import AddEditFlightrecordPersonModal from "./AddEditFlightrecordPersonModal";
import { printPerson } from '../../util/helpers';

export const EditFlightrecordPersonButton = ({ person, logUuid, handleClose }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    handleClose();
    const payload = { isNew: false, person_uuid: { label: printPerson(person), id: person.uuid }, role: person.role, log_uuid: logUuid }
    await dialogs.open(AddEditFlightrecordPersonModal, payload);
  }, [dialogs]);

  return (
    <MenuItem onClick={handleOnClick} sx={{ p: 0, pr: 1 }}><EditOutlinedIcon sx={{ m: 1 }} color="action" />Edit Person</MenuItem>
  );
};

export default EditFlightrecordPersonButton;
