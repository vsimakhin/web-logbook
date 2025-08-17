import { useMutation } from "@tanstack/react-query";
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { queryClient } from '../../util/http/http';
import { useCallback } from "react";
import { deletePersonToLog } from "../../util/http/person";

export const DeletePersonToLogButton = ({ person, logUuid }) => {
  const dialogs = useDialogs();

  const { mutateAsync: deleteFunction, isError, error } = useMutation({
    mutationFn: () => deletePersonToLog({payload: {person_uuid: person.uuid, log_uuid: logUuid}}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['persons-for-log', logUuid] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete person-to-log' });

  const handleDelete = useCallback(async () => {
    if (await dialogs.confirm('Are you sure you want to remove this person from this flight?')) {
      await deleteFunction();
    }
  }, [dialogs, deleteFunction]);

  return (
    <>
      <Tooltip title="Delete">
        <IconButton onClick={handleDelete}>
          <DeleteOutlinedIcon fontSize='small' />
        </IconButton>
      </Tooltip >
    </>
  );
}

export default DeletePersonToLogButton;