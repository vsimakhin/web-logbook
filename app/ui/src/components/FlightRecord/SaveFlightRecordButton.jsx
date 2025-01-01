import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { createFlightRecord, updateFlightRecord } from "../../util/http/logbook";
import { useErrorNotification, useSuccessNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";

export const SaveFlightRecordButton = ({ flight }) => {
  const navigate = useNavigate();

  const mutationFn = flight.uuid === "new"
    ? () => createFlightRecord({ flight, navigate })
    : () => updateFlightRecord({ flight, navigate });

  const { mutateAsync: saveFlightRecord, isError, error, isSuccess } = useMutation({
    mutationFn: () => mutationFn(),
    onSuccess: async ({ data }) => {
      if (flight.uuid === "new") {
        navigate(`/logbook/${data}`);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['flight', flight.id] })
        await queryClient.invalidateQueries({ queryKey: ['logbook'] })
      }
    }
  });

  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save flight record' });
  useSuccessNotification({ isSuccess, message: 'Flight record saved' });

  return (
    <>
      <Tooltip title="Save flight record">
        <IconButton size="small" onClick={() => saveFlightRecord()}><SaveOutlinedIcon /></IconButton>
      </Tooltip>
    </>
  );
}

export default SaveFlightRecordButton;