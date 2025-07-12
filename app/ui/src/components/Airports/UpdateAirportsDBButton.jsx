import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
// MUI Icons
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import { updateAirportsDB } from "../../util/http/airport";

export const UpdateAirportsDBButton = () => {
  const navigate = useNavigate();

  const { mutateAsync: updateDB, isError, error, isSuccess, isPending } = useMutation({
    mutationFn: () => updateAirportsDB({ navigate }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['airports'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to update airports database' });
  useSuccessNotification({ isSuccess, message: 'Airports database updated' });

  const handleOnUpdate = useCallback(async () => {
    await updateDB();
  }, [updateDB]);

  return (
    <>
      <Tooltip title="Update Airports Database">
        <IconButton size="small" onClick={handleOnUpdate} disabled={isPending}>
          {isPending && <CircularProgress size={20} />}
          {!isPending && <RefreshOutlinedIcon />}
        </IconButton>
      </Tooltip>
    </>
  );
}

export default UpdateAirportsDBButton;