import { useCallback, useMemo } from "react";
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
      const uuid = flight.uuid === "new" ? data : flight.uuid;

      if (flight.uuid === "new") {
        handleChange("uuid", uuid);
        navigate(`/logbook/${uuid}`);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["flight", uuid] }),
        queryClient.invalidateQueries({ queryKey: ["logbook"] }),
        queryClient.invalidateQueries({ queryKey: ["currency"] }),
        queryClient.invalidateQueries({ queryKey: ["aircrafts"] }),
        queryClient.invalidateQueries({ queryKey: ["models-categories"] }),
      ]);
    },
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save flight record' });
  useSuccessNotification({ isSuccess, message: 'Flight record saved' });

  const allowedUUIDs = useMemo(() => new Set((customFields || []).map((cf) => cf.uuid)), [customFields]);
  const handleClick = useCallback(() => {
    const sanitisedCustomFields = Object.fromEntries(
      Object.entries(flight.custom_fields ?? {}).filter(([key]) => allowedUUIDs.has(key))
    );

    saveFlightRecord({ flight: { ...flight, custom_fields: sanitisedCustomFields } });
  }, [saveFlightRecord, flight, allowedUUIDs]);

  return (
    <Tooltip title="Save flight record">
      <IconButton size="small" onClick={handleClick} disabled={isPending}>
        <SaveOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}

export default SaveFlightRecordButton;