import { ToolbarButton, useGridApiContext } from "@mui/x-data-grid";
import { useCallback } from "react";
import { Tooltip } from "@mui/material";
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';

export const XToolbarResetColumns = ({ initialColumns = [] }) => {
  const apiRef = useGridApiContext();

  const resetColumns = useCallback(() => {
    if (apiRef?.current) {
      initialColumns.forEach((column) => {
        apiRef.current.setColumnWidth(column.field, column.width);
      });
    }
  }, [apiRef, initialColumns]);

  return (
    <Tooltip title="Reset Column Sizing">
      <ToolbarButton onClick={resetColumns} color="default">
        <SettingsBackupRestoreOutlinedIcon />
      </ToolbarButton>
    </Tooltip>
  );
}

export default XToolbarResetColumns;
