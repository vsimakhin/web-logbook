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
import useCustomFields from "../../hooks/useCustomFields";

export const SaveFlightRecordButton = ({ flight, handleChange }) => {
  const navigate = useNavigate();
  const { customFields } = useCustomFields();

  const { mutateAsync: saveFlightRecord, isError, error, isSuccess, isPending } = useMutation({
    mutationFn: ({ flight }) =>
      flight.uuid === "new"
        ? createFlightRecord({ flight })
        : updateFlightRecord({ flight }),

    onSuccess: async ({ data }, { flight }) => {
      if (flight.uuid === "new") {
        handleChange("uuid", data);
        navigate(`/logbook/${data}`);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['flight', flight.uuid] });
      }

      await queryClient.invalidateQueries({ queryKey: ['logbook'] });
      await queryClient.invalidateQueries({ queryKey: ['currency'] });
      await queryClient.invalidateQueries({ queryKey: ['aircrafts'] });
      await queryClient.invalidateQueries({ queryKey: ['models-categories'] });
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save flight record' });
  useSuccessNotification({ isSuccess, message: 'Flight record saved' });

  const handleClick = useCallback(async () => {
    const allowedUUIDs = new Set(customFields.map((cf) => cf.uuid));

    const sanitisedCustomFields = Object.fromEntries(
      Object.entries(flight.custom_fields ?? {}).filter(([key]) => allowedUUIDs.has(key))
    );

    await saveFlightRecord({
      flight: {
        ...flight,
        custom_fields: sanitisedCustomFields
      }
    });
  }, [saveFlightRecord, flight, customFields]);

  return (
    <Tooltip title="Save flight record">
      <IconButton size="small" onClick={handleClick} disabled={isPending}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}

export default SaveFlightRecordButton;