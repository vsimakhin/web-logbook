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
  filename: 'logbook',
});

const handleExportRows = (rows) => {
  const rowData = rows.map((row) => ({
    "Date": row.original.date,
    "Departure Place": row.original.departure.place,
    "Departure Time": row.original.departure.time,
    "Arrival Place": row.original.arrival.place,
    "Arrival Time": row.original.arrival.time,
    "Aircraft Model": row.original.aircraft.model,
    "Aircraft Reg": row.original.aircraft.reg_name,
    "Time SE": row.original.time.se_time,
    "Time ME": row.original.time.me_time,
    "Time MCC": row.original.time.mcc_time,
    "Time Total": row.original.time.total_time,
    "Landings Day": row.original.landings.day,
    "Landings Night": row.original.landings.night,
    "Time Night": row.original.time.night_time,
    "Time IFR": row.original.time.ifr_time,
    "Time PIC": row.original.time.pic_time,
    "Time CoPilot": row.original.time.copilot_time,
    "Time Dual": row.original.time.dual_time,
    "Time Instructor": row.original.time.instructor_time,
    "SIM Type": row.original.sim.type,
    "SIM Time": row.original.sim.time,
    "PIC Name": row.original.pic_name,
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