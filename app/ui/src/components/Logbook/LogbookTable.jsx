import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
// MUI UI elements
import Box from '@mui/material/Box';
// Custom components and libraries
import { getFilterLabel, landingFilterFn, timeFilterFn } from './helpers';
import PDFExportButton from './PDFExportButton';
import NewFlightRecordButton from './NewFlightRecordButton';
import { tableJSONCodec } from '../../constants/constants';
import { createColumn, createDateColumn, createLandingColumn, createTimeColumn, renderHeader, renderProps, renderTextProps, renderTotalFooter } from "./helpers";
import { dateFilterFn } from '../../util/helpers';
import CSVExportButton from '../UIElements/CSVExportButton';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';

const paginationKey = 'logbook-table-page-size';
const columnVisibilityKey = 'logbook-table-column-visibility';
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
      header: "Single Pilot", columns: [
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
      header: "PIC Name", columns: [
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
      Header: renderHeader(["Operation", "Condition Time"]),
      header: "Operation Condition Time", columns: [
        createTimeColumn("time.night_time", "Night"),
        createTimeColumn("time.ifr_time", "IFR"),
      ]
    },
    {
      header: "Pilot Function Time", columns: [
        createTimeColumn("time.pic_time", "PIC"),
        createTimeColumn("time.co_pilot_time", "COP"),
        createTimeColumn("time.dual_time", "Dual"),
        createTimeColumn("time.instructor_time", "Instr")
      ]
    },
    {
      header: "FSTD Session", columns: [
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
    renderTopToolbarCustomActions: renderTopToolbarCustomActions,
    onPaginationChange: setPagination,
    state: { pagination, columnFilters: columnFilters, columnVisibility },
    defaultColumn: { muiFilterTextFieldProps: getMuiFilterTextFieldProps },
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