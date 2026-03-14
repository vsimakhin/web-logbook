import { useCallback } from 'react';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { ToolbarButton } from '@mui/x-data-grid';
// MUI UI elements
import Tooltip from '@mui/material/Tooltip';
// MUI Icons
import SvgIcon from '@mui/material/SvgIcon';
// Custom
import { convertMinutesToTime } from '../../util/helpers';

// google material icon since there is no csv icon in material ui icons
const CsvIcon = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 -960 960 960">
      <path d="M230-360h120v-60H250v-120h100v-60H230q-17 0-28.5 11.5T190-560v160q0 17 11.5 28.5T230-360Zm156 0h120q17 0 28.5-11.5T546-400v-60q0-17-11.5-31.5T506-506h-60v-34h100v-60H426q-17 0-28.5 11.5T386-560v60q0 17 11.5 30.5T426-456h60v36H386v60Zm264 0h60l70-240h-60l-40 138-40-138h-60l70 240ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z" />
    </SvgIcon>
  );
}


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
  if (!rows || rows.length === 0) return;

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
        <CsvIcon />
      </ToolbarButton>
    </Tooltip>
  )
}

export default CSVExportButton;