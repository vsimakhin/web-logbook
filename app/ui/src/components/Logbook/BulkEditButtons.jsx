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

export const BulkEditButtons = ({ isBulkEdit, setIsBulkEdit, updatedRowCount, onSave, onCancel }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const onSaveHandle = useCallback(() => {
    onSave();
    setIsBulkEdit(false);
  }, [setIsBulkEdit, onSave]);

  const onCancelHandle = useCallback(() => {
    onCancel();
    setIsBulkEdit(false);
  }, [setIsBulkEdit, onCancel]);

  const saveButtonLabel = `Save Logbook (${updatedRowCount} unsaved rows)`;

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
          <Badge badgeContent={updatedRowCount} color="primary">
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