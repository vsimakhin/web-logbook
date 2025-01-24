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
});

const handleExportRows = (rows) => {
  const rowData = rows.map((row) => ({
    "Category": row.original.category,
    "Name": row.original.name,
    "Number": row.original.number,
    "Issued": row.original.issued,
    "Valid From": row.original.valid_from,
    "Valid Until": row.original.valid_until,
    "Remarks": row.original.remarks,
  }));
  const csv = generateCsv(csvConfig)(rowData);
  download(csvConfig)(csv);
};

export const CSVExportButton = ({ table }) => {
  const handleCSVExport = useCallback((table) => {
    handleExportRows(table.getPrePaginationRowModel().rows);
  }, []);

  return (
    <Tooltip title="Quick CSV Export">
      <IconButton onClick={() => handleCSVExport(table)} size="small"><FileDownloadOutlinedIcon /></IconButton>
    </Tooltip>
  )
}

export default CSVExportButton;