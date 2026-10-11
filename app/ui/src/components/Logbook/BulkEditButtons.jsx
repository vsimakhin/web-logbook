import { useCallback } from 'react';
import { ToolbarButton } from '@mui/x-data-grid';
// MUI
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';
// MUI Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useMutation } from '@tanstack/react-query';
import { updateFlightRecord } from '../../util/http';
import { queryClient } from '../../util/http/http';
import { useErrorNotification } from '../../hooks/useAppNotifications';


export const BulkEditButtons = ({ isBulkEdit, setIsBulkEdit, setUpdatedRows, updatedRows, apiRef, data, setIsUpdating }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { mutateAsync: saveFlightRecord, isError, error } = useMutation({
    mutationFn: ({ flight }) => updateFlightRecord({ flight })
  });
  useErrorNotification({ isError, error, fallbackMessage: 'Failed to save flight record' });


  const onSaveHandle = useCallback(async () => {
    setIsUpdating(true);
    const rows = updatedRows.map(uuid => apiRef.current.getRow(uuid)).filter(Boolean);
    const failedUUIDs = [];

    for (const flight of rows) {
      try {
        await saveFlightRecord({ flight });
      } catch (error) {
        console.error(`Failed to save flight ${flight.uuid}:`, error);
        failedUUIDs.push(flight.uuid);
      }
    }

    // Keep only failed records for retry.
    setUpdatedRows(failedUUIDs);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["flight"] }),
      queryClient.invalidateQueries({ queryKey: ["logbook"] }),
      queryClient.invalidateQueries({ queryKey: ["currency"] }),
      queryClient.invalidateQueries({ queryKey: ["aircrafts"] }),
      queryClient.invalidateQueries({ queryKey: ["models-categories"] }),
    ]);

    setIsUpdating(false);

    if (failedUUIDs.length > 0) {
      console.error("Failed flight UUIDs:", failedUUIDs);
      return;
    }

    setIsBulkEdit(false);
  }, [updatedRows, setUpdatedRows, setIsBulkEdit, apiRef, saveFlightRecord, setIsUpdating]);

  const onCancelHandle = useCallback(() => {
    updatedRows.forEach(uuid => {
      const row = data.find(row => row.uuid === uuid);

      if (row) {
        apiRef.current.updateRows([row]);
      }
    });

    setUpdatedRows([]);
    setIsBulkEdit(false);
  }, [updatedRows, setUpdatedRows, setIsBulkEdit, data, apiRef]);

  const saveButtonLabel = `Save Logbook (${updatedRows.length} unsaved rows)`;

  if (isMobile) {
    return null; // don't show button on mobile screens currently
  }

  if (!isBulkEdit) {
    return (
      <>
        <Divider orientation='vertical' />
        <Tooltip title="Edit Logbook">
          <ToolbarButton onClick={() => setIsBulkEdit(true)} color="default" label='Edit Logbook'>
            <EditOutlinedIcon />
          </ToolbarButton>
        </Tooltip>
      </>
    );
  }

  return (
    <>
      <Divider orientation='vertical' />
      <Tooltip title={saveButtonLabel}>
        <ToolbarButton onClick={onSaveHandle} color="default" label={saveButtonLabel}>
          <Badge badgeContent={updatedRows.length} color="primary">
            <SaveOutlinedIcon />
          </Badge>
        </ToolbarButton>
      </Tooltip>
      <Tooltip title="Cancel Changes">
        <ToolbarButton onClick={onCancelHandle} color="default" label='Cancel Changes'>
          <CancelOutlinedIcon />
        </ToolbarButton>
      </Tooltip>
    </>
  );

}

export default BulkEditButtons;