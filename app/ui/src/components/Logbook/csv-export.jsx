import { mkConfig, generateCsv, download } from 'export-to-csv';

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
});

export const handleExportRows = (rows) => {
  const rowData = rows.map((row) => ({
    date: row.original.date,
    "departue place": row.original.departure.place,
    "departure time": row.original.departure.time,
    "arrival place": row.original.arrival.place,
    "arrival time": row.original.arrival.time,
    "aircraft type": row.original.aircraft.model,
    "aircraft reg": row.original.aircraft.reg_name,
    "se time": row.original.time.se_time,
    "me time": row.original.time.me_time,
    "mcc time": row.original.time.mcc_time,
    "total time": row.original.time.total_time,
    "pic name": row.original.pic_name,
    "day landings": row.original.landings.day,
    "night landings": row.original.landings.night,
    "night time": row.original.time.night_time,
    "ifr time": row.original.time.ifr_time,
    "pic time": row.original.time.pic_time,
    "copilot time": row.original.time.copilot_time,
    "dual time": row.original.time.dual_time,
    "instr time": row.original.time.instructor_time,
    "sim type": row.original.sim.type,
    "sim time": row.original.sim.time,
    "remarks": row.original.remarks,
  }));
  const csv = generateCsv(csvConfig)(rowData);
  download(csvConfig)(csv);
};