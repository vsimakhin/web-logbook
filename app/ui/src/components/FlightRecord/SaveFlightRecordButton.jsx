import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
// Custom
import { createFlightRecord, updateFlightRecord } from "../../util/http/logbook";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";

export const SaveFlightRecordButton = ({ flight, handleChange }) => {
  const navigate = useNavigate();

  const mutationFn = flight.uuid === "new"
    ? () => createFlightRecord({ flight, navigate })
    : () => updateFlightRecord({ flight, navigate });

  const { mutateAsync: saveFlightRecord, isError, error, isSuccess, isPending } = useMutation({
    mutationFn: () => mutationFn(),
    onSuccess: async ({ data }) => {
      if (flight.uuid === "new") {
        handleChange("uuid", data);
        navigate(`/logbook/${data}`);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['flight', flight.id] });
      }
      await queryClient.invalidateQueries({ queryKey: ['logbook'] });
      await queryClient.invalidateQueries({ queryKey: ['map-logbook'] });
      await queryClient.invalidateQueries({ queryKey: ['aircraft-models'] });
      await queryClient.invalidateQueries({ queryKey: ['aircraft-regs'] });
      await queryClient.invalidateQueries({ queryKey: ['currency'] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save flight record' });
  useSuccessNotification({ isSuccess, message: 'Flight record saved' });

  const handleClick = useCallback(async () => {
    await saveFlightRecord({ flight, navigate });
  }, [saveFlightRecord, flight, navigate]);

  return (
    <Tooltip title="Save flight record">
      <IconButton size="small" onClick={handleClick} disabled={isPending}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}

export default SaveFlightRecordButton;