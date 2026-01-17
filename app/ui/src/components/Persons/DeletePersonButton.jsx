import { useMutation } from "@tanstack/react-query";
import { useDialogs } from "@toolpad/core/useDialogs";
// MUI Icons
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
// Custom components and libraries
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import { deletePerson } from "../../util/http/person";
import { useCallback } from "react";
import { GridActionsCellItem } from "@mui/x-data-grid";

export const DeletePersonButton = ({ params }) => {
  const dialogs = useDialogs();

  const { mutateAsync: deletePersonFn, isError, isSuccess, error } = useMutation({
    mutationFn: () => deletePerson({ uuid: params.row.uuid }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["persons"] });
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: "Failed to delete person" });
  useSuccessNotification({ isSuccess, message: "Person deleted" });

  const handleDelete = useCallback(async () => {
    const status = await dialogs.confirm("Are you sure you want to delete this person and all references?", {
      title: "Delete Person",
      okText: "Delete",
      cancelText: "Cancel",
      severity: "error",
    });
    if (status) {
      await deletePersonFn(params.row);
    }
  }, [dialogs, params, deletePersonFn]);

  return (
    <GridActionsCellItem
      icon={<Tooltip title="Delete"><DeleteOutlinedIcon /></Tooltip>}
      onClick={handleDelete}
      label="Delete" showInMenu
    />
  );
};

export default DeletePersonButton;
