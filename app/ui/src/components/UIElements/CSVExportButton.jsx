import { useCallback } from 'react';
import { mkConfig, generateCsv, download } from 'export-to-csv';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
// MUI Icons
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { convertMinutesToTime } from '../../util/helpers';

const defaultConfig = {
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
  filename: 'export',
};

// Separate mappers for different exports
const exportMappers = {
  aircrafts: (rows) => rows.map((row) => ({
    "Registration": row.original.reg,
    "Model": row.original.model,
    "Category": row.original.category,
  })),

  categories: (rows) => rows.map((row) => ({
    "Type": row.original.model,
    "Category": row.original.category,
  })),

  airports: (rows) => rows.map((row) => ({
    "ICAO": row.original.icao,
    "IATA": row.original.iata,
    "Name": row.original.name,
    "City": row.original.city,
    "Country": row.original.country,
    "Elevation": row.original.elevation,
    "Lat": row.original.lat,
    "Lon": row.original.lon,
  })),

  "custom-airports": (rows) => rows.map((row) => ({
    "Name": row.original.name,
    "City": row.original.city,
    "Country": row.original.country,
    "Elevation": row.original.elevation,
    "Lat": row.original.lat,
    "Lon": row.original.lon,
  })),

  licensing: (rows) => rows.map((row) => ({
    "Category": row.category,
    "Name": row.name,
    "Number": row.number,
    "Issued": row.issued,
    "Valid From": row.valid_from,
    "Valid Until": row.valid_until,
    "Remarks": row.remarks,
  })),

  logbook: (rows) => rows.map((row) => ({
    "Date": row.date,
    "Departure Place": row.departure.place,
    "Departure Time": row.departure.time,
    "Arrival Place": row.arrival.place,
    "Arrival Time": row.arrival.time,
    "Aircraft Model": row.aircraft.model,
    "Aircraft Reg": row.aircraft.reg_name,
    "Time SE": row.time.se_time,
    "Time ME": row.time.me_time,
    "Time MCC": row.time.mcc_time,
    "Time Total": row.time.total_time,
    "Landings Day": row.landings.day,
    "Landings Night": row.landings.night,
    "Time Night": row.time.night_time,
    "Time IFR": row.time.ifr_time,
    "Time PIC": row.time.pic_time,
    "Time CoPilot": row.time.co_pilot_time,
    "Time Dual": row.time.dual_time,
    "Time Instructor": row.time.instructor_time,
    "SIM Type": row.sim.type,
    "SIM Time": row.sim.time,
    "PIC Name": row.pic_name,
    "Remarks": row.remarks,
  })),

  "totals-by-year": (rows) => rows.map((row) => ({
    "Year": row.original.year,
    "Month": row.original.month,
    "SE": convertMinutesToTime(row.original.time.se_time),
    "ME": convertMinutesToTime(row.original.time.me_time),
    "MCC": convertMinutesToTime(row.original.time.mcc_time),
    "Night": convertMinutesToTime(row.original.time.night_time),
    "IFR": convertMinutesToTime(row.original.time.ifr_time),
    "PIC": convertMinutesToTime(row.original.time.pic_time),
    "Co-Pilot": convertMinutesToTime(row.original.time.copilot_time),
    "Dual": convertMinutesToTime(row.original.time.dual_time),
    "Instructor": convertMinutesToTime(row.original.time.instructor_time),
    "CC": convertMinutesToTime(row.original.time.cc_time),
    "Sim": convertMinutesToTime(row.original.sim.time),
    "D/N": `${row.original.landings.day}/${row.original.landings.night}`,
    "Distance": row.original.distance,
    "Total": convertMinutesToTime(row.original.time.total_time),
  })),

  "totals-by-aircraft": (rows) => rows.map((row) => ({
    "Type/Category": row.original.model,
    "SE": convertMinutesToTime(row.original.time.se_time),
    "ME": convertMinutesToTime(row.original.time.me_time),
    "MCC": convertMinutesToTime(row.original.time.mcc_time),
    "Night": convertMinutesToTime(row.original.time.night_time),
    "IFR": convertMinutesToTime(row.original.time.ifr_time),
    "PIC": convertMinutesToTime(row.original.time.pic_time),
    "Co-Pilot": convertMinutesToTime(row.original.time.copilot_time),
    "Dual": convertMinutesToTime(row.original.time.dual_time),
    "Instructor": convertMinutesToTime(row.original.time.instructor_time),
    "CC": convertMinutesToTime(row.original.time.cc_time),
    "Sim": convertMinutesToTime(row.original.sim.time),
    "D/N": `${row.original.landings.day}/${row.original.landings.night}`,
    "Distance": row.original.distance,
    "Total": convertMinutesToTime(row.original.time.total_time),
  })),
};

const handleExportRows = (rows, type) => {
  const mapper = exportMappers[type];
  if (!mapper) return;

  const rowData = mapper(rows);
  const csvConfig = mkConfig({ ...defaultConfig, filename: type });
  const csv = generateCsv(csvConfig)(rowData);
  download(csvConfig)(csv);
};

export const CSVExportButton = ({ rows, type }) => {
  const handleCSVExport = useCallback(() => {
    handleExportRows(rows, type);
  }, [rows, type]);

  return (
    <Tooltip title="Quick CSV Export">
      <IconButton onClick={handleCSVExport} size="small">
        <FileDownloadOutlinedIcon />
      </IconButton>
    </Tooltip>
  )
}

export default CSVExportButton;