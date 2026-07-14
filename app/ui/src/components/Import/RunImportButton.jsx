import { ToolbarButton } from "@mui/x-data-grid";
import { useMutation } from "@tanstack/react-query";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
// MUI Icons
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
// Custom components
import { runImport } from "../../util/http/import";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import ImportLogDialog from "./ImportLogDialog";
import { useDialogs } from '../../hooks/useDialogs/useDialogs';
import ImportOptionsDialog from "./ImportOptionsDialog";

export const RunImportButton = ({ data, inProgress, setInProgress }) => {
  const dialogs = useDialogs();

  const { mutateAsync: importFlightRecords, isError, error } = useMutation({
    mutationFn: ({ payload }) => runImport({ payload }),
    onSuccess: async (payload) => {
      if (payload) {
        await dialogs.open(ImportLogDialog, payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['logbook'] })
    }
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to import flight records' });

  const importData = async (options) => {
    setInProgress(true);

    // need to marshal custom fields in the data to the string, since go struct field is string as well
    const marshalledData = data.map((item) => ({
      ...item,
      custom_fields:
        typeof item.custom_fields === "string"
          ? item.custom_fields
          : JSON.stringify(item.custom_fields ?? {}),
    }));

    const payload = {
      options,
      data: marshalledData,
    };

    try {
      await importFlightRecords({ payload });
    } finally {
      setInProgress(false);
    }
  }

  const handleImportClick = async () => {
    const options = await dialogs.open(ImportOptionsDialog);
    if (options && options.backup) {
      await importData(options);
    }
  };

  return (
    <Tooltip title="Run Import">
      <span>
        <ToolbarButton disabled={inProgress || data.length === 0} onClick={handleImportClick} color="default" label="Run Import">
          <FileUploadOutlinedIcon />
        </ToolbarButton>
      </span>
    </Tooltip>
  );
}

export default RunImportButton;