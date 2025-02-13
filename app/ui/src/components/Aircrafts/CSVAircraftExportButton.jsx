import { useCallback } from 'react';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

import { mkConfig, generateCsv, download } from 'export-to-csv';

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
  filename: 'aircrafts',
});

const handleExportRows = (rows) => {
  const rowData = rows.map((row) => ({
    "Registration": row.original.reg,
    "Model": row.original.model,
    "Category": row.original.category,
  }));
  const csv = generateCsv(csvConfig)(rowData);
  download(csvConfig)(csv);
};

export const CSVAircraftExportButton = ({ table }) => {
  const handleCSVExport = useCallback((table) => {
    handleExportRows(table.getPrePaginationRowModel().rows);
  }, []);

  return (
    <Tooltip title="Quick CSV Export">
      <IconButton onClick={() => handleCSVExport(table)} size="small"><FileDownloadOutlinedIcon /></IconButton>
    </Tooltip>
  )
}

export default CSVAircraftExportButton;