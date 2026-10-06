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

export const BulkEditButtons = ({ isBulkEdit, setIsBulkEdit, updatedRows, setUpdatedRows, apiRef }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const onSaveHandle = useCallback(() => {
    const rows = [...updatedRows.values()].map(({ updated }) => updated);
    console.log("Saving...", rows);
    setUpdatedRows(new Map());
    setIsBulkEdit(false);
  }, [setIsBulkEdit, updatedRows, setUpdatedRows]);

  const onCancelHandle = useCallback(() => {
    console.log("Cancel...");
    for (const { original } of updatedRows.values()) {
      apiRef.current.updateRows([original]);
    }

    setUpdatedRows(new Map());
    setIsBulkEdit(false);
  }, [setIsBulkEdit, updatedRows, apiRef, setUpdatedRows])

  const unsavedChanges = updatedRows.size;
  const saveButtonLabel = `Save Logbook (${unsavedChanges} unsaved rows)`;

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
          <Badge badgeContent={unsavedChanges} color="primary">
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