import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useCallback } from "react";
import AddEditFlightrecordPersonModal from "./AddEditFlightrecordPersonModal";
import { printPerson } from '../../util/helpers';

export const EditFlightrecordPersonButton = ({ person, logUuid }) => {
  const dialogs = useDialogs();

  const handleOnClick = useCallback(async () => {
    const payload = {isNew: false, person_uuid: {label: printPerson(person), id: person.uuid}, role: person.role, log_uuid: logUuid}
    await dialogs.open(AddEditFlightrecordPersonModal, payload);
  }, [dialogs]);

  return (
    <>
      <Tooltip title="Edit role or person">
        <IconButton size="small" component="label" onClick={handleOnClick}>
          <EditOutlinedIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default EditFlightrecordPersonButton;
