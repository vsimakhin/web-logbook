import {
  MaterialReactTable, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton,
  MRT_ToggleGlobalFilterButton, MRT_ToggleFullScreenButton, useMaterialReactTable
} from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Box from '@mui/material/Box';
// Custom components and libraries
import { getFilterLabel, landingFilterFn, timeFilterFn } from './helpers';
import PDFExportButton from './PDFExportButton';
import NewFlightRecordButton from './NewFlightRecordButton';
import { tableJSONCodec } from '../../constants/constants';
import {
  createColumn, createDateColumn, createLandingColumn, createTimeColumn,
  renderProps, renderTextProps, renderTotalFooter
} from "./helpers";
import { dateFilterFn } from '../../util/helpers';
import CSVExportButton from '../UIElements/CSVExportButton';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';
import TableHeader from '../UIElements/TableHeader';
import ResetColumnSizingButton from '../UIElements/ResetColumnSizingButton';

const paginationKey = 'logbook-table-page-size';
const columnVisibilityKey = 'logbook-table-column-visibility';
const columnSizingKey = 'logbook-table-column-sizing';

const tableOptions = {
  initialState: { density: 'compact' },
  enableColumnResizing: true,
  enableGlobalFilterModes: true,
  enableColumnFilters: true,
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

export const LogbookTable = ({ data, isLoading }) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });
  const filterFns = useMemo(() => ({
    dateFilterFn: dateFilterFn,
    timeFilterFn: timeFilterFn,
    landingFilterFn: landingFilterFn,
  }), []);

  const columns = useMemo(() => [
    {
      header: "Date", ...renderTextProps, columns: [
        createDateColumn("date", "", 90),
      ]
    },
    {
      header: "Departure", ...renderProps, columns: [
        createColumn("departure.place", "Place", 55),
        createColumn("departure.time", "Time", 50)
      ]
    },
    {
      header: "Arrival", columns: [
        createColumn("arrival.place", "Place", 55),
        createColumn("arrival.time", "Time", 50)
      ]
    },
    {
      header: "Aircraft", columns: [
        createColumn("aircraft.model", "Type", 80),
        createColumn("aircraft.reg_name", "Reg", 80, false, renderTotalFooter())
      ]
    },
    {
      header: <TableHeader title="Single Pilot" />,
      columns: [
        createTimeColumn("time.se_time", "SE"),
        createTimeColumn("time.me_time", "ME"),
      ]
    },
    {
      header: "MCC", columns: [
        createTimeColumn("time.mcc_time", "MCC")
      ]
    },
    {
      header: "Total", columns: [
        createTimeColumn("time.total_time", "")
      ]
    },
    {
      header: <TableHeader title="PIC Name" />,
      columns: [
        createColumn("pic_name", "", 150, true)
      ]
    },
    {
      header: "Landings", columns: [
        createLandingColumn("landings.day", "Day"),
        createLandingColumn("landings.night", "Night")
      ]
    },
    {
      header: <TableHeader title="Operation Condition Time" />,
      columns: [
        createTimeColumn("time.night_time", "Night"),
        createTimeColumn("time.ifr_time", "IFR"),
      ]
    },
    {
      header: <TableHeader title="Pilot Function Time" />,
      columns: [
        createTimeColumn("time.pic_time", "PIC"),
        createTimeColumn("time.co_pilot_time", "COP"),
        createTimeColumn("time.dual_time", "Dual"),
        createTimeColumn("time.instructor_time", "Instr")
      ]
    },
    {
      header: <TableHeader title="FSTD Session" />,
      columns: [
        createColumn("sim.type", "Type", 70),
        createTimeColumn("sim.time", "Time")
      ]
    },
    {
      header: "Remarks", grow: true, columns: [
        { accessorKey: "remarks", header: "", grow: true, ...renderTextProps },
      ]
    }
  ], []);

  const renderTopToolbarCustomActions = useCallback(({ table }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <NewFlightRecordButton />
      <CSVExportButton table={table} type="logbook" />
      <PDFExportButton />
    </Box>
  ), []);

  const renderToolbarInternalActions = useCallback(({ table }) => (
    <>
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleFullScreenButton table={table} />
      <ResetColumnSizingButton resetFunction={setColumnSizing} />
    </>
  ), []);

  const filterDrawOpen = useCallback(() => {
    setIsFilterDrawerOpen(true);
  }, []);

  const filterDrawClose = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, []);

  const getMuiFilterTextFieldProps = useCallback(({ column }) => (
    getFilterLabel(column)
  ), []);

  const table = useMaterialReactTable({
    columns: columns,
    data: data ?? [],
    isLoading: isLoading,
    onShowColumnFiltersChange: filterDrawOpen,
    filterFns: filterFns,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onPaginationChange: setPagination,
    state: {
      pagination,
      columnFilters: columnFilters,
      columnVisibility,
      columnSizing: columnSizing
    },
    defaultColumn: { muiFilterTextFieldProps: getMuiFilterTextFieldProps },
    renderToolbarInternalActions: renderToolbarInternalActions,
    ...tableOptions,
  });

  return (
    <>
      <MaterialReactTable table={table} />
      <TableFilterDrawer table={table} isFilterDrawerOpen={isFilterDrawerOpen} onClose={filterDrawClose} />
    </>
  );
}

export default LogbookTable;