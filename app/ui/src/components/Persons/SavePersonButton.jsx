import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
// Custom
import { queryClient } from "../../util/http/http";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { updatePerson, createPerson } from "../../util/http/person";

export const SavePersonButton = ({ person, isNew, onClose }) => {
  const mutateFn = isNew
    ? () => createPerson({ payload: person })
    : () => updatePerson({ payload: person });
  const {
    mutateAsync: savePerson,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: mutateFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["persons"] });
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: "Failed to save person" });
  useSuccessNotification({ isSuccess, message: "Person saved" });

  const handleOnClick = useCallback(async () => {
    const savedPerson = await savePerson();
    onClose(savedPerson);
  }, [savePerson, onClose]);

  return (
    <Tooltip title="Save">
      <IconButton size="small" onClick={handleOnClick}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
};

export default SavePersonButton;