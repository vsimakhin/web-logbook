import { useMutation } from "@tanstack/react-query";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useNavigate } from "react-router-dom";
// MUI Icons
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// Custom components and libraries
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import { deletePerson } from "../../util/http/person";
import { useCallback } from "react";

export const DeletePersonButton = ({ payload }) => {
  const navigate = useNavigate();
  const dialogs = useDialogs();

  const {
    mutateAsync: deletePersonFn,
    isError,
    isSuccess,
    error
  } = useMutation({
    mutationFn: () => deletePerson({ uuid: payload.uuid, navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["persons"] });
    },
  });
  useErrorNotification({
    isError,
    error,
    fallbackMessage: "Failed to delete person",
  });
  useSuccessNotification({ isSuccess, message: "Person deleted" });
  // TODO notifications don't work....

  const handleDelete = useCallback(async () => {
    if (
      await dialogs.confirm(
        "Are you sure you want to delete this person and all references?"
      )
    ) {
      await deletePersonFn({ payload });
    }
  }, [dialogs, payload, deletePersonFn]);

  return (
    <>
      <Tooltip title="Delete">
        <IconButton onClick={handleDelete}>
          <DeleteOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default DeletePersonButton;
