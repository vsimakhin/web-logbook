import {
  MaterialReactTable, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton,
  MRT_ToggleGlobalFilterButton, MRT_ToggleFullScreenButton, useMaterialReactTable
} from 'material-react-table';
import { useCallback, useMemo, useState } from 'react';
import { useLocalStorageState } from '@toolpad/core/useLocalStorageState';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
// MUI UI elements
import Box from '@mui/material/Box';
// Custom components and libraries
import { getFilterLabel, landingFilterFn, timeFilterFn } from './helpers';
import PDFExportButton from './PDFExportButton';
import NewFlightRecordButton from './NewFlightRecordButton';
import { tableJSONCodec } from '../../constants/constants';
import {
  createColumn, createDateColumn, createLandingColumn, createTimeColumn,
  renderProps, renderTextProps, renderTotalFooter, createCustomFieldColumns,
  createCustomFieldColumnGroup,
} from "./helpers";
import { dateFilterFn } from '../../util/helpers';
import CSVExportButton from '../UIElements/CSVExportButton';
import TableFilterDrawer from '../UIElements/TableFilterDrawer';
import TableHeader from '../UIElements/TableHeader';
import ResetColumnSizingButton from '../UIElements/ResetColumnSizingButton';
import { fetchCustomFields } from '../../util/http/fields';
import { useErrorNotification } from '../../hooks/useAppNotifications';
import useSettings from '../../hooks/useSettings';

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
  const navigate = useNavigate();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useLocalStorageState(columnVisibilityKey, {}, { codec: tableJSONCodec });
  const [pagination, setPagination] = useLocalStorageState(paginationKey, { pageIndex: 0, pageSize: 15 }, { codec: tableJSONCodec });
  const [columnSizing, setColumnSizing] = useLocalStorageState(columnSizingKey, {}, { codec: tableJSONCodec });

  const { isSettingsLoading, getStandardFieldName, paginationOptions } = useSettings();

  // Load the list of custom fields
  const { data: customFields, isLoading: isCustomFieldsLoading, isError: isCustomFieldsError, error: customFieldsError } = useQuery({
    queryKey: ['custom-fields'],
    queryFn: ({ signal }) => fetchCustomFields({ signal, navigate }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });
  useErrorNotification({ isError: isCustomFieldsError, error: customFieldsError, fallbackMessage: 'Failed to load custom fields' });

  const filterFns = useMemo(() => ({
    dateFilterFn: dateFilterFn,
    timeFilterFn: timeFilterFn,
    landingFilterFn: landingFilterFn,
  }), []);

  const columns = useMemo(() => {
    if (isCustomFieldsLoading || isSettingsLoading) {
      return [];
    }

    return [
      {
        header: <TableHeader title={getStandardFieldName("date")} />, ...renderTextProps, columns: [
          createDateColumn("date", "", 90),
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("departure")} />, ...renderProps, columns: [
          createColumn("departure.place", getStandardFieldName("dep_place"), 55),
          createColumn("departure.time", getStandardFieldName("dep_time"), 50),
          ...createCustomFieldColumns(customFields, getStandardFieldName("departure"))
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("arrival")} />, columns: [
          createColumn("arrival.place", getStandardFieldName("arr_place"), 55),
          createColumn("arrival.time", getStandardFieldName("arr_time"), 50),
          ...createCustomFieldColumns(customFields, getStandardFieldName("arrival"))
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("aircraft")} />, columns: [
          createColumn("aircraft.model", getStandardFieldName("model"), 80),
          createColumn("aircraft.reg_name", getStandardFieldName("reg"), 80, false, renderTotalFooter()),
          ...createCustomFieldColumns(customFields, getStandardFieldName("aircraft"))
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("spt")} />,
        columns: [
          createTimeColumn("time.se_time", getStandardFieldName("se")),
          createTimeColumn("time.me_time", getStandardFieldName("me")),
          ...createCustomFieldColumns(customFields, getStandardFieldName("spt"))
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("mcc")} />, columns: [
          createTimeColumn("time.mcc_time", ""),
          ...createCustomFieldColumns(customFields, getStandardFieldName("mcc"))
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("total")} />, columns: [
          createTimeColumn("time.total_time", ""),
          ...createCustomFieldColumns(customFields, getStandardFieldName("total"))
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("pic_name")} />,
        columns: [
          createColumn("pic_name", "", 150, true)
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("landings")} />, columns: [
          createLandingColumn("landings.day", getStandardFieldName("land_day")),
          createLandingColumn("landings.night", getStandardFieldName("land_night")),
          ...createCustomFieldColumns(customFields, getStandardFieldName("landings"))
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("oct")} />,
        columns: [
          createTimeColumn("time.night_time", getStandardFieldName("night")),
          createTimeColumn("time.ifr_time", getStandardFieldName("ifr")),
          ...createCustomFieldColumns(customFields, getStandardFieldName("oct"))
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("pft")} />,
        columns: [
          createTimeColumn("time.pic_time", getStandardFieldName("pic")),
          createTimeColumn("time.co_pilot_time", getStandardFieldName("cop")),
          createTimeColumn("time.dual_time", getStandardFieldName("dual")),
          createTimeColumn("time.instructor_time", getStandardFieldName("instr")),
          ...createCustomFieldColumns(customFields, getStandardFieldName("pft"))
        ]
      },
      {
        header: <TableHeader title={getStandardFieldName("fstd")} />,
        columns: [
          createColumn("sim.type", getStandardFieldName("sim_type"), 70),
          createTimeColumn("sim.time", getStandardFieldName("sim_time")),
          ...createCustomFieldColumns(customFields, getStandardFieldName("fstd"))
        ]
      },
      ...createCustomFieldColumnGroup(customFields),
      {
        header: <TableHeader title={getStandardFieldName("remarks")} />, grow: true, columns: [
          { accessorKey: "remarks", header: "", grow: true, ...renderTextProps },
          ...createCustomFieldColumns(customFields, getStandardFieldName("remarks"))
        ]
      }
    ];
  }, [customFields, isCustomFieldsLoading, getStandardFieldName]);

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
    getFilterLabel(column, getStandardFieldName)
  ), [getStandardFieldName, getFilterLabel]);

  const table = useMaterialReactTable({
    columns: columns,
    data: data ?? [],
    isLoading: isLoading || isSettingsLoading || isCustomFieldsLoading,
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
    muiPaginationProps: {
      rowsPerPageOptions: paginationOptions,
    },
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