import { useMutation } from "@tanstack/react-query";
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { deleteCustomAirport } from '../../util/http/airport';
import { queryClient } from '../../util/http/http';
import { useCallback } from "react";

export const DeleteCustomAirportButton = ({ payload }) => {
  const dialogs = useDialogs();

  const { mutateAsync: deleteAirport, isError, error } = useMutation({
    mutationFn: () => deleteCustomAirport({ payload }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom-airports'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete custom airport' });

  const handleDelete = useCallback(async () => {
    if (await dialogs.confirm('Are you sure you want to delete this airport?')) {
      await deleteAirport({ payload });
    }
  }, [dialogs, deleteAirport, payload]);

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

export default DeleteCustomAirportButton;