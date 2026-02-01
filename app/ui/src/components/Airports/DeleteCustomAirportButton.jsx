import { useMutation } from "@tanstack/react-query";
import { useDialogs } from '@toolpad/core/useDialogs';
import { GridActionsCellItem } from "@mui/x-data-grid";
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// Custom components and libraries
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { deleteCustomAirport } from '../../util/http/airport';
import { queryClient } from '../../util/http/http';
import { useCallback } from "react";

export const DeleteCustomAirportButton = ({ params }) => {
  const dialogs = useDialogs();

  const { mutateAsync: deleteAirport, isError, error } = useMutation({
    mutationFn: () => deleteCustomAirport({ payload: params.row }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['custom-airports'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete custom airport' });

  const handleDelete = useCallback(async () => {
    const status = await dialogs.confirm(`Are you sure you want to delete this airport - ${params.row.name}?`, {
      title: 'Delete custom airport',
      severity: 'error',
      okText: 'Delete'
    });

    if (status) {
      await deleteAirport({ payload: params.row });
    }
  }, [dialogs, deleteAirport, params.row]);

  return (
    <GridActionsCellItem
      icon={<Tooltip title="Delete"><DeleteOutlinedIcon /></Tooltip>}
      onClick={handleDelete}
      label="Delete" showInMenu
    />
  );
}

export default DeleteCustomAirportButton;