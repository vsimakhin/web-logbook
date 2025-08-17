// import { useMutation } from "@tanstack/react-query";
import { useDialogs } from '@toolpad/core/useDialogs';
// MUI Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// Custom components and libraries
// import { useErrorNotification } from "../../hooks/useAppNotifications";
// import { queryClient } from '../../util/http/http';
import { useCallback } from "react";

export const DeletePersonButton = ({ payload }) => {
  const dialogs = useDialogs();

  // const { mutateAsync: deletePerson, isError, error } = useMutation({
  //   mutationFn: () => deletePerson({ payload }),
  //   onSuccess: async () => {
  //     await queryClient.invalidateQueries({ queryKey: ['persons'] })
  //   }
  // });
  // useErrorNotification({ isError, error, fallbackMessage: 'Failed to delete person' });

  const handleDelete = useCallback(async () => {
    if (await dialogs.confirm('TODO! Are you sure you want to delete this person and all references?')) {
      // await deletePerson({ payload });
      // TODO
    }
  }, [dialogs, payload]);
  // }, [dialogs, deletePerson, payload]);

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

export default DeletePersonButton;