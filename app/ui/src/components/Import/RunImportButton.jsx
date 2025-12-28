import { useDialogs } from "@toolpad/core/useDialogs";
// MUI UI elements
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
// MUI Icons
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
// Custom components
import { marshallItem } from "./helpers";
import { useMutation } from "@tanstack/react-query";
import { runImport } from "../../util/http/import";
import { useErrorNotification } from "../../hooks/useAppNotifications";
import { queryClient } from "../../util/http/http";
import ImportLogDialog from "./ImportLogDialog";

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

  const importData = async (recalculate) => {
    setInProgress(true);

    const convertedData = [];
    for (const item of data) {
      convertedData.push(marshallItem(item));
    }

    const payload = {
      recalculate_night_time: recalculate,
      data: convertedData,
    };

    try {
      await importFlightRecords({ payload });
    } finally {
      setInProgress(false);
    }
  }

  const handleImportClick = async () => {
    const confirmed = await dialogs.confirm('Have you created a backup before import data?', {
      title: 'Backup data',
      severity: 'error',
      okText: 'Yes, continue',
      cancelText: 'Arrr, no',
    });

    if (confirmed) {
      const recalculate = await dialogs.confirm('Do you want to recalculate night time for the imported records?', {
        title: 'Recalculate night time',
        severity: 'error',
        okText: 'Yes, recalculate',
        cancelText: 'No, leave as is',
      });
      await importData(recalculate);
    }
  };

  return (
    <Tooltip title="Run Import">
      <span>
        <IconButton size="small" disabled={inProgress || data.length === 0} onClick={handleImportClick} ><FileUploadOutlinedIcon /></IconButton>
      </span>
    </Tooltip>
  );
}

export default RunImportButton;