import { useCallback } from 'react';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { ToolbarButton } from '@mui/x-data-grid';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
// Custom
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
    "Registration": row.reg,
    "Model": row.model,
    "Category": row.category,
  })),

  categories: (rows) => rows.map((row) => ({
    "Type": row.model,
    "Category": row.category,
  })),

  airports: (rows) => rows.map((row) => ({
    "ICAO": row.icao,
    "IATA": row.iata,
    "Name": row.name,
    "City": row.city,
    "Country": row.country,
    "Elevation": row.elevation,
    "Lat": row.lat,
    "Lon": row.lon,
  })),

  "custom-airports": (rows) => rows.map((row) => ({
    "Name": row.name,
    "City": row.city,
    "Country": row.country,
    "Elevation": row.elevation,
    "Lat": row.lat,
    "Lon": row.lon,
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
    "Year": row.year,
    "Month": row.month,
    "SE": convertMinutesToTime(row.time.se_time),
    "ME": convertMinutesToTime(row.time.me_time),
    "MCC": convertMinutesToTime(row.time.mcc_time),
    "Night": convertMinutesToTime(row.time.night_time),
    "IFR": convertMinutesToTime(row.time.ifr_time),
    "PIC": convertMinutesToTime(row.time.pic_time),
    "Co-Pilot": convertMinutesToTime(row.time.copilot_time),
    "Dual": convertMinutesToTime(row.time.dual_time),
    "Instructor": convertMinutesToTime(row.time.instructor_time),
    "CC": convertMinutesToTime(row.time.cc_time),
    "Sim": convertMinutesToTime(row.sim.time),
    "D/N": `${row.landings.day}/${row.landings.night}`,
    "Distance": row.distance,
    "Total": convertMinutesToTime(row.time.total_time),
  })),

  "totals-by-aircraft": (rows) => rows.map((row) => ({
    "Type/Category": row.model,
    "SE": convertMinutesToTime(row.time.se_time),
    "ME": convertMinutesToTime(row.time.me_time),
    "MCC": convertMinutesToTime(row.time.mcc_time),
    "Night": convertMinutesToTime(row.time.night_time),
    "IFR": convertMinutesToTime(row.time.ifr_time),
    "PIC": convertMinutesToTime(row.time.pic_time),
    "Co-Pilot": convertMinutesToTime(row.time.copilot_time),
    "Dual": convertMinutesToTime(row.time.dual_time),
    "Instructor": convertMinutesToTime(row.time.instructor_time),
    "CC": convertMinutesToTime(row.time.cc_time),
    "Sim": convertMinutesToTime(row.sim.time),
    "D/N": `${row.landings.day}/${row.landings.night}`,
    "Distance": row.distance,
    "Total": convertMinutesToTime(row.time.total_time),
  })),

  "persons": (rows) => rows.map((row) => ({
    "First Name": row.first_name,
    "Middle Name": row.middle_name,
    "Last Name": row.last_name,
  })),

  "person-flights": (rows) => rows.map((row) => ({
    "Date": row.date,
    "Role": row.role,
    "Departure": row.departure,
    "Arrival": row.arrival,
    "Aircraft Model": row.aircraft.model,
    "Aircraft Reg": row.aircraft.reg_name,
    "SIM Type": row.sim_type,
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
      <ToolbarButton onClick={handleCSVExport} color="default" label='Quick CSV Export'>
        <FileDownloadOutlinedIcon />
      </ToolbarButton>
    </Tooltip>
  )
}

export default CSVExportButton;