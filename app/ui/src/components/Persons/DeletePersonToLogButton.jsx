import { useMutation } from "@tanstack/react-query";
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// MUI UI elements
import MenuItem from '@mui/material/MenuItem';
// Custom components and libraries
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { queryClient } from '../../util/http/http';
import { useCallback } from "react";
import { deletePersonToLog } from "../../util/http/person";

export const DeletePersonToLogButton = ({ person, logUuid, handleClose }) => {
  const dialogs = useDialogs();

  const { mutateAsync: deleteFunction, isError, error } = useMutation({
    mutationFn: () => deletePersonToLog({ payload: { person_uuid: person.uuid, log_uuid: logUuid } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["persons", "log", logUuid] })
      await queryClient.invalidateQueries({ queryKey: ["persons", "flights"] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete person-to-log' });

  const handleDelete = useCallback(async () => {
    handleClose();
    if (await dialogs.confirm('Are you sure you want to remove this person from this flight?')) {
      await deleteFunction();
    }
  }, [dialogs, deleteFunction]);

  return (
    <MenuItem onClick={handleDelete} sx={{ p: 0, pr: 1 }}><DeleteOutlinedIcon sx={{ m: 1 }} color="action" />Delete Person</MenuItem>
  );
}

export default DeletePersonToLogButton;