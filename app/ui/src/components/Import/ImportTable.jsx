import { useMemo, useState } from 'react';
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
// Custom components and libraries
import OpenCSVButton from './OpenCSVButton';
import ClearTableButton from './ClearTableButton';
import RunImportButton from './RunImportButton';
import HelpButton from './HelpButton';
import useSettings from '../../hooks/useSettings';
import TableHeader from '../UIElements/TableHeader';
import XDataGrid from '../UIElements/XDataGrid/XDataGrid';
import { createColumn, createDateColumn, createLandingColumn, createTimeColumn, sumTime } from '../Logbook/helpers';

export const ImportTable = () => {
  const [data, setData] = useState([]);
  const [inProgress, setInProgress] = useState(false);
  const { isSettingsLoading, fieldName } = useSettings();

  const columns = useMemo(() => {
    if (isSettingsLoading) {
      return [];
    }

    return [
      // date
      createDateColumn({ field: "date", headerName: fieldName("date"), width: 90 }),
      // departure
      createColumn({ field: "departure_place", headerName: fieldName("dep_place"), width: 60, valueGetter: (_value, row) => row.departure?.place }),
      createColumn({ field: "departure_time", headerName: fieldName("dep_time"), width: 55, type: 'string', valueGetter: (_value, row) => row.departure?.time }),
      // arrival
      createColumn({ field: "arrival_place", headerName: fieldName("arr_place"), width: 60, valueGetter: (_value, row) => row.arrival?.place }),
      createColumn({ field: "arrival_time", headerName: fieldName("arr_time"), width: 55, type: 'string', valueGetter: (_value, row) => row.arrival?.time }),
      // aircraft
      createColumn({ field: "aircraft_model", headerName: fieldName("model"), width: 70, valueGetter: (_value, row) => row.aircraft?.model }),
      createColumn({ field: "aircraft_reg", headerName: fieldName("reg"), width: 75, valueGetter: (_value, row) => row.aircraft?.reg_name }),
      // single pilot time
      createTimeColumn({ field: "se_time", headerName: fieldName("se") }),
      createTimeColumn({ field: "me_time", headerName: fieldName("me"), valueGetter: (_value, row) => row.time.mcc_time !== "" ? "" : row.time.me_time }),
      // MCC time
      createTimeColumn({ field: "mcc_time", headerName: fieldName("mcc") }),
      // total
      createTimeColumn({ field: "total_time", headerName: fieldName("total") }),
      // pic name
      createColumn({ field: "pic_name", headerName: fieldName("pic_name"), width: 150, align: 'left' }),
      // landings
      createLandingColumn({ field: "landings_day", headerName: fieldName("land_day") }),
      createLandingColumn({ field: "landings_night", headerName: fieldName("land_night") }),
      // operation condition time
      createTimeColumn({ field: "night_time", headerName: fieldName("night"), width: 60 }),
      createTimeColumn({ field: "ifr_time", headerName: fieldName("ifr"), width: 59 }),
      // pilot function time
      createTimeColumn({ field: "pic_time", headerName: fieldName("pic") }),
      createTimeColumn({ field: "co_pilot_time", headerName: fieldName("cop") }),
      createTimeColumn({ field: "dual_time", headerName: fieldName("dual") }),
      createTimeColumn({ field: "instructor_time", headerName: fieldName("instr") }),
      // sim
      createColumn({ field: "sim_type", headerName: fieldName("sim_type"), width: 60, valueGetter: (_value, row) => row.sim.type }),
      createColumn({ field: "sim_time", headerName: fieldName("sim_time"), width: 55, headerAlign: 'center', align: 'center', type: 'time', valueGetter: (_value, row) => row.sim.time, aggregationFn: sumTime }),
      // remarks
      createColumn({ field: "remarks", headerName: fieldName("remarks"), align: 'left', flex: 1, minWidth: 50 }),
    ];
  }, [isSettingsLoading, fieldName]);

  const columnGroupingModel = useMemo(() => {
    if (isSettingsLoading) {
      return [];
    }

    return [
      {
        groupId: 'Departure',
        headerName: <TableHeader title={fieldName("departure")} />,
        headerAlign: 'center',
        children: [
          { field: 'departure_place' }, { field: 'departure_time' },
        ],
      },
      {
        groupId: 'Arrival',
        headerName: <TableHeader title={fieldName("arrival")} />,
        headerAlign: 'center',
        children: [
          { field: 'arrival_place' }, { field: 'arrival_time' },
        ],
      },
      {
        groupId: 'Aircraft',
        headerName: <TableHeader title={fieldName("aircraft")} />,
        headerAlign: 'center',
        children: [
          { field: 'aircraft_model' }, { field: 'aircraft_reg' },
        ],
      },
      {
        groupId: 'Single Pilot',
        headerName: <TableHeader title={fieldName("spt")} />,
        headerAlign: 'center',
        children: [
          { field: 'se_time' }, { field: 'me_time' },
        ],
      },
      {
        groupId: 'Landings',
        headerName: <TableHeader title={fieldName("landings")} />,
        headerAlign: 'center',
        children: [
          { field: 'landings_day' }, { field: 'landings_night' },
        ],
      },
      {
        groupId: 'Operational Condition Time',
        headerName: <TableHeader title={fieldName("oct")} />,
        headerAlign: 'center',
        children: [
          { field: 'night_time' }, { field: 'ifr_time' },
        ],
      },
      {
        groupId: 'Pilot Function Time',
        headerName: <TableHeader title={fieldName("pft")} />,
        headerAlign: 'center',
        children: [
          { field: 'pic_time' }, { field: 'co_pilot_time' }, { field: 'dual_time' }, { field: 'instructor_time' },
        ],
      },
      {
        groupId: 'FSTD Sessions',
        headerName: <TableHeader title={fieldName("fstd")} />,
        headerAlign: 'center',
        children: [
          { field: 'sim_type' }, { field: 'sim_time' },
        ],
      },
    ];
  }, [isSettingsLoading, fieldName]);

  const customActions = useMemo(() => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <HelpButton />
      <ClearTableButton setData={setData} />
      <OpenCSVButton setData={setData} />
      <RunImportButton data={data} inProgress={inProgress} setInProgress={setInProgress} />
    </Box>
  ), [data, inProgress]);

  return (
    <>
      {inProgress && <LinearProgress />}
      <XDataGrid
        tableId='import-logbook'
        rows={data}
        columns={columns}
        columnGroupingModel={columnGroupingModel}
        getRowId={(row) => `${row.date}-${row.departure_place}-${row.departure_time}-${row.arrival_place}-${row.arrival_time}-${row.aircraft_reg}-${row.sim.type}-${row.sim.time}-${row.pic_name}`}
        footerFieldIdTotalLabel='aircraft_reg'
        showAggregationFooter={true}
        disableColumnMenu
        disableColumnSorting
        customActions={customActions}
      />
    </>
  );
}

export default ImportTable;