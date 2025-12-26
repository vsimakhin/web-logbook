import { MaterialReactTable, MRT_ShowHideColumnsButton, MRT_ToggleFullScreenButton, MRT_ToggleGlobalFilterButton, useMaterialReactTable } from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
// Custom components and libraries
import { tableJSONCodec } from '../../constants/constants';
import { createColumn, createDateColumn, createLandingColumn, createTimeColumn, renderProps, renderTextProps, renderTotalFooter } from "./helpers";
import OpenCSVButton from './OpenCSVButton';
import ClearTableButton from './ClearTableButton';
import RunImportButton from './RunImportButton';
import ResetColumnSizingButton from '../UIElements/ResetColumnSizingButton';
import HelpButton from './HelpButton';

const paginationKey = 'import-table-page-size';
const columnVisibilityKey = 'import-table-column-visibility';
const columnSizingKey = 'logbook-table-column-sizing';

const tableOptions = {
  initialState: { density: 'compact' },
  enableColumnResizing: true,
  enableGlobalFilterModes: true,
  enableColumnFilters: false,
  enableColumnDragging: false,
  enableColumnPinning: false,
  enableGrouping: true,
  enableDensityToggle: false,
  columnResizeMode: 'onEnd',
  muiTablePaperProps: { variant: 'outlined', elevation: 0 },
  columnFilterDisplayMode: 'custom',
  enableFacetedValues: true,
  enableSorting: false,
  enableColumnActions: false,
};

export const ImportTable = () => {
  const [data, setData] = useState([]);
  const [inProgress, setInProgress] = useState(false);

  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const columns = useMemo(() => [
    {
      header: "Date", ...renderTextProps, columns: [
        createDateColumn("date", "", 90),
      ]
    },
    {
      header: "Departure", ...renderProps, columns: [
        createColumn("departure_place", "Place", 55),
        createColumn("departure_time", "Time", 50)
      ]
    },
    {
      header: "Arrival", columns: [
        createColumn("arrival_place", "Place", 55),
        createColumn("arrival_time", "Time", 50)
      ]
    },
    {
      header: "Aircraft", columns: [
        createColumn("aircraft_model", "Type", 80),
        createColumn("aircraft_reg_name", "Reg", 80, false, renderTotalFooter())
      ]
    },
    {
      header: "Time", columns: [
        createTimeColumn("se_time", "SE"),
        createTimeColumn("me_time", "ME"),
        createTimeColumn("mcc_time", "MCC"),
        createTimeColumn("total_time", "Total"),
        createTimeColumn("night_time", "Night"),
        createTimeColumn("ifr_time", "IFR"),
        createTimeColumn("pic_time", "PIC"),
        createTimeColumn("co_pilot_time", "COP"),
        createTimeColumn("dual_time", "Dual"),
        createTimeColumn("instructor_time", "Instr")
      ]
    },
    {
      header: "Landings", columns: [
        createLandingColumn("landings_day", "Day"),
        createLandingColumn("landings_night", "Night")
      ]
    },
    {
      header: "FSTD Session", columns: [
        createColumn("sim_type", "Type", 70),
        createTimeColumn("sim_time", "Time")
      ]
    },
    {
      header: "PIC Name", columns: [
        createColumn("pic_name", "", 150, true)
      ]
    },
    {
      header: "Remarks", grow: true, columns: [
        { accessorKey: "remarks", header: "", grow: true, ...renderTextProps },
      ]
    }
  ], []);

  const renderTopToolbarCustomActions = useCallback(() => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <ClearTableButton setData={setData} />
      <OpenCSVButton setData={setData} />
      <RunImportButton data={data} inProgress={inProgress} setInProgress={setInProgress} />
    </Box>
  ), [data, inProgress, setInProgress, setData]);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <HelpButton />
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), [setColumnSizing]);

  const table = useMaterialReactTable({
    columns: columns,
    data: data ?? [],
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    renderToolbarInternalActions: renderToolbarInternalActions,
    onPaginationChange: setPagination,
    state: { pagination, columnVisibility, columnSizing },
    ...tableOptions,
  });

  return (
    <>
      {inProgress && <LinearProgress />}
      <MaterialReactTable table={table} />
    </>
  );
}

export default ImportTable;